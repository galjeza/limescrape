const puppeteer = require("puppeteer");
const fs = require("fs");
const axios = require("axios");

const EMAIL = "aromasanja@gmail.com";
const PASSWORD = "Sanja1309";
const AUTH =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzOTk3NSIsInUiOnsiaWQiOiIzOTk3NSJ9LCJpYXQiOjE3Mjg0NjYwMzZ9.p8sKioc4Xe6riD63ctrX1C_3DFPgIVH-op0bnvZVUKw";
const LOCATION_ID = "1262";
const FROM_DATE = "2022-10-14"; // Set your desired start date
const TO_DATE = "2025-10-20"; // Set your desired end date

(async () => {
  console.log("Migration started");

  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.goto("https://app.zoyya.com/login");
  await page.waitForSelector("[data-cy='button_email']");
  await page.click("[data-cy='button_email']");

  await page.waitForSelector("[data-cy='input_email']");

  await page.type("[data-cy='input_email']", EMAIL);
  await page.type("[data-cy='input_password']", PASSWORD);

  await page.click("[data-cy='button_submit']");

  await page.waitForNavigation({
    waitUntil: "networkidle0",
  });

  const cookies = await page.cookies();
  const zoyyaAuthCookie = cookies.find(
    (cookie) => cookie.name === "zoyya-auth-token"
  ).value;
  if (!zoyyaAuthCookie) {
    throw new Error("Could not find zoyya-auth-cookie");
  }
  // Fetching services
  const servicesResponse = await fetch("https://app.zoyya.com/graph", {
    headers: {
      accept: "*/*",
      "accept-culture": "hr",
      "accept-language": "en-US,en;q=0.9",
      authorization: zoyyaAuthCookie,
      "content-type": "application/json",
      "sec-ch-ua": '"Not A(Brand";v="24", "Chromium";v="110"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-integration-source": "web-b2c-legacy",
      "x-locationid": LOCATION_ID,
      "x-orgid": "rneax",
      Referer: `https://app.zoyya.com/rneax/${LOCATION_ID}`,
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
    body: '{"operationName":"marketServiceTypes","variables":{"locationId":"1262"},"query":"query marketServiceTypes($locationId: ID) {\\n  market {\\n    serviceTypes(locationId: $locationId) {\\n      id\\n      name\\n      description\\n      services {\\n        ...ServiceFragment\\n        __typename\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\\nfragment ServiceFragment on MarketService {\\n  id\\n  name\\n  color\\n  price\\n  description\\n  bookingAllowed\\n  durationMinutes\\n  netDurationMinutes\\n  hasBookingConfirmation\\n  sequence\\n  allowMultipleSelection\\n  profession {\\n    id\\n    name\\n    __typename\\n  }\\n  type {\\n    id\\n    name\\n    description\\n    __typename\\n  }\\n  __typename\\n}\\n"}',

    method: "POST",
  });

  console.log("Services response");
  const serviceResponseJson = await servicesResponse.json();

  const services = [];
  for (const tag of serviceResponseJson.data.market.serviceTypes) {
    for (const service of tag.services) {
      services.push({
        color: service.color,
        name: service.name,
        price: service.price,
        description: service.description,
        tag: tag.name,
        duration: service.durationMinutes,
      });
    }
  }
  console.log(services);
  fs.writeFileSync("services.json", JSON.stringify(services));

  // Fetching appointment data
  const appointmentResponse = await axios.get(
    "https://partner.zoyya.com/trpc/calendar_getEntries",
    {
      headers: {
        accept: "*/*",
        "accept-culture": "en",
        "accept-language": "sl,sl-SI;q=0.9,en-GB;q=0.8,en;q=0.7",
        authorization: zoyyaAuthCookie,
        cookie: `zoyya-auth-token=${zoyyaAuthCookie}; zoyya-is-signedIn=true`,
        "content-type": "application/json",
        "x-integration-source": "web-b2b-v1.118.0",
        "x-locationid": LOCATION_ID,
        "x-orgid": "rneax",
      },
      params: {
        batch: 1,
        input: JSON.stringify({
          0: {
            json: {
              dateFrom: FROM_DATE,
              dateTo: TO_DATE,
              locationId: LOCATION_ID,
            },
            meta: {
              values: {
                locationId: ["bigint"],
              },
            },
          },
        }),
      },
    }
  );

  const appointmentData = appointmentResponse.data;
  console.log(appointmentData);
  fs.writeFileSync("appointments.json", JSON.stringify(appointmentData));

  // Formatting appointment data
  const formattedAppointments = [];
  (appointmentData[0].result?.data?.json || []).forEach((appointment) => {
    let startTime = new Date(appointment.startTimeUtc);

    (appointment.services || []).forEach((service) => {
      const serviceDetails = services.find((s) => s.name === service.name);
      if (serviceDetails) {
        formattedAppointments.push({
          locationLabel: "MD Beauty",
          userLabel: appointment.allBookingEmployees?.[0]?.name || "",
          gsm: appointment.clientMobilePhone || null,
          countryCode: null, // Assuming no country code provided in data
          name: appointment.clientName?.split(" ")[0] || "",
          lastName: appointment.clientName?.split(" ").slice(1).join(" ") || "",
          date: `${startTime.getDate().toString().padStart(2, "0")}.${(
            startTime.getMonth() + 1
          )
            .toString()
            .padStart(2, "0")}.${startTime.getFullYear()}`.replace("/", "."),
          timeFrom: startTime.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          timeTo: new Date(
            startTime.getTime() + serviceDetails.duration * 60000
          ).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          service: service.name,
          email: null, // Assuming no email provided in data
          comment: appointment.clientComment || "",
        });
        // Update start time for next service
        startTime = new Date(
          startTime.getTime() + serviceDetails.duration * 60000
        );
      }
    });
  });

  console.log(formattedAppointments);
  fs.writeFileSync(
    "appointmentsFormatted.json",
    JSON.stringify(formattedAppointments)
  );

  await browser.close();
  console.log("Migration completed");
})();
