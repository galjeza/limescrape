const puppeteer = require("puppeteer");
const { wait } = require("../../utils/utils");
const axios = require("axios");
const fs = require("fs");

const EMAIL = "maja.beautysalon@gmail.com";
const PASSWORD = "Glossiq55!";
const GLOSSIQID = "7b2184c2-15f3-4cf7-ba17-6e208a50d961";
const LOCATIONLABEL = "Spremeni to";
const USERLABEL = "Maja Vuk";  // You can replace this with the desired value

const generateColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
};

async function loginAndFetchAppointments() {
  const browser = await puppeteer.launch({
    args: ["--force-device-scale-factor=0.5"],
    headless: false,
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 3000,
    height: 2500,
  });

  await page.goto("https://www.glossiq.com/");
  await wait(10);
  await page.click('button.btnPrimary:nth-child(1)');
  await wait(3);

  await page.click('#header > div > div:nth-child(2) > div.loginRegister > button');
  await wait(5);

  const emailElement = await page.waitForSelector("#Email", { visible: true });
  await page.type("#Email", EMAIL);
  await page.type("#Password", PASSWORD);
  await page.click('button[type="submit"]');
  console.log("Fetching appointments...");
  await wait(5);

  const cookies = await page.cookies();
  const localStorage = await page.evaluate(() => Object.assign({}, window.localStorage));

  // Wait for "Moj salon" and click
  await page.waitForXPath("//span[contains(text(), 'Moj salon')]", { visible: true });
  const [mojSalonButton] = await page.$x("//span[contains(text(), 'Moj salon')]");
  if (mojSalonButton) {
    await mojSalonButton.click();
    console.log("Clicked on 'Moj salon'.");
  } else {
    console.error("Could not find the 'Moj salon' button.");
  }

  await wait(5);

  // Extract all service URLs
  const serviceUrls = await page.evaluate(() => {
    const allLinks = document.querySelectorAll("a");
    const serviceLinks = Array.from(allLinks).filter(
      (link) => link.href.includes("/edit/services")
    );
    return serviceLinks.map((link) => link.href);
  });

  let shopId = null;
  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("GetBookingTemplatesByOffice")) {
      shopId = url.split("/")[5];
      console.log(`Detected request to URL: ${url}`);
    }
  });

  await page.goto(serviceUrls[0]);
  await wait(5);
  const url = page.url();
  console.log(`Loaded ${url}`);
  console.log(`Detected shopId: ${shopId}`);

  // Define hardcoded date variables
  const fromDate = "2024-05-01T22:00:00.000Z";
  const toDate = "2024-10-02T21:59:59.999Z";

  // Get the access token from local storage
  const accessToken = localStorage["oidc.user:https://sso.glossiq.com:Glossiq"]
    ? JSON.parse(localStorage["oidc.user:https://sso.glossiq.com:Glossiq"]).access_token
    : null;

  // Fetch appointments using the given POST request format
  const appointmentsUrl = `https://api.glossiq.com/api/order/GetAppointmentsByShop/${GLOSSIQID}`;
  const appointmentsResponse = await axios.post(
    appointmentsUrl,
    {
      offices: [shopId],
      currentPage: 1,
      itemsPerPage: 50000,
      dateFrom: fromDate,
      dateTo: toDate,
      sortColumn: "ProductSchedule DESC",
    },
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:129.0) Gecko/20100101 Firefox/129.0",
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.5",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const appointmentsRaw = appointmentsResponse.data.items;

  const appointments = [];
  for (const appointmentRaw of appointmentsRaw) {
    // Extract and format required fields
    const customerFullName = appointmentRaw.order?.shippingName || "Brez stranke";
    const [name, ...lastNameParts] = customerFullName.split(" ");
    const lastName = lastNameParts.join(" ") || "Stranke";
    const gsm = appointmentRaw.order?.shippingPhoneNumber || null;
    const countryCode = "386";
    const service = appointmentRaw.orderItem?.productName || "Brez storitve";
    const comment = appointmentRaw.order?.shippingNote || null;
    const timeFrom = appointmentRaw.orderItem?.productSchedule
      ? new Date(appointmentRaw.orderItem.productSchedule).toLocaleTimeString("sl-SI", {
          hour: "2-digit",
          minute: "2-digit",
          second: undefined,
        })
      : null;
    const timeTo = appointmentRaw.orderItem?.productSchedule
      ? new Date(new Date(appointmentRaw.orderItem.productSchedule).getTime() + 3600 * 1000).toLocaleTimeString("sl-SI", {
          hour: "2-digit",
          minute: "2-digit",
          second: undefined,
        })
      : null; // Assuming a 1-hour duration
    const email = appointmentRaw.order?.email || null;
    const date = appointmentRaw.orderItem?.productSchedule
      ? new Date(appointmentRaw.orderItem.productSchedule).toLocaleDateString("sl-SI", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }).replace(/\s/g, "")
      : null;

    // Create the structured appointment object using predefined variables
    const appointment = {
      locationLabel: LOCATIONLABEL,
      gsm,
      countryCode,
      service,
      name: name || "Brez",
      lastName,
      comment,
      timeFrom,
      timeTo,
      email,
      userLabel: USERLABEL,
      date,
      customerFullName,
    };

    appointments.push(appointment);
  }

  // Save the appointments to a JSON file
  fs.writeFileSync("./appointments.json", JSON.stringify(appointments, null, 2));
  console.log("Appointments saved to appointments.json");

  await browser.close();
}

loginAndFetchAppointments();
