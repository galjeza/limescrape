const axios = require("axios");
const puppeteer = require("puppeteer");
const { wait } = require("../../utils/utils");
const fs = require("fs");

const EMAIL = "elpadre";
const PASSWORD = "Cocktail195437";

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 2080, height: 1224 });

  // LOGIN
  await page.goto("https://losbarberos.secure.simplybook.it/");
  await page.waitForSelector("#login");
  await page.type("#login", EMAIL);
  await page.type("#pass", PASSWORD);
  await page.click(".btn.btn-primary");
  await page.waitForSelector("#scheduler-page");
  await wait(1);

  // Save cookies
  const cookies = await page.cookies();
  const cookieString = cookies.map((ck) => `${ck.name}=${ck.value}`).join("; ");

  // Function to get dates in weekly increments
  function getWeeklyDates(startDate, endDate) {
    let start = new Date(startDate);
    let end = new Date(endDate);
    let dates = [];

    while (start <= end) {
      let newEnd = new Date(start);
      newEnd.setDate(newEnd.getDate() + 6);
      if (newEnd > end) newEnd = end;

      dates.push({
        start: start.toISOString().split("T")[0],
        end: newEnd.toISOString().split("T")[0],
      });
      start.setDate(start.getDate() + 7);
    }

    return dates;
  }

  // Function to fetch appointments
  async function fetchAppointments(startDate, endDate) {
    const weeklyDates = getWeeklyDates(startDate, endDate);
    let appointments = [];

    for (const dateRange of weeklyDates) {
      const response = await axios.get(
        `https://losbarberos.secure.simplybook.it/v2/index/get-bookings/?booking_type=non_cancelled&client_id=&booking_code=&show_notes=all&force_suffer=0&from=${dateRange.start}&to=${dateRange.end}&unit_ids%5B%5D=1&unit_ids%5B%5D=3&unit_ids%5B%5D=6`,
        {
          headers: {
            Cookie: cookieString,
          },
        }
      );
      appointments = [...appointments, ...response.data];
    }

    return appointments;
  }

  // Example usage
  const allAppointments = await fetchAppointments("2024-04-04", "2025-04-04");
  console.log(allAppointments.length);

  console.log(allAppointments.slice(0, 3));

  // Formatting data for import

  const formattedAppointments = allAppointments.map((appointment) => {
    const {
      start_date,
      end_date,
      client,
      unit,
      client_phone,
      client_email,
      event,
    } = appointment;

    let name = client?.split(" ")[0] || "";
    let lastName = client?.split(" ").slice(1).join(" ") || "";

    if (name === "" && lastName === "") {
      name = "Brez";
      lastName = "stranke";
    }

    const countryCode = client_phone?.replace("+", "").slice(0, 3);
    const phone = "0" + client_phone?.replace("+", "").slice(3);

    // get date from start_date
    const date = new Date(start_date);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const dateStr = `${day}.${month}.${year}`;

    // get timeFrom and timeTo from start_date and end_date
    const timeFrom = start_date.split(" ")[1].slice(0, 5);
    const timeTo = end_date.split(" ")[1].slice(0, 5);

    return {
      location: "La Casa",
      subject: unit,
      name,
      lastName,
      phone,
      countryCode,
      email: client_email,
      timeFrom,
      timeTo,
      date: dateStr,
      service: event,
    };
  });

  // save formatted appointments to file
  fs.writeFileSync(
    "./appointmentsnew.json",
    JSON.stringify(formattedAppointments, null, 2)
  );

  await browser.close();
})();
