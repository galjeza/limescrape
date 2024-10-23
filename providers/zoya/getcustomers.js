const puppeteer = require("puppeteer");

const EMAIL = "aromasanja@gmail.com";
const PASSWORD = "Sanja1309";
const fs = require("fs");
(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 }); // Set full-screen width and height
  await page.goto("https://app.zoyya.com/login");
  await page.waitForSelector("[data-cy='button_email']");
  await page.click("[data-cy='button_email']");

  await page.waitForSelector("[data-cy='input_email']");

  await page.type("[data-cy='input_email']", EMAIL);
  await page.type("[data-cy='input_password']", PASSWORD);

  await page.click("[data-cy='button_submit']");

  await page.waitForNavigation({
    waitUntil: "networkidle0",
  });

  await page.goto("https://partner.zoyya.com/rneax/1262/clients/list");

  // Wait for the specified element to load and then click it
  await page.waitForSelector(".top-4");
  await page.click(".top-4");

  // Scroll down within the scrollable element with class 'List' for a couple of minutes to load all clients
  const scrollDuration = 2 * 60 * 1000; // 2 minutes in milliseconds
  const startTime = Date.now();

  const customers = [];

  while (Date.now() - startTime < scrollDuration) {
    const clientElements = await page.$$(".List > div > div");
    for (const clientElement of clientElements) {
      const clientName = await clientElement.$eval(
        "div:nth-child(1)",
        (el) => el.textContent
      );

      const clientPhone = await clientElement.$eval(
        "div:nth-child(3)",
        (el) => el.textContent
      );

      const clientEmailLink = await clientElement.$('a[href*="mailto:"]');
      let clientEmail = clientEmailLink
        ? await clientEmailLink.evaluate(
            (el) => el.getAttribute("href").split(":")[1]
          )
        : null;

      // Split name into first and last name
      let [firstName, ...lastNameParts] = clientName.split(" ");

      const lastName = lastNameParts.join(" ");

      if (
        firstName.length > 2 &&
        firstName[1] === lastName[0] &&
        firstName[0] === firstName[2]
      ) {
        firstName = firstName.substring(2);
      }

      if (firstName.length > 1 && firstName[0] === firstName[1]) {
        firstName = firstName.substring(1);
      }

      let countryCode = clientPhone.substring(0, 4).replace("+", "");
      let phoneNumber = clientPhone.substring(4);

      if (phoneNumber.length <= 6) {
        phoneNumber = null;
        countryCode = null;
      }

      if (clientEmail.length < 6) {
        clientEmail = null;
      }
      const client = {
        name: firstName,
        lastName: lastName,
        countryCode: countryCode,
        gsm: phoneNumber,
        email: clientEmail,
      };
      customers.push(client);
    }
    await page.evaluate(() => {
      const scrollableElement = document.querySelector(".List");
      if (scrollableElement) {
        scrollableElement.scrollBy(0, scrollableElement.clientHeight);
      }
    });
    await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for 500ms between scrolls
  }

  console.log(customers.length);

  uniqueCustomers = Array.from(new Set(customers.map(JSON.stringify))).map(
    JSON.parse
  );
  console.log(uniqueCustomers);
  console.log(uniqueCustomers.length);

  fs.writeFileSync(
    "./customers.json",
    JSON.stringify(uniqueCustomers, null, 2)
  );
  await browser.close();
})();
