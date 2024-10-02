const puppeteer = require("puppeteer");
const { wait } = require(".././utils/utils");
const fs = require("fs");

const EMAIL = "dfreshcut1@gmail.com";
const PASSWORD = "Vednofresh1";
const SCRAPE_SERVICES = true;

const generateColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();

  return "#" + "00000".substring(0, 6 - c.length) + c;
};

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1024 });
  await page.goto("https://my.setmore.com/");
  await page.waitForSelector("#username");
  await page.type("#username", EMAIL);
  await page.type("#password", PASSWORD);
  await wait(1);
  await page.click("#sm-login-btn");

  // Wait until navigation or certain content is loaded
  await page.waitForSelector("#cn-main-nav", { timeout: 10000000 });

  if (SCRAPE_SERVICES) {
    let services = [];
    await page.goto("https://go.setmore.com/easy-share");

    await page.waitForSelector(".meeting-card__top", { timeout: 1000000 });
    await wait(2);

    const listContainer = await page.$("#list-container");
    const listItems = await listContainer.$$("[role=listitem]");

    console.log("Total items found:", listItems.length);

    for (const item of listItems) {
      console.log("Clicking item number:", listItems.indexOf(item));
      await page.waitForTimeout(5000);
      await item.click(".meeting-card__more-btn");
      await page.waitForTimeout(4000);

      // Wait for details to be loaded after clicking the item
      await page.waitForSelector("#duration", { timeout: 10000 });

      const duration = await page.$eval("#duration", (node) => node.value);
      const buffer = await page.$eval("#buffer\\.after", (el) => el.value);
      const price = await page.$eval("#price", (node) => node.value);
      const name = await page.$eval("#title", (node) => node.value);

      const tag = await page.$$eval(".awd-input.fx", (elements) => {
        if (elements.length < 3) {
          return null;
        }
        return elements[2].textContent.trim();
      });

      const workerElements = await page.$$(".awd-sidebar__label.ml-4");
      const workers = [];

      for (const workerElement of workerElements) {
        const parent = await page.evaluateHandle(
          (el) => el.parentElement,
          workerElement
        );

        const isChecked = await parent.$(".awd-checkbox--checked");
        if (isChecked) {
          const worker = await page.evaluate(
            (el) => el.textContent,
            workerElement
          );
          workers.push(worker);
        }
      }

      let timeOffDuration = parseInt(buffer);
      let timeOffStart = null;
      if (timeOffDuration > 0) {
        timeOffStart = parseInt(duration) - parseInt(buffer);
      }
      if (timeOffDuration === 0) {
        timeOffDuration = null;
      }

      const service = {
        duration: parseInt(duration),
        timeOffStart: timeOffStart,
        timeOffDuration: timeOffDuration,
        price,
        name,
        tag,
        workers,
        color: generateColor(tag),
      };

      console.log(service);

      services.push(service);

      // Wait for the element with class 'back-btn' to be available in the DOM
      await page.waitForSelector(
        ".back-btn.inline-flex.items-center.justify-center",
        { timeout: 10000 }
      );

      // Refetch the element to ensure it's the latest one in the DOM
      const element = await page.$(
        ".back-btn.inline-flex.items-center.justify-center"
      );

      if (element) {
        await element.click();
        // Add a short wait to ensure all scripts tied to click events are executed
        await page.waitForTimeout(500);
      } else {
        console.error("Element not found");
      }

      // Add a delay to ensure any dynamic updates finish
      await page.waitForTimeout(4000);
    }

    fs.writeFileSync("./services.json", JSON.stringify(services));
  }

  await browser.close();
})();
