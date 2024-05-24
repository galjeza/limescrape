const puppeteer = require("puppeteer");
const { wait } = require("./utils/utils");
const fs = require("fs");
const axios = require("axios");

const EMAIL = "sobica.claudia@gmail.com";
const PASSWORD = "lanablaz";
const PRICEPILOTID = "199";

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1024 });
  let token = "";

  await page.goto("https://admin.pricepilot.io/avtentikacija/prijava");
  await page.type("#email", EMAIL);
  await page.type("#password", PASSWORD);
  await page.click("#submit");
  await page.waitForNavigation({
    waitUntil: "networkidle0",
  });
  const cookies = await page.cookies();
  token = cookies.find((cookie) => cookie.name === "token").value;
  await browser.close();

  const customersUrl = `https://api.pricepilot.io/providers/${PRICEPILOTID}/providerusers?page=1&pageSize=100000&positions%5B%5D=(lt)20&sortBy=user.lastname&sortOrder=asc`;

  const customersResponse = await axios.get(customersUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const customersRaw = customersResponse.data._embedded.provideruser;
  let customersFormatted = [];
  for (const c of customersRaw) {
    const customer = c.user;
    console.log(customer);
    let notes = "";
    if (customer.dateOfBirth) {
      notes += `Datum rojstva: ${customer.dateOfBirth}\n`;
    }
    if (customer.loyalityClubMemberId) {
      notes += `Loyalty club member: ${customer.loyalityClubMemberId}\n`;
    }

    if (customer.streetAddressLine1) {
      notes += `Naslov: ${customer.streetAddressLine1}\n`;
    }

    if (customer.zipCode) {
      notes += `Pošta: ${customer.zipCode}\n`;
    }

    if (customer.city) {
      notes += `Mesto: ${customer.city}\n`;
    }

    const customerFormatted = {
      name: customer.firstname,
      lastName: customer.lastname,
      email: customer.contactEmail || null,
      gsm: customer.phone?.split(" ")[1] || null,
      countryCode: customer.phone?.split(" ")[0].replace("+", "") || null,
      notes: notes || "",
    };
    customersFormatted.push(customerFormatted);
  }

  fs.writeFileSync(
    "./output/fika/customersNew3.json",
    JSON.stringify(customersFormatted)
  );
})();
