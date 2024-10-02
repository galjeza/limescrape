const puppeteer = require("puppeteer");
const fs = require("fs");
const axios = require("axios");

const EMAIL = "info@marubeauty.si";
const PASSWORD = "Marusarigler1707";
const PRICEPILOTID = "232";
const FROMDATE = new Date("2019-01-01");
const TODATE = new Date("2025-08-25");
const GETSERVICES = true;
const GETAPPOINTMENTS = true;

const generateColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();

  return "#" + "00000".substring(0, 6 - c.length) + c;
};

const removeDuplicates = (appointments) => {
  const uniqueAppointments = [];
  const appointmentSet = new Set();

  appointments.forEach((appointment) => {
    const key = `${appointment.name}-${appointment.date}-${appointment.timeFrom}-${appointment.timeTo}-${appointment.service}`;
    if (!appointmentSet.has(key)) {
      appointmentSet.add(key);
      uniqueAppointments.push(appointment);
    }
  });

  return uniqueAppointments;
};

const fetchAppointments = async (token, startDateString, endDateString) => {
  const reservationsURL = `https://api.pricepilot.io/providers/${PRICEPILOTID}/bookings?end=${endDateString}&pageSize=10000&start=${startDateString}`;

  try {
    const reservationsResponse = await axios.get(reservationsURL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log(
      "Getting data for date range: ",
      startDateString,
      endDateString
    );

    if (!reservationsResponse.data._embedded) {
      return [];
    }

    const reservationsResponseList =
      reservationsResponse.data._embedded.bookingbyprovider;

    const appointments = [];

    for (const r of reservationsResponseList) {
      if (r.canceled === true || r.canceledByAdmin === true) {
        continue;
      }

      for (
        let i = 0;
        i < r.bookingAttendees[0].bookingAttendeeBookingServices.length;
        i++
      ) {
        const location =
          r.bookingAttendees[0].bookingAttendeeBookingServices[i].bookingService
            .bookingServiceSelectionItems[0].selectionItem.item.name;
        const subject =
          r.bookingAttendees[0].bookingAttendeeBookingServices[i].bookingService
            .bookingServiceSelectionItems[1].selectionItem.item.name;
        const serviceName =
          r.bookingAttendees[0].bookingAttendeeBookingServices[i].bookingService
            .service.name;

        const roomName =
          r.bookingAttendees[0].bookingAttendeeBookingServices[i].bookingService
            .room?.name || undefined;

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
        let minutes = end.getMinutes();
        if (hours < 10) {
          hours = "0" + hours;
        }
        if (minutes < 10) {
          minutes = "0" + minutes;
        }

        const endTime = hours + ":" + minutes;
        const lastNameFixed = r.user.lastname ? r.user.lastname : "";
        const firstNameFixed = r.user.firstname ? r.user.firstname : "";
        const formattedComment = comment ? comment : "";

        const appointment = {
          resourceLabel: roomName ? roomName : null,
          locationLabel: location,
          gsm: r.user.phone?.replace("+", "").split(" ")[1] || "",
          countryCode: r.user.phone?.replace("+", "").split(" ")[0] || "",
          name: firstNameFixed,
          lastName: lastNameFixed,
          service: GETSERVICES ? serviceName : "Brez storitve",
          timeFrom: time.replaceAll(" ", ""),
          timeTo: endTime.replaceAll(" ", ""),
          address: "",
          email: r.user.contactEmail ? r.user.contactEmail : "",
          userLabel: subject,
          date: (day + ". " + month + ". " + year).replaceAll(" ", ""),
          comment: GETSERVICES
            ? formattedComment
            : serviceName + " " + formattedComment,
        };

        appointments.push(appointment);
      }
    }
    return appointments;
  } catch (error) {
    console.error("Error fetching data: ", error);
    return [];
  }
};

(async () => {
  // Create a new folder in ./output with the email
  if (!fs.existsSync(`./output/${EMAIL}`)) {
    fs.mkdirSync(`./output/${EMAIL}`);
  }

  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1024 });
  let token = "";
  await page.goto("https://admin.pricepilot.io/avtentikacija/prijava");
  await page.type("#email", EMAIL);
  await page.type("#password", PASSWORD);
  await page.click("#submit");
  await page.waitForNavigation({
    waitUntil: "networkidle0",
  });

  const cookies = await page.cookies();
  token = cookies.find((cookie) => cookie.name === "token").value;
  console.log(token);
  await browser.close();
  let currentDate = new Date(FROMDATE);
  let reservations = [];

  if (GETSERVICES) {
    const servicesURL = `https://api.pricepilot.io/providers/${PRICEPILOTID}/services?page=1&pageSize=10000`;
    const response = await axios.get(servicesURL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const services = [];
    for (const s of response.data._embedded.service) {
      const serviceURL = s._links.self.href;
      const serviceResponse = await axios.get(serviceURL, {
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
        price: `${data.minimalPrice.lowestPrice},00`,
      };

      if (!isNaN(service.duration)) {
        if (service.tag !== "Vse" && service.name !== "Vse") {
          services.push(service);
        }
      }
    }

    services.push({
      description: "",
      name: "Brez storitve",
      tag: null,
      color: "#000000",
      duration: 60,
      price: "0,00",
    });

    // Save services to file
    fs.writeFileSync(
      `./output/${EMAIL}/services.json`,
      JSON.stringify(services, null, 2)
    );
  }

  if (GETAPPOINTMENTS) {
    const tasks = [];
    const MAX_PARALLEL_REQUESTS = 5;

    while (currentDate <= TODATE) {
      let endDate = new Date(currentDate);
      endDate.setDate(endDate.getDate() + 7);
      if (endDate > TODATE) {
        endDate = new Date(TODATE);
      }

      const startDateString = `${currentDate.getFullYear()}-${(
        currentDate.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}-${currentDate
        .getDate()
        .toString()
        .padStart(2, "0")}T00:00:00Z`;
      const endDateString = `${endDate.getFullYear()}-${(endDate.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${endDate
        .getDate()
        .toString()
        .padStart(2, "0")}T00:00:00Z`;

      tasks.push(fetchAppointments(token, startDateString, endDateString));

      if (tasks.length >= MAX_PARALLEL_REQUESTS) {
        const results = await Promise.all(tasks);
        results.forEach((appointments) => {
          reservations = reservations.concat(appointments);
        });
        tasks.length = 0; // Clear the tasks array
      }

      currentDate.setDate(currentDate.getDate() + 6); // Increment by 6 days for a 1-day overlap
    }

    // Process any remaining tasks
    if (tasks.length > 0) {
      const results = await Promise.all(tasks);
      results.forEach((appointments) => {
        reservations = reservations.concat(appointments);
      });
    }

    reservations = removeDuplicates(reservations);

    fs.writeFileSync(
      `./output/${EMAIL}/appointments.json`,
      JSON.stringify(reservations, null, 2)
    );
  }
})();

function getRoomName(booking) {
  if (
    booking.bookingAttendees &&
    booking.bookingAttendees.length > 0 &&
    booking.bookingAttendeeBookingServices &&
    booking.bookingAttendeeBookingServices.length > 0 &&
    booking.bookingAttendeeBookingServices[0].bookingService &&
    booking.bookingAttendeeBookingServices[0].bookingService.service &&
    booking.bookingAttendeeBookingServices[0].bookingService.service.room &&
    booking.bookingAttendeeBookingServices[0].bookingService.service.room.name
  ) {
    return booking.bookingAttendeeBookingServices[0].bookingService.service.room
      .name;
  }
  return "Room name not found";
}
