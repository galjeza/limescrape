const puppeteer = require("puppeteer");
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
const USERNAME = "businessbylora@gmail.com";
const PASSWORD = "LoraBuuStudio2022";
const DATEFROM = "2022-01-01";
const DATETO = "2024-12-31";
const SUBJECTID = ["2978909", "2087207"];
const LOCATIONID = "810259";
const CUSTOMER_LIMIT = 49;

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
    await page.waitForTimeout(1000);
    await page.click('input[type="password"]');
    await page.type('input[type="password"]', PASSWORD);
    await page.waitForTimeout(1000);
    await page.click('button[type="submit"]');
  } else {
    // wait for 100 seconds to login manually
    await page.waitForTimeout(100000);
  }

  await page.waitForTimeout(2000);

  const cookies = await page.cookies();
  const csrfToken = cookies.find(
    (cookie) => cookie.name === "_partners_session"
  ).value;

  const graphqlUrl = "https://partners-calendar-api.fresha.com/alpha-graphql";

  // Fetch services
  await page.goto("https://partners-api.fresha.com/offer-catalog-menu");
  await page.waitForTimeout(2000);
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
    "./output/lora/services.json",
    JSON.stringify(services, null, 2)
  );

  console.log("Number of services", services.length);

  // Fetch customers
  const customers = [];
  let offset = 0;
  let hasMoreCustomers = true;

  while (hasMoreCustomers) {
    const customerUrl = `https://customers-api.fresha.com/v2/customer-search?offset=${offset}&limit=${CUSTOMER_LIMIT}&include-customers-count=true`;
    await page.goto(customerUrl);
    await page.waitForTimeout(2000);

    const customersResponse = await page.evaluate(() => {
      return JSON.parse(document.querySelector("body").innerText).data;
    });

    if (customersResponse.length < CUSTOMER_LIMIT) {
      hasMoreCustomers = false;
    }

    customersResponse.forEach((customer) => {
      try {
        const newCustomer = {
          customer: customer.attributes["name"],
          email: customer.attributes["email"],
          phone: customer.attributes["contact-number"]
            ?.replaceAll("+", "")
            ?.replaceAll(" ", ""),
          id: customer.id,
        };
        customers.push(newCustomer);
      } catch (e) {
        console.log(e);
        console.log(customer);
      }
    });

    offset += CUSTOMER_LIMIT;
  }
  console.log("Number of customers", customers.length);

  // Fetch employees
  await page.goto("https://partners-api.fresha.com/employees");
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

  // Fetch bookings using GraphQL
  const bookingsQuery = {
    operationName: "calendarBookings",
    query: `query calendarBookings($dateFrom: Date!, $dateTo: Date!, $locationId: ID!, $resourceIds: [ID!], $resourceType: ResourceType!) {
      calendarBookingsV1(
        dateFrom: $dateFrom
        dateTo: $dateTo
        locationId: $locationId
        resourceIds: $resourceIds
        resourceType: $resourceType
      ) {
        appointmentId
        basePrice
        bookingSequenceId
        cardRequired
        createdAt
        createdByEmployeeId
        customerId
        customerName
        date
        depositId
        employeeId
        employeeIsRequested
        end
        extraTimeInSeconds
        extraTimeIsBlocking
        groupId
        groupOwnerId
        groupOwnerName
        id
        isOnline
        locationId
        notes
        packageInstanceName
        paidPlanInstanceId
        parentId
        price
        priceType
        reference
        relatedBookingIds
        roomId
        salePaymentStatus
        serviceId
        serviceName
        servicePricingLevelId
        servicePricingLevelName
        start
        status
        timeEndInSeconds
        timeStartInSeconds
        updatedAt
        __typename
      }
    }`,
    variables: {
      dateFrom: DATEFROM,
      dateTo: DATETO,
      locationId: LOCATIONID,
      resourceIds: SUBJECTID,
      resourceType: "EMPLOYEES",
    },
  };

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (X11; Linux x86_64; rv:126.0) Gecko/20100101 Firefox/126.0",
    Accept: "application/json",
    "content-type": "application/json",
    Cookie: cookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; "),
  };

  const bookingsResponse = await axios.post(graphqlUrl, bookingsQuery, {
    headers,
  });

  const bookings = [];
  bookingsResponse.data.data.calendarBookingsV1.forEach((booking) => {
    if (booking.status === "cancelled") {
      return;
    }

    const startTimeObj = new Date(booking.start);
    const endTimeObj = new Date(booking.end);

    const formattedStart = formatDateAndTime(startTimeObj);
    const formattedEnd = formatDateAndTime(endTimeObj);

    const timeFormatted = `${formattedStart.time} - ${formattedEnd.time}`;

    const service = services.find(
      (service) => service["name"] === booking.serviceName
    );
    const customer = customers.find(
      (customer) => customer.id === booking.customerId
    );

    const employee = employees.find(
      (employee) => employee.id === booking.employeeId
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

    const countryCode = customer?.phone?.substring(0, 3) || null;
    const gsm = customer?.phone?.substring(3).replaceAll(" ", "") || null;

    newBooking = {
      locationLabel: "Almin Svet",
      userLabel: employee?.fullName || "",
      name: name || "",
      lastName: lastName || "",
      email: customer?.email || "",
      countryCode: countryCode || null,
      gsm: gsm || null,
      service: service?.name || "Brez storitve",
      date: formattedStart.date,
      timeFrom: formattedStart.time,
      timeTo: formattedEnd.time,
      comment: booking.notes || "",
    };
    bookings.push(newBooking);
  });

  console.log("Number of bookings", bookings.length);

  fs.writeFileSync(
    "./output/lora/appointments.json",
    JSON.stringify(bookings, null, 2)
  );

  await browser.close();
})();
