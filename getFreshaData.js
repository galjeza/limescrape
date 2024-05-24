const puppeteer = require("puppeteer");
const { wait } = require("./utils/utils");
const fs = require("fs");
const axios = require("axios");
const qs = require("querystring");
const cheerio = require("cheerio");

const generateColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();

  return "#" + "00000".substring(0, 6 - c.length) + c;
};

const LOGINURL = "https://partners.fresha.com/users/sign-in";
const USERNAME = "programerji.statera@gmail.com";
const PASSWORD = "Geslo123.";
const DATEFROM = "2023-01-01";
const DATETO = "2024-12-31";
const SUBJECTID = "2926193%2C2695543%2C2521550%2C2438226";
const LOCATIONID = "1005836";

const manualLogin = false;

// Function to format date and time
const formatDateAndTime = (dateTimeObj) => {
  const date =
    dateTimeObj.getDate() < 10
      ? "0" + dateTimeObj.getDate()
      : dateTimeObj.getDate();
  const month =
    dateTimeObj.getMonth() + 1 < 10
      ? "0" + (dateTimeObj.getMonth() + 1)
      : dateTimeObj.getMonth() + 1;
  const year = dateTimeObj.getFullYear();

  const hours =
    dateTimeObj.getHours() - 2 < 10
      ? "0" + (dateTimeObj.getHours() - 2)
      : dateTimeObj.getHours() - 2;
  const minutes =
    dateTimeObj.getMinutes() < 10
      ? "0" + dateTimeObj.getMinutes()
      : dateTimeObj.getMinutes();

  return {
    date: `${date}.${month}.${year}`,
    time: `${hours}:${minutes}`,
  };
};

(async () => {
  // Your puppeteer code...
  const browser = await puppeteer.launch({
    headless: false,
    ignoreHTTPSErrors: true,
    args: ["--ignore-certificate-errors"],
  });

  const page = await browser.newPage();
  await page.goto(LOGINURL);
  if (!manualLogin) {
    await page.waitForSelector("input[type='email']");
    await page.click('input[type="email"]');
    await page.type('input[type="email"]', USERNAME);
    await page.keyboard.press("Enter");
    await wait(1);
    await page.click('input[type="password"]');
    await page.type('input[type="password"]', PASSWORD);
    await wait(1);
    await page.click('button[type="submit"]');
  } else {
    // wait for 100 seconds to login manually
    await wait(100);
  }

  await wait(2);
  await page.goto("https://partners-api.fresha.com/offer-catalog-menu");
  // parse the json on the page
  await wait(2);
  const services = [];
  const servicesResponse = await page.evaluate(() => {
    return JSON.parse(document.querySelector("body").innerText).data;
  });
  servicesResponse.forEach((service) => {
    const newService = {
      name: service.attributes["name"],
      duration: service.attributes["duration-value"]?.toString(),
      price: service.attributes["retail-price"]?.toString(),
      min: "1",
      max: "1",
      color: generateColor(service.attributes["color"]),
    };
    services.push(newService);
  });

  services.push({
    name: "Brez storitve",
    duration: "0",
    price: "0",
    min: "1",
    max: "1",
  });

  fs.writeFileSync(
    "./output/fix/services.json",
    JSON.stringify(services, null, 2)
  );

  console.log("Number of services", services.length);
  await page.goto(
    "https://customers-api.fresha.com/v2/customer-search?offset=0&query=&genders=&customer-type=&sort-order=desc&sort-by=created-at&limit=9999999&include-customers-count=true"
  );

  await wait(2);
  const customers = [];
  const customersResponse = await page.evaluate(() => {
    return JSON.parse(document.querySelector("body").innerText).data;
  });
  customersResponse.forEach((customer) => {
    try {
      const newCustomer = {
        customer: customer.attributes["name"],
        email: customer.attributes["email"],
        phone:
          "386" +
            customer.attributes["contact-number"]
              ?.replaceAll("+", "")
              .replaceAll(" ", "")
              .split("386")
              .join(" ") || "",
        id: customer.id,
      };
      customers.push(newCustomer);
    } catch (e) {
      console.log(e);
      console.log(customer);
    }
  });
  console.log("Number of customers", customers.length);

  const bookingsURL = `https://partners-api.fresha.com/calendar-bookings?date-from=${DATEFROM}&date-to=${DATETO}&location-id=${LOCATIONID}&resource-ids=${SUBJECTID}&resource-type=employees`;
  await page.goto(bookingsURL);
  await wait(2);
  const bookings = [];
  const bookingsResponse = await page.evaluate(() => {
    return JSON.parse(document.querySelector("body").innerText).data;
  });

  // go to employe  https://partners-api.fresha.com/employees

  const employeesURL = `https://partners-api.fresha.com/employees`;
  await page.goto(employeesURL);
  await wait(10);

  const employeesResponse = await page.evaluate(() => {
    return JSON.parse(document.querySelector("body").innerText).data;
  });

  const employees = employeesResponse.map((employee) => {
    return {
      id: employee.id,
      fullName: `${employee.attributes["first-name"]} ${employee.attributes["last-name"]}`,
      email: employee.attributes.email,
    };
  });

  // log first 10  bookings

  bookingsResponse.forEach((booking) => {
    // Parse start and end time
    if (booking.attributes["status"] === "cancelled") {
      return;
    }

    const startTimeObj = new Date(booking.attributes["start"]);
    const endTimeObj = new Date(booking.attributes["end"]);

    const formattedStart = formatDateAndTime(startTimeObj);
    const formattedEnd = formatDateAndTime(endTimeObj);

    const timeFormatted = `${formattedStart.time} - ${formattedEnd.time}`;

    const service = services.find(
      (service) => service["name"] === booking.attributes["service-name"]
    );
    const customer = customers.find(
      (customer) => customer.id === booking.attributes["customer-id"]
    );

    const employee = employees.find(
      (employee) => employee.id === booking.attributes["employee-id"]
    );

    const generateRandomString = (length) => {
      let result = "";
      const characters = "abcdefghijklmnopqrstuvwxyz";
      const charactersLength = characters.length;
      for (let i = 0; i < length; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * charactersLength)
        );
      }
      return result;
    };

    const [name, ...lastNameParts] = customer?.customer?.split(" ") || [];
    const lastName = lastNameParts?.join(" ");

    const countryCode = customer?.phone.substring(0, 3);
    const gsm = "0" + customer?.phone.substring(3).replaceAll(" ", "");
    console.log(services);
    newBooking = {
      location: "Almin Svet",
      subject: employee?.fullName || "",
      name: name || "",
      lastName: lastName || "",
      email: customer?.email || "",
      countryCode: countryCode || "",
      gsm: gsm || "",
      service: service?.name || "Brez storitve",
      date: formattedStart.date,
      timeFrom: formattedStart.time,
      timeTo: formattedEnd.time,
      comment: booking.attributes["notes"] || "",
    };
    bookings.push(newBooking);
  });

  // log first 10  bookings

  fs.writeFileSync(
    "./output/fix/appointments.json",
    JSON.stringify(bookings, null, 2)
  );
})();
