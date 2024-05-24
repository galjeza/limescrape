const fs = require("fs");
const axios = require("axios");
const puppeteer = require("puppeteer");

(async () => {
  const clients = JSON.parse(fs.readFileSync("./myplanlyclients.json"));

  let uniqueClients = [];
  for (const client of clients) {
    let url = client.link;
    let cleanedUrl = url.replace(
      /(https:\/\/www\.myplanly\.com\/[^\/]+\/).*/,
      "$1"
    );
    if (!uniqueClients.find((c) => c.link === cleanedUrl)) {
      uniqueClients.push({ ...client, link: cleanedUrl });
    }
  }
  console.log(clients.length);
  const browser = await puppeteer.launch({
    headless: false,
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(1000);
  page.setDefaultNavigationTimeout(3000);
  await page.setViewport({ width: 2000, height: 1024 });

  console.log(uniqueClients.length);
  let clientData = [];
  for (const client of uniqueClients) {
    try {
      await page.goto(client.link);
      await page.waitForSelector("#name");
      const clientName = await page.$eval("#name", (el) => el.textContent);

      console.log(clientName);
      const street = await page.$eval("#street", (el) => el.textContent);
      const city = await page.$eval("#city", (el) => el.textContent);
      let phone = "";
      const phoneElement = await page.$("#phone");
      if (phoneElement) {
        phone = await page.$eval("#phone", (el) => el.textContent);
      }

      let email = "";
      const emailElement = await page.$("#email");
      if (emailElement) {
        email = await page.$eval("#email", (el) => el.textContent);
      }

      console.log({
        name: clientName,
        street: street,
        city: city,
        phone: phone,
        email: email,
        title: client.title,
        link: client.link,
      });

      clientData.push({
        name: clientName,
        street: street,
        city: city,
        phone: phone,
        email: email,
        title: client.title,
        link: client.link,
      });
    } catch (error) {
      console.log(error);
      clientData.push({
        name: "",
        street: "",
        city: "",
        phone: "",
        email: "",
        title: client.title,
        link: client.link,
      });
    }
  }

  // save clientData to json
  fs.writeFileSync(
    "./myplanlyclientsdata.json",
    JSON.stringify(clientData, null, 2)
  );
})();
