const puppeteer = require("puppeteer");
const { wait } = require("./utils/utils");
const fs = require("fs");

const GLOSSIQID = "1edc1bfa-10a9-4e16-9071-aaa4bf411e11";
const GETSERVICES = true;

const EMAIL = "julijasturm3@gmail.com";
const PASSWORD = "Nikajepujsa1!";
const LOGINURL =
  "https://sso.glossiq.com/account/login?returnUrl=%2Fconnect%2Fauthorize%2Fcallback%3Fclient_id%3DGlossiq%26redirect_uri%3Dhttps%253A%252F%252Fwww.glossiq.com%252Fsignin-oidc%26response_type%3Dcode%26scope%3Dopenid%2520profile%2520email%2520GlossiqApi%26state%3D2e44065535f54a2789fb4db8004f62be%26code_challenge%3D8CdWF12gEs_gLT8wZXK7HyQsvDWnQE1ZNB1zqyWVW-A%26code_challenge_method%3DS256%26response_mode%3Dquery";
(async () => {
  const appointments = [];
  const services = [];
  try {
    const browser = await puppeteer.launch({
      headless: false,
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Login
    await page.goto(LOGINURL);
    await page.type("#Email", EMAIL);
    await wait(1);
    await page.type("#Password", PASSWORD);
    await wait(1);
    await page.click('button[type="submit"]');
    await wait(5);
    if (GETSERVICES) {
      // click on https://www.glossiq.com/shop/7ebc37ec-2090-4336-85bd-c0452f18cbce/5b5dfcdc-89d2-4406-aaaf-3af8cc0300c5/edit/services
      await page.goto(
        `https://www.glossiq.com/shop/${GLOSSIQID}/edit/services`
      );

      await wait(10);

      // get elements with class serviceCardHolder
      const serviceHolderElements = await page.$$(".serviceCardHolder");

      for (const element of serviceHolderElements) {
        try {
          let name = await element.$eval(".serviceName__name", (el) =>
            el.textContent.trim()
          );
          let price = await element.$eval(".serviceName__price", (el) =>
            el.textContent.trim()
          );
          let duration = await element.$eval(".serviceName__duration", (el) =>
            el.textContent.trim()
          );

          // replace all whitespaces and non digit chars from duration
          duration = duration.replace(/\s/g, "").replace(/\D/g, "");
          // remove whitespaces and € sign from price
          price = price.replace(/\s/g, "").replace("€", "");

          console.log({ name, price, duration });

          services.push({ name, price, duration, max: "1", min: "1" });
        } catch (error) {
          console.log(error);
        }
      }

      // Make sure to close the browser after fetching all the data
      console.log(services);
    }

    // go to appointment page
    await page.goto(`https://www.glossiq.com/shop/${GLOSSIQID}/appointments`);

    await wait(7);
    // click on second button with classes: btnPrimary bsPortalBtn bsPortalBtnLarge
    const acceptButtons = await page.$$(
      ".btnPrimary.bsPortalBtn.bsPortalBtnLarge"
    );
    await acceptButtons[1].click();

    console.log("clicked on button");
    let date = null;
    let numDays = 29;
    let daysAddAtBegining = 29;

    for (let i = 0; i < daysAddAtBegining; i++) {
      const buttons = await page.$$(".calendarDateSelect button");
      await buttons[1].click();
    }
    await page.setRequestInterception(true);

    page.on("request", (request) => {
      if (
        request.isNavigationRequest() &&
        request.redirectChain().length !== 0
      ) {
        request.abort();
      } else {
        request.continue();
      }
    });
    let currentUrl = page.url();
    while (numDays > 0) {
      await wait(3);
      // remove #header from dom
      await page.evaluate(() => {
        const header = document.querySelector("#header");
        if (header) {
          header.remove();
        }
      });
      numDays--;
      currentUrl = page.url();

      // get stringdate which is inside of calendarDateSelect div

      let stringDate = await page.$eval(".calendarDateSelect", (el) =>
        el.textContent.trim()
      );

      stringDate = stringDate.slice(4).replace(/\s/g, "");

      console.log(stringDate);

      date = new Date(stringDate);

      // get all elemeents wiht class event
      const eventElements = await page.$$(".event");

      for (const element of eventElements) {
        let serviceName = null;
        try {
          serviceName = await element.$eval(".appointment-name", (el) =>
            el.textContent.trim()
          );
        } catch (error) {}

        // get timeFrom and Timeto from strinf 09:00 - 10:00 • OTON
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

        // find subject name by class main-booking-screen__service__desktop__memberName

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
          customerNameFull = await page.$eval(
            ".right-side-title__title",
            (el) => el.textContent.trim()
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

        // check if main-bookin-screen__service__desktop__memberName exists

        await wait(1);

        let subjectElement =
          (await page.$(
            ".main-booking-screen__service__desktop__memberName"
          )) || (await page.$(".add-edit-blocked-time__resourceName"));

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
        console.log(appointment);
      }

      const buttons = await page.$$(".calendarDateSelect button");
      await buttons[1].click();
      // wait for page to load
      console.log("clicked on button");

      console.log(page.url());
      await wait(3);
    }

    await browser.close();

    /*
    fs.writeFileSync(
      "./output/nikapujsa/services.json",
      JSON.stringify(services, null, 2)
    );
    */

    fs.writeFileSync(
      "./output/nikapujsa/appointments1.json",
      JSON.stringify(appointments, null, 2)
    );
  } catch (error) {
    console.log(error);
    await wait(1000);
  }
})();
