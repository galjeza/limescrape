const puppeteer = require("puppeteer");
const { wait } = require(".././utils/utils");
const fs = require("fs");

//const EMAIL = "tina@arbadakarba.si";
//const PASSWORD = "Ljubezen123-";

const EMAIL = "tl.estetichouse@gmail.com";
const PASSWORD = "Cocolada_5";
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
  await page.waitForSelector("#cn-main-nav");

  if (SCRAPE_SERVICES) {
    let services = [];
    await page.goto("https://go.setmore.com/easy-share");

    await page.waitForSelector(".meeting-card__top");
    await wait(2);

    // get all list items inside of ul which has a classname meeting-card-container
    const listContrainer = await page.$("#list-container");
    // get list items by role = listitem
    const listItems = await listContrainer.$$("[role=listitem]");

    await wait(5);
    console.log(listItems.length);
    for (const item of listItems) {
      console.log("clicking item number: ", listItems.indexOf(item));
      await item.click(".meeting-card__more-btn");

      await page.waitForSelector("#duration");
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
        // get the parent element of the worker element
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
      await page.click(".aw-122jk53.back-btn.mr-1");
    }

    fs.writeFileSync(
      "./estetichouse/services_setmore.json",
      JSON.stringify(services)
    );
  }
})();
