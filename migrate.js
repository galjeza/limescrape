const fs = require("fs");
const axios = require("axios");
const { formatAppointment } = require("./utils/utils");

const CLIENT_ID = 2437;
const USER_ID = 3490;
const MIGRATE_SERVICES = true;
const MIGRATE_APPOINTMENTS = false;

const generateColorBasedOnString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = "#";
  for (let i = 0; i < 3; i++) {
    let value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).substr(-2);
  }

  return color;
};

(async () => {
  console.log("Migration started");
  const services = JSON.parse(fs.readFileSync("./output/2437/services.json"));

  let appointments = JSON.parse(
    fs.readFileSync("./output/spavmestu/manca.json")
  );

  console.log("Number of appointments: " + appointments.length);

  if (MIGRATE_SERVICES) {
    for (let i = 0; i < services.length; i++) {
      console.log("Migrating service: " + services[i].name);
      services[i].duration = services[i].duration.toString();
      services[i].duration = services[i].duration.replace(",", ".");
      services[i].clientId = CLIENT_ID;
      if (!services[i].color || services[i].color === "") {
        services[i].color = generateColorBasedOnString(services[i].name);
      }

      if (services[i].price === "") {
        services[i].price = "0";
      }
      let tagFormatted = services[i].tag;
      if (
        services[i].tag === " " ||
        services[i].tag === "" ||
        services[i].tag === undefined
      ) {
        tagFormatted = null;
      }

      if (
        services[i].duration === 0 // TO pomeni da je nested tag
      ) {
        continue;
      }

      const serviceFormatted = {
        name: services[i].name,
        priceBaseCents: parseInt(
          parseFloat(services[i].price.replace(",", ".")) * 100
        ),
        baseDurationMins: parseInt(services[i].duration),
        description: services[i].description,
        tag: tagFormatted,
        color: services[i].color,
        clientId: CLIENT_ID,
        userId: USER_ID,
        blockedAfter: 0,
        maxAmountUsers: parseInt(services[i].max),
        timeOffStart: services[i].timeOffStart,
        timeOffDuration: services[i].timeOffDuration,
      };

      await axios.post(
        "http://localhost:8080/import/service",
        serviceFormatted
      );
    }
  }

  if (!MIGRATE_APPOINTMENTS) {
    return;
  }

  const demoAppointments = appointments;

  for (let i = 0; i < demoAppointments.length; i++) {
    console.log("Migrating appointment: " + i);
    // appointment has timeFrom and timeTo in format HH:mm (e.g. 10:00) and date in format DD.MM.YYYY (e.g. 01.01.2021)
    // we need to convert it a datetime in format YYYY-MM-DDTHH:mm:ss (e.g. 2021-01-01T10:00:00)
    // set demoappointment[i] time to 10:00
    demoAppointments[i].time =
      demoAppointments[i].timeFrom + " - " + demoAppointments[i].timeTo;
    let appointment = formatAppointment(demoAppointments[i]);
    let service = services.find(
      (service) => service.name === appointment.service
    );

    const prostori = [
      "NEGA OBRAZA",
      "PEDIKURA",
      "MANIKURA",
      "MASAŽA",
      "WELLNESS",
    ];

    const appoitnmentYear = appointment.date.split(".")[2];
    const appointmentMonth = appointment.date.split(".")[1];
    const appointmentDay = appointment.date.split(".")[0];

    // check if appointment is in the past
    const appointmentDate = new Date(
      appoitnmentYear,
      appointmentMonth - 1,
      appointmentDay
    );
    const today = new Date();
    if (appointmentDate < today) {
      console.log("Appointment is in the past: " + appointment.date);
      continue;
    }

    if (
      !service ||
      service === " " ||
      service === "" ||
      service === null ||
      service === undefined
    ) {
      console.log("Service not found: " + appointment.service);
      service = {
        description: null,
        name: "Brez storitve",
        tag: null,
        color: "#000000",
        duration: 60,
        price: "0,00",
        min: "1",
        max: "1",
      };
      appointment.service = "Brez storitve";
    }

    appointment.clientId = CLIENT_ID;
    appointment.userId = USER_ID;
    appointment.serviceName = appointment.service;
    appointment.email = appointment.email?.replace(/\s/g, "") || null;
    appointment.gsm =
      appointment.gsm?.replace(/\s/g, "").length > 5
        ? appointment.gsm?.replace(/\s/g, "")
        : null;
    appointment.countryCode = appointment.gsm ? appointment.countryCode : null;

    appointment.price = parseFloat(service.price.replace(",", "."));

    delete appointment.service;

    console.log(appointment);

    const response = await axios.post(
      "http://localhost:8080" + "/import/appointment",
      {
        ...appointment,
      }
    );
    if (Object.keys(response.data).length === 0) {
      fs.appendFileSync(
        "./output/jasminasuban/migration.log",
        JSON.stringify(appointment) + "\n"
      );
    } else {
      fs.appendFileSync(
        "./simplybook/migration.log",
        JSON.stringify(response.data) + "\n"
      );
    }
  }
})();
