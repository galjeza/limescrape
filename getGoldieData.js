const puppeteer = require("puppeteer");
const { wait } = require("./utils/utils");
const fs = require("fs");
const axios = require("axios");

const EMAIL = "zigakobe@gmail.com";
const PASSWORD = "novogeslo123";
// create a new date object with the current date and time
const DATEFROM = new Date(2023, 10, 24);

const SINGLESTAFF = true;

// set date to to the year 2025
const DATETO = new Date(2025, 12, 31);

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1024 });

  // Login
  await page.goto("https://app.heygoldie.com/auth/login");
  await page.type("#email", EMAIL);
  await page.type("#current-password", PASSWORD);
  // click on button with type submit
  await page.click('button[type="submit"]');
  // wait for navigation to finish

  await page.waitForSelector(".css-1f8bwsm");
  await wait(2);

  // save token from cookies to variable
  const cookies = await page.cookies();
  const localStorage = await page.evaluate(() =>
    Object.assign({}, window.localStorage)
  );
  const localStorageJson = JSON.parse(localStorage["persist:auth"]);
  const token = localStorageJson.accessToken.replace(/['"]+/g, "");
  console.log(token);

  const servicesURL = `https://api.heygoldie.com/live/rest/services`;
  const response = await axios.get(servicesURL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const responseServices = response.data.services;
  const services = [];
  for (const s of responseServices) {
    if (s.deleted) {
      continue;
    }

    // set price to a format like 10,00 and if there are no decimals add them
    let price = String(s.price / 100).replace(".", ",");
    if (price.indexOf(",") == -1) {
      price = price + ",00";
    }

    const service = {
      name: s.name,
      price: price,
      duration: s.duration,
      min: "1",
      max: "1",
    };
    services.push(service);
  }

  await page.waitForSelector(".css-1f8bwsm");
  await page.click(".css-1f8bwsm");
  await wait(2);

  const subjects = await page.evaluate(() => {
    const subjects = [];
    const subjectElements = document.querySelectorAll(".css-r8u8y9 li");
    for (const subjectElement of subjectElements) {
      const subject = {
        name: subjectElement.innerText.split("\n")[
          subjectElement.innerText.split("\n").length - 1
        ],
        id: subjectElement.getAttribute("data-value"),
      };
      if (subject.id == "all") {
        continue;
      }
      subjects.push(subject);
    }
    return subjects;
  });
  let user_appts = [];
  for (subject of subjects) {
    const startDate = Math.round(DATEFROM.getTime() / 1000);
    const endDate = Math.round(DATETO.getTime() / 1000);
    const appointmentsURL = `https://api.heygoldie.com/live/rest/calendar?start=${startDate}000&end=${endDate}999&staffId=${subject.id}`;
    const testURl = `https://api.heygoldie.com/live/rest/calendar?start=1681682400000&end=1682287199999&staffId=1706ba2e-d6d2-48ab-a573-5d281008bcdc`;

    const response = await axios.get(appointmentsURL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const appointments = response.data.appointments;
    console.log(response.data);
    for (appointment of appointments) {
      if (appointment.services.length == 0) {
        const startTime = new Date(appointment.start);
        if (
          startTime.getDate() == 25 &&
          startTime.getMonth() == 3 &&
          startTime.getFullYear() == 2023
        ) {
          console.log(appointment);
        }

        const endTime = new Date(appointment.end);

        // check if month and date are 2 digits long and if not add 0 in front
        const month =
          String(startTime.getMonth() + 1).length == 1
            ? "0" + String(startTime.getMonth() + 1)
            : String(startTime.getMonth() + 1);
        const date =
          String(startTime.getDate()).length == 1
            ? "0" + String(startTime.getDate())
            : String(startTime.getDate());
        const appointmentDate =
          date + "." + month + "." + startTime.getFullYear();
        const appointmentTime =
          startTime.toLocaleTimeString("sl-SI", {
            hour: "2-digit",
            minute: "2-digit",
          }) +
          " - " +
          endTime.toLocaleTimeString("sl-SI", {
            hour: "2-digit",
            minute: "2-digit",
          });
        const userAppointmentObject = {
          time: appointmentTime,
          date: appointmentDate,
          service: "Brez storitve",
          comment: appointment.title ? appointment.title : "",
          customerId: "0",
          subject: subjects.find((s) => s.id == appointment.assignee).name,
        };
        user_appts.push(userAppointmentObject);
        //console.log(userAppointmentObject);
      }

      // Gres skozi vse service ki se izvajajajo v appointmentu:
      for (service of appointment.services) {
        const startTime = new Date(appointment.start);
        for (let i = 0; i < appointment.services.indexOf(service); i++) {
          startTime.setMinutes(
            startTime.getMinutes() + appointment.services[i].duration
          );
        }
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + service.duration);

        // check if month and date are 2 digits long and if not add 0 in front
        const month =
          String(startTime.getMonth() + 1).length == 1
            ? "0" + String(startTime.getMonth() + 1)
            : String(startTime.getMonth() + 1);
        const date =
          String(startTime.getDate()).length == 1
            ? "0" + String(startTime.getDate())
            : String(startTime.getDate());
        const appointmentDate =
          date + "." + month + "." + startTime.getFullYear();
        const appointmentTime =
          startTime.toLocaleTimeString("sl-SI", {
            hour: "2-digit",
            minute: "2-digit",
          }) +
          " - " +
          endTime.toLocaleTimeString("sl-SI", {
            hour: "2-digit",
            minute: "2-digit",
          });
        const userAppointmentObject = {
          time: appointmentTime,
          date: appointmentDate,
          service: service.name,
          comment: "",
          customerId: appointment.clients[0].id,
          subject: subjects.find((s) => s.id == service.assignee).name,
        };
        user_appts.push(userAppointmentObject);
      }
    }
  }

  const customersRes = await axios.get(
    "https://api.heygoldie.com/live/rest/clients?text=",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const customers = customersRes.data.clients;

  customers.push({
    id: "0",
    name: "Brez stranke",
    phone: "",
    email: "",
  });

  for (a of user_appts) {
    const cust = customers.find((c) => c.id == a.customerId);
    if (!cust) {
      console.log("Customer not found");
      continue;
    }
    a.customer = cust.name;
    a.phone = cust.phone?.replace("+386", "386") || "";
    a.email = cust.email || "";
    // delete customerID from object
    delete a.customerId;
  }
  // remove all duplicates
  user_appts = [...new Set(user_appts.map(JSON.stringify))].map(JSON.parse);
  const json = JSON.stringify(user_appts);
  fs.writeFileSync(
    "./output/zigakobe/appointments.json",
    JSON.stringify(user_appts, null, 2)
  );
  // write services to file
  fs.writeFileSync(
    "./output/zigakobe/services.json",
    JSON.stringify(services, null, 2)
  );

  await browser.close();
})();
