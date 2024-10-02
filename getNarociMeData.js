const puppeteer = require("puppeteer");
const { wait, stringToColour } = require("./utils/utils");
const fs = require("fs");
const axios = require("axios");
const qs = require("querystring");
const cheerio = require("cheerio");

function addMinutesToTimeString(timeStr, minutesToAdd) {
  // Split the string to get hours and minutes
  const [hours, minutes] = timeStr.split(":").map(Number);

  // Convert the hours and minutes to total minutes
  const totalMinutes = hours * 60 + minutes + minutesToAdd;

  // Calculate the new hours and minutes
  const newHours = Math.floor(totalMinutes / 60) % 24; // % 24 to handle day overflow
  const newMinutes = totalMinutes % 60;

  // Convert the numbers to string and pad with zeros if necessary
  const newHoursStr = String(newHours).padStart(2, "0");
  const newMinutesStr = String(newMinutes).padStart(2, "0");

  // Return the new time string
  return `${newHoursStr}:${newMinutesStr}`;
}

const LOGINURL = "https://ac-zvezda.naroci.me/login";
const USERNAME = "ac-zvezda931";
const PASSWORD = "Zvezda123!";

const START_DATE = new Date("2024-06-08");
const END_DATE = new Date("2024-10-10");

const START_DATE_UNIX = Math.floor(START_DATE.getTime() / 1000);
const END_DATE_UNIX = Math.floor(END_DATE.getTime() / 1000);

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    ignoreHTTPSErrors: true,
    args: ["--ignore-certificate-errors"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1024 });

  await page.goto(LOGINURL);

  await page.type("#id_username", USERNAME);
  await page.type("#id_password", PASSWORD);

  await page.click('input[type="submit"]');
  // wait for item with class navbar to load
  await page.waitForSelector(".navbar");

  // save token from cookies to variable
  const cookies = await page.cookies();
  // find sessionId fro cookies
  const sessionId = cookies.find((cookie) => cookie.name === "sessionid").value;
  const csrfToken = cookies.find((cookie) => cookie.name === "csrftoken").value;
  console.log("SessionId: " + sessionId);
  console.log("csrfToken: " + csrfToken);

  const data = {
    staff: 0,
    workplace: 0,
    start: START_DATE_UNIX,
    end: END_DATE_UNIX,
  };

  const config = {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "en-US,en;q=0.9",
      Connection: "keep-alive",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Cookie: `csrftoken=${csrfToken}; sessionid=${sessionId}`,
      Host: LOGINURL.replace("https://", "").replace("/login", ""),
      Origin: LOGINURL.replace("/login", ""),
      Referer: LOGINURL.replace("/login", "/provider/events"),
      "sec-ch-ua": '"Not A(Brand";v="24", "Chromium";v="110"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
      "X-CSRFToken": csrfToken,
      "X-Requested-With": "XMLHttpRequest",
    },
  };

  let eventsData = [];

  const CLIENTSURL =
    "https://danstudio.naroci.me/provider/settings/client_list_page?sEcho=1&iColumns=1000000&sColumns=&iDisplayStart=0&iDisplayLength=1000000&mDataProp_0=0&mDataProp_1=1&mDataProp_2=2&mDataProp_3=3&mDataProp_4=4&mDataProp_5=5&mDataProp_6=6&sSearch=&bRegex=false&sSearch_0=&bRegex_0=false&bSearchable_0=true&sSearch_1=&bRegex_1=false&bSearchable_1=true&sSearch_2=&bRegex_2=false&bSearchable_2=true&sSearch_3=&bRegex_3=false&bSearchable_3=true&sSearch_4=&bRegex_4=false&bSearchable_4=true&sSearch_5=&bRegex_5=false&bSearchable_5=true&sSearch_6=&bRegex_6=false&bSearchable_6=true&iSortCol_0=0&sSortDir_0=asc&iSortingCols=1&bSortable_0=true&bSortable_1=true&bSortable_2=true&bSortable_3=true&bSortable_4=true&bSortable_5=false&bSortable_6=false&_=1687099071576";

  const clients = await axios.get(CLIENTSURL, config).then((response) => {
    return response.data.aaData;
  });

  console.log("Number of clients: " + clients.length);

  const clientData = clients.map((item) => {
    const name = item[0]
      .replace(/<\/?[^>]+(>|$)/g, "")
      .trim()
      .replace(/\s+/g, " ")
      .trim();

    const firstName = name.split(" ")[0];
    const lastName = name.split(" ").slice(1).join(" ");
    const email = item[1].replace(/<\/?[^>]+(>|$)/g, "").trim();
    const gsm = item[2];
    const countryCode = "386";
    return { name: firstName, email, gsm, countryCode, lastName };
  });

  fs.writeFileSync(
    "./output/zvezda/customers.json",
    JSON.stringify(clientData, null, 2)
  );

  const EVENTSAPIURL = LOGINURL.replace("/login", "/provider/events");

  await axios
    .post(EVENTSAPIURL, qs.stringify(data), config)
    .then((response) => {
      eventsData = response.data;
    })
    .catch((error) => {
      console.error(error);
    });

  eventsData = eventsData.filter(
    (object) => object.event.status.is_deleted === false
  );
  let formattedAppointments = [];
  for (let i = 0; i < eventsData.length; i++) {
    const appointment = eventsData[i];
    const appointmentDate = new Date(appointment.start.split(" ")[0]);

    const day = appointmentDate.getDate().toString().padStart(2, "0");
    const month = (appointmentDate.getMonth() + 1).toString().padStart(2, "0");
    const year = appointmentDate.getFullYear();

    const date = `${day}.${month}.${year}`;

    const timeFrom = appointment.event.from_to
      .split("-")[0]
      .trim()
      .padStart(5, "0");
    const timeTo = appointment.event.from_to
      .split("-")[1]
      .trim()
      .padStart(5, "0");

    if (timeTo == timeFrom) {
      console.log(appointment.event);
    }

    if (timeTo.includes("NaN")) {
      console.log(appointment.appointment.event.from_to);
    }
    const servicesForAppointment = appointment.event.service.split(", ");

    const duration = appointment.event.service.duration;
    const subject = appointment.event.staff;

    // set first character to uppercase
    let formattedAppointmentClientName =
      appointment.event.client.split(" ")[0].charAt(0).toUpperCase() +
      appointment.event.client.split(" ")[0].slice(1);

    let formattedAppointmentClientLastName =
      appointment.event.client.split(" ")[1].charAt(0).toUpperCase() +
      appointment.event.client.split(" ")[1].slice(1);

    const client = clientData.find(
      (client) =>
        client.name === formattedAppointmentClientName &&
        client.lastName === formattedAppointmentClientLastName
    );

    const gsm = client?.gsm ? client.gsm : null;
    const email = client?.email ? client.email : null;
    const comment = appointment.event.comment ? appointment.event.comment : "";
    let currentOffset = 0;
    // check if service includes service "Ž oblika" and frufru

    for (const s of servicesForAppointment) {
      const lastParentIndex = s?.lastIndexOf("(");
      const serviceName = s.slice(0, lastParentIndex).trim();
      let match = s?.match(/\((\d+)\s*min\)$/);

      let serviceDuration = 0;
      if (match) {
        serviceDuration = match[1];
      }

      // Default service duration to a safe value if parsing fails
      serviceDuration = parseInt(serviceDuration) || 0;

      const startTimeForService = addMinutesToTimeString(
        timeFrom,
        currentOffset
      );

      const endTimeForService = addMinutesToTimeString(
        startTimeForService,
        serviceDuration
      );

      // If endTimeForService is NaN, log an error and skip this service
      if (endTimeForService.includes("NaN")) {
        console.error(`Invalid time calculation for service: ${serviceName}`);
        continue;
      }

      if (startTimeForService === endTimeForService) {
        console.log("FUCKK");
        console.log(s);
      }

      formattedAppointments.push({
        locationLabel: appointment.event.workplace,
        gsm,
        countryCode: client?.countryCode ? client.countryCode : null,
        name: client?.name ? client.name : formattedAppointmentClientName,
        lastName: client?.lastName
          ? client.lastName
          : formattedAppointmentClientLastName,
        service: serviceName,
        timeFrom: startTimeForService,
        timeTo: endTimeForService,
        email,
        userLabel: subject,
        date,
        comment,
      });

      currentOffset += serviceDuration;
    }
  }
  // remove any duplicates
  formattedAppointments = formattedAppointments.filter(
    (thing, index, self) =>
      index ===
      self.findIndex(
        (t) =>
          t.customer === thing.customer &&
          t.service === thing.service &&
          t.timeFrom === thing.timeFrom &&
          t.timeTo === thing.timeTo &&
          t.date === thing.date
      )
  );

  fs.writeFileSync(
    "./output/zvezda/appointments.json",
    JSON.stringify(formattedAppointments, null, 2)
  );

  // GET SERVICES

  const SERVICESHTMLURL =
    "https://danstudio.naroci.me/provider/settings/service_list";
  const servicesHTML = await axios
    .get(SERVICESHTMLURL, config)
    .then((response) => {
      return response.data;
    });
  const $ = cheerio.load(servicesHTML);
  const service_edit_urls = [];
  $("a").each((i, link) => {
    const href = link.attribs.href;
    if (href.includes("service_edit")) {
      if (!service_edit_urls.includes(href)) {
        service_edit_urls.push(href);
      }
    }
  });
  const services = [];
  for (const service_url of service_edit_urls) {
    const service_url_formatted = LOGINURL.replace("login", "") + service_url;
    const serviceHTML = await axios
      .get(service_url_formatted, config)
      .then((response) => {
        return response.data;
      });
    const $ = cheerio.load(serviceHTML);
    const name = $("input[name='name']").val();
    const duration = $("input[name='duration']").val();
    const price = $("input[name='cost']").val();
    const description = $("textarea[name='description']").val();
    const category = $("select[name='category'] option:selected").text();
    const available_online = $("input[name='available_online']").is(":checked");
    const color = stringToColour(category);
    const staff = [];

    $("select[name='staff'] option:selected").each((i, option) => {
      staff.push($(option).text());
    });

    const service = {
      name,
      duration,
      price,
      description,
      tag: category,
      available_online,
      staff,
      color,
      min: 1,
      max: 1,
    };
    services.push(service);
  }

  console.log("Number of services: " + services.length);

  fs.writeFileSync(
    "./output/zvezda/services.json",
    JSON.stringify(services, null, 2)
  );

  await browser.close();
})();
