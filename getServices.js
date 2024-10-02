const puppeteer = require("puppeteer");
const { wait } = require("./utils/utils");
const fs = require("fs");

const EMAIL = "petra.ogrin93@gmail.com";
const PASSWORD = "Fizio_Petra0303";

(async () => {
  console.log("Migration started");
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1024 });

  console.log("Logging in...");
  // Login
  await page.goto("https://www.myplanly.com/login");
  await page.type("#email", EMAIL);
  await wait(1);
  await page.type("#pass", PASSWORD);
  await wait(1);
  await page.click('button[type="submit"]');
  await wait(3);
  await page.goto("https://www.myplanly.com/settingsservices.aspx");

  // Pridobi podatke o storitvah
  const services = [];
  const iframeSources = [];
  const tags = [];

  // genrate a color based on a string
  const generateColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();

    return "#" + "00000".substring(0, 6 - c.length) + c;
  };

  const tables = await page.$$(".table.table-striped");
  let rows = [];
  for (const table of tables) {
    rows = await table.$$("tbody tr");
    for (const row of rows) {
      // press on button inside of the row with class "btn btn-primary"
      const button = await row.$("button.btn.btn-primary");
      await button.click();
      await wait(2);
      const iframe = await page.$(".fancybox-iframe");
      const src = await iframe.evaluate((node) => node.getAttribute("src"));
      iframeSources.push(src);
      await wait(1);
      await page.click(".fancybox-close");
      await wait(1);
    }
  }

  for (const src of iframeSources) {
    await page.goto("https://www.myplanly.com" + src);
    await wait(2);
    const name = await page.$eval("#name", (node) => node.value);
    const price = await page.$eval("#price", (node) => node.value);
    const duration = await page.$eval("#duration", (node) => node.value);
    const min = await page.$eval("#min", (node) => node.value);
    const max = await page.$eval("#max", (node) => node.value);
    const tag = await page.$eval(".item", (node) => node.innerText);
    // generate color for tag if it doesn't exist
    // check if tag with name tag is already in tags
    let tagObject = tags.find((tag) => tag.name === tag);
    if (!tagObject) {
      tagObject = {
        name: tag,
        color: generateColor(tag),
      };

      tags.push(tagObject);
    }

    const service = {
      name,
      price,
      duration,
      min,
      max,
      tag,
      color: tagObject.color,
    };
    console.log(service);
    services.push(service);
  }

  await browser.close();
  fs.writeFileSync(
    "./output/petraogrin/services.json",
    JSON.stringify(services, null, 2)
  );
})();
