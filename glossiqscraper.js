const puppeteer = require("puppeteer");
const { wait } = require("./utils/utils");
const fs = require("fs");
const ProgressBar = require("progress");

const GLOSSIQID = "b512032b-2d2a-45c1-a4d7-7261ebb5ff80";
const GETSERVICES = false;

const EMAIL = "samanthabeautyluxe@gmail.com";
const PASSWORD = "Glossiq55!";
const LOGINURL =
  "https://sso.glossiq.com/account/login?returnUrl=%2Fconnect%2Fauthorize%2Fcallback%3Fclient_id%3DGlossiq%26redirect_uri%3Dhttps%253A%252F%252Fwww.glossiq.com%252Fsignin-oidc%26response_type%3Dcode%26scope%3Dopenid%2520profile%2520email%2520GlossiqApi%26state%3D2e44065535f54a2789fb4db8004f62be%26code_challenge%3D8CdWF12gEs_gLT8wZXK7HyQsvDWnQE1ZNB1zqyWVW-A%26code_challenge_method%3DS256%26response_mode%3Dquery";

// Parallel scraping configuration
const NUM_BROWSERS = 5;
const DAYS_PER_BROWSER = 73;

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

async function loginAndFetchAppointments(
  startDate,
  numDays,
  bar,
  browserIndex
) {
  const appointments = [];

  const browser = await puppeteer.launch({
    args: ["--force-device-scale-factor=0.5"],
    headless: true,
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 3000,
    height: 2500,
  });

  await page.goto(LOGINURL);
  await page.type("#Email", EMAIL);
  await wait(1);
  await page.type("#Password", PASSWORD);
  await wait(1);
  await page.click('button[type="submit"]');
  await wait(5);

  let currentDate = new Date(startDate);

  console.log(
    `Browser ${browserIndex + 1} scraping from ${formatDate(
      currentDate
    )} for ${numDays} days`
  );

  for (let i = 0; i < numDays; i++) {
    const formattedDate = formatDate(currentDate);
    await page.goto(
      `https://www.glossiq.com/shop/${GLOSSIQID}/appointments/ebf7dc39-148b-4c27-b62e-5f50f71631ef?calendarDate=${formattedDate}T00%3A00%3A00.000Z`
    );

    await wait(7);
    const acceptButtons = await page.$$(
      ".btnPrimary.bsPortalBtn.bsPortalBtnLarge"
    );
    if (acceptButtons.length > 1) {
      await acceptButtons[1].click();
      await wait(3);
    }

    await page.evaluate(() => {
      const header = document.querySelector("#header");
      if (header) {
        header.remove();
      }
    });

    const stringDate = formattedDate.split("-").reverse().join(".");
    console.log(`Scraping appointments for ${stringDate}`);
    const eventElements = await page.$$(".event");

    for (const element of eventElements) {
      let serviceName = null;
      try {
        serviceName = await element.$eval(".appointment-name", (el) =>
          el.textContent.trim()
        );
      } catch (error) {}

      let timeFrom = null;
      let timeTo = null;
      try {
        const timeString = await element.$eval(".details", (el) =>
          el.textContent.trim()
        );
        timeFrom = timeString.slice(0, 5);
        timeTo = timeString.slice(8, 13);
      } catch (error) {
        console.log(error);
      }

      let customerNameFull = null;
      let phoneFullRaw = null;
      let countryCode = null;
      let phone = null;
      let subjectName = null;

      await element.click();
      await page.waitForSelector(".right-side-title__title");
      await wait(1);

      try {
        customerNameFull = await page.$eval(
          ".customer-card__info__name",
          (el) => el.textContent.trim()
        );
      } catch (error) {
        customerNameFull = await page.$eval(".right-side-title__title", (el) =>
          el.textContent.trim()
        );
      }

      try {
        phoneFullRaw = await page.$eval(
          ".customer-card__info__contact-info__phoneNumber",
          (el) => el.textContent.trim()
        );
        countryCode = phoneFullRaw.substring(1, 4);
        phone = phoneFullRaw.substring(4).replace(/\s/g, "");
      } catch (error) {}

      await wait(1);

      const subjectElement =
        (await page.$(".main-booking-screen__service__desktop__memberName")) ||
        (await page.$(".add-edit-blocked-time__resourceName"));

      subjectName = await subjectElement.evaluate((el) =>
        el.textContent.trim()
      );

      const closeButton = await page.$(".right-side-title__close");
      await closeButton.click();
      const appointment = {
        locationLabel: "The Mens Room",
        service: serviceName,
        userLabel: subjectName,
        name: customerNameFull?.split(" ")[0],
        lastName: customerNameFull?.split(" ").slice(1).join(" "),
        timeFrom,
        timeTo,
        date: stringDate,
        gsm: phone,
        countryCode,
      };
      await wait(1);
      appointments.push(appointment);
    }

    currentDate.setDate(currentDate.getDate() + 1);
    bar.tick();
  }

  await browser.close();
  return appointments;
}

(async () => {
  const allAppointments = [];
  const promises = [];
  const totalDays = NUM_BROWSERS * DAYS_PER_BROWSER;
  const bar = new ProgressBar(":bar :current/:total", { total: totalDays });

  const startDate = new Date("2023-08-01"); // Starting date

  for (let i = 0; i < NUM_BROWSERS; i++) {
    const browserStartDate = new Date(startDate);
    browserStartDate.setDate(startDate.getDate() + i * DAYS_PER_BROWSER);
    promises.push(
      loginAndFetchAppointments(browserStartDate, DAYS_PER_BROWSER, bar, i)
    );
  }

  const results = await Promise.all(promises);
  results.forEach((appointments) => {
    allAppointments.push(...appointments);
  });

  fs.writeFileSync(
    "./output/samanthabeautyluxe@gmail.com/appointments1.json",
    JSON.stringify(allAppointments, null, 2)
  );
})();
