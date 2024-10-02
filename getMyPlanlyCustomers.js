const puppeteer = require("puppeteer");
const { wait } = require("./utils/utils");
const fs = require("fs");

const EMAIL = "odskocnica@gmail.com";
const PASSWORD = "niko123";

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1024 });

  // Login
  await page.goto("https://www.myplanly.com/login");
  await page.type("#email", EMAIL);
  await wait(1);
  await page.type("#pass", PASSWORD);
  await wait(1);
  await page.click('button[type="submit"]');
  await wait(3);
  await page.goto("https://www.myplanly.com/clients");

  const customers = [];
  let currentPage = 1;

  const totalPages = await page.$eval("b.dxp-lead.dxp-summary", (element) => {
    const content = element.textContent; // e.g., "Page 1 of 3 (60 items)"

    // Use a regular expression to extract the number of total pages
    const match = content.match(/of (\d+)/); // Matches "of " followed by one or more digits

    return match ? parseInt(match[1], 10) : null; // Returns the total number of pages, or null if not found
  });

  console.log("Total number of customer pages: ", totalPages);

  while (currentPage <= totalPages) {
    // table has id grid_DXMainTable
    // get all rows from table

    const table = await page.$("#grid_DXMainTable");
    const rows = await table.$$("tr[id^='grid_DXDataRow']");
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const cells = await row.$$("td");

      // Split fullName into name and lastName
      let fullName = await cells[0].evaluate((node) => node.innerText);
      // remove all spaces from the beginning and end of the string
      fullName = fullName.trim();
      const [name, ...lastNameParts] = fullName.split(" ");
      const lastName = lastNameParts.join(" ");

      // Handle empty email strings
      const email = await cells[1].evaluate((node) =>
        node.innerText.trim() === "" ? null : node.innerText
      );

      // Extract countryCode and gsm from fullPhone
      const fullPhone = await cells[2].evaluate((node) => node.innerText);
      const countryCode = fullPhone.length > 6 ? "386" : null;
      const gsm = fullPhone.length > 6 ? fullPhone : null;

      const customer = {
        name: name,
        lastName: lastName,
        email: email,
        gsm: gsm,
        countryCode: countryCode,
      };
      customers.push(customer);
    }
    currentPage++;
    await wait(1);
    if (currentPage > totalPages) {
      break;
    }
    try {
      await page.click(".dxWeb_pNext_Metropolis");
    } catch (error) {
      console.log(error);
    }
  }
  await browser.close();
  fs.writeFileSync(
    "./output/odskocnica/customers.json",
    JSON.stringify(customers, null, 2)
  );
})();
