const puppeteer = require("puppeteer");
const { wait } = require("./utils/utils");
const fs = require("fs");
const axios = require("axios");

const EMAIL = "info@marubeauty.si";
const PASSWORD = "Marusarigler1707";
const PRICEPILOTID = "232";
const ALREADYHAVETOKEN = "";
const WITHOUTLOGIN = false;

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
  let token = "";
  // Login
  if (WITHOUTLOGIN === false) {
    await page.goto("https://admin.pricepilot.io/avtentikacija/prijava");
    await page.type("#email", EMAIL);
    await page.type("#password", PASSWORD);
    await page.click("#submit");
    await page.waitForNavigation({
      waitUntil: "networkidle0",
    });

    // save token from cookies to variable
    const cookies = await page.cookies();
    token = cookies.find((cookie) => cookie.name === "token").value;
    console.log(token);
    await browser.close();
  } else {
    token = ALREADYHAVETOKEN;
  }

  const servicesURL = `https://api.pricepilot.io/providers/${PRICEPILOTID}/services?page=1&pageSize=10000`;
  const response = await axios.get(servicesURL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const services = [];
  for (const s of response.data._embedded.service) {
    // console.log(s._links);
    const servceURL = s._links.self.href;
    const serviceResponse = await axios.get(servceURL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = serviceResponse.data;

    let service = {
      description: data.shortDescription || "",
      name: data.name,
      tag: data.parentName || null,
      color: generateColor(data.parentName || "default"),
      duration: data.duration / 60 || 0,
      price: data.minimalPrice.lowestPrice + ",00",
      min: "1",
      max: "1",
    };

    // check if duration is a  number
    if (isNaN(service.duration)) {
      let duration = 0;
    }

    services.push(service);
  }

  // save services to file
  fs.writeFileSync(
    "./output/illume/services.json",
    JSON.stringify(services, null, 2)
  );

  // PRIDOBI REZERVACIJE
  const reservationsURL = `https://api.pricepilot.io/providers/${PRICEPILOTID}/bookings?expand=user&page=1&pageSize=100&sortBy=id&sortOrder=desc`;
  const reservationsResponse = await axios.get(reservationsURL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const reservations = [];
  const pageCount = reservationsResponse.data.pageCount;
  for (let i = 1; i <= pageCount; i++) {
    const reservationsURL = `https://api.pricepilot.io/providers/${PRICEPILOTID}/bookings?expand=user&page=${i}&pageSize=100&sortBy=created&sortOrder=desc`;
    const reservationsResponse = await axios.get(reservationsURL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const reservationsReponseList =
      reservationsResponse.data._embedded.bookingbyprovider;

    for (const r of reservationsReponseList) {
      try {
        if (r.canceled === true || r.cancaledByAdmin === true) {
          continue;
        }

        for (
          let i = 0;
          i < r.bookingAttendees[0].bookingAttendeeBookingServices.length;
          i++
        ) {
          //console.log(r.bookingAttendees[0].bookingAttendeeBookingServices[i].bookingService)

          const location =
            r.bookingAttendees[0].bookingAttendeeBookingServices[i]
              .bookingService.bookingServiceSelectionItems[0].selectionItem.item
              .name;
          const subject =
            r.bookingAttendees[0].bookingAttendeeBookingServices[i]
              .bookingService.bookingServiceSelectionItems[1].selectionItem.item
              .name;
          const serviceName =
            r.bookingAttendees[0].bookingAttendeeBookingServices[i]
              .bookingService.service.name;
          const date = new Date(
            r.bookingAttendees[0].bookingAttendeeBookingServices[
              i
            ].bookingService.start
          );

          const comment = r.editorNotes;

          let year = date.getFullYear();

          let day = date.getDate();
          let month = date.getMonth() + 1;

          if (day < 10) {
            day = "0" + day;
          }
          if (month < 10) {
            month = "0" + month;
          }
          let startHours = date.getHours();
          if (date > new Date("2023-10-29")) {
            startHours = startHours - 1;
          }
          let startMinutes = date.getMinutes();
          if (startHours < 10) {
            startHours = "0" + startHours;
          }
          if (startMinutes < 10) {
            startMinutes = "0" + startMinutes;
          }

          const time = startHours + ":" + startMinutes;

          let end = new Date(
            r.bookingAttendees[0].bookingAttendeeBookingServices[
              i
            ].bookingService.end
          );
          let hours = end.getHours();
          // if  date is more tha  29.11.2023 subtract 1 hour
          if (date > new Date("2023-10-29")) {
            hours = hours - 1;
          }

          let minutes = end.getMinutes();
          if (hours < 10) {
            hours = "0" + hours;
          }
          if (minutes < 10) {
            minutes = "0" + minutes;
          }

          const endTime = hours + ":" + minutes;

          const appointment = {
            location: location,
            phone: r.user.phone?.replace("+386", "386") || "",
            customer: r.user.firstname + " " + r.user.lastname,
            service: serviceName,
            timeFrom: time.replaceAll(" ", ""),
            timeTo: endTime.replaceAll(" ", ""),
            address: "",
            email: r.user.contactEmail ? r.user.contactEmail : "",
            subject: subject,
            date: (day + ". " + month + ". " + year).replaceAll(" ", ""),
            comment: comment,
          };

          reservations.push(appointment);
        }
      } catch (error) {
        console.log(
          r.bookingAttendees[0].bookingAttendeeBookingServices[0].bookingService
        );
        console.log(error);
      }
    }

    // save reservations to file
    fs.writeFileSync(
      "./output/askari/reservations.json",
      JSON.stringify(reservations, null, 2)
    );
  }

  // save
})();
