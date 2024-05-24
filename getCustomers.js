const puppeteer = require("puppeteer");
const { wait } = require("./utils/utils");
const fs = require("fs");
const EMAIL = "blumlepotnistudio@gmail.com";
const PASSWORD = "MMO0d4";
(async () => {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1024 });

  await page.goto("https://www.myplanly.com/login");
  await page.type("#email", EMAIL);
  await wait(1);
  await page.type("#pass", PASSWORD);
  await wait(1);
  await page.click('button[type="submit"]');
  await wait(3);

  let counter = 1;
  const numPages = 19;
  await page.goto("https://www.myplanly.com/clients");
  const customers = [];
  while (counter <= numPages) {
    await page.waitForSelector("#grid_DXMainTable");
    // get table by id grid_DXMainTable
    const table = await page.$("#grid_DXMainTable");
    // iterate over all rows in the table
    const rows = await table.$$("tr");
    for (const row of rows) {
      // get table data from the row
      // check if the id of the row starts with "grid_DXDataRow"
      const id = await row.evaluate((node) => node.getAttribute("id"));
      if (!id?.startsWith("grid_DXDataRow")) {
        continue;
      }
      const tds = await row.$$("td");

      const fullName = await tds[0].evaluate((node) => node.innerText);
      const fullNameCaseFixed = fullName
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      const name = fullNameCaseFixed.split(" ")[0];

      const lastName = fullNameCaseFixed.replace(name, "").trim();
      let email = await tds[1].evaluate((node) => node.innerText);
      email = email.replace(/\s/g, "");
      if (email === "") {
        email = null;
      }
      const gsmRaw = await tds[2].evaluate((node) => node.innerText);
      const countryCode = "386";
      const gsm = gsmRaw.replace(countryCode, "0").trim();
      const customer = {
        name,
        lastName,
        email,
        gsm,
        countryCode,
      };

      customers.push(customer);
    }

    if (counter !== numPages) {
      const buttons = await page.$$(".dxp-button.dxp-bi");
      const nextButton = buttons[1];
      await nextButton.click();
    }

    console.clear();
    console.log(`Page ${counter + 1} of ${numPages}`);
    const progress = Math.round(((counter + 1) / numPages) * 100);
    console.log("Progress: " + progress + "%");
    counter++;
    await wait(1);
  }

  await browser.close();
  fs.writeFileSync(
    "./output/blum/customers.json",
    JSON.stringify(customers, null, 2)
  );
})();
