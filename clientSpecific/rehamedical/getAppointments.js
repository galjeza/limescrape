const ICAL = require("ical.js");
const fs = require("fs");

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function extractName(string, service, phone) {
  if (!string) return "";
  let name = string;
  if (service) {
    let serviceWithoutSpaces = service.replace(/\s/g, "");
    name = name
      .replace(service, "")
      .replace(service.toLowerCase(), "")
      .replace(service.toUpperCase(), "")
      .replace(serviceWithoutSpaces, "")
      .replace(serviceWithoutSpaces, "")
      .replace(serviceWithoutSpaces.toLowerCase(), "")
      .replace(serviceWithoutSpaces.toUpperCase(), "")
      .replace(capitalizeFirstLetter(service), "")
      .replaceAll(/\d+/g, "");
  }

  const words = name.split(" ");
  if (words.length > 2) {
    name = words[0] + " " + words[1];
  }

  return name.replace(phone, "").trim();
}
function extractPhone(string) {
  if (!string) return "";
  const regex = /\d{3}\s?\d{3}\s?\d{3}/; // matches a pattern like "123456789" or "123 456 789"
  const result = string.match(regex);
  return result ? result[0] : "";
}
function extractService(string) {
  if (/\brno\b|\brno|rno\b/i.test(string)) {
    return "RNO";
  } else if (/\bnfth\b|\bnfth|nfth\b/i.test(string)) {
    return "NFTH";
  } else if (/\bsi\b|\bsi|si\b/i.test(string)) {
    return "SI";
  } else if (/\bbt\b|\bbt|bt\b/i.test(string)) {
    return "BT";
  } else if (/\bfth\b|\bfth|fth\b/i.test(string)) {
    return "FTH";
  } else {
    return "Brez storitve";
  }
}

const SUBJECT = "Sara Hribernik";
const LOCATION = "Reha MedicAL";

fs.readFile("./sara.ics", "utf8", function (err, data) {
  if (err) throw err;
  const jcalData = ICAL.parse(data);
  const comp = new ICAL.Component(jcalData);
  const vevents = comp.getAllSubcomponents("vevent");

  const events = vevents.map((vevent) => {
    const event = new ICAL.Event(vevent);
    return {
      summary: event.summary,
      startDate: event.startDate.toJSDate(),
      endDate: event.endDate.toJSDate(),
      description: event.description,
      location: event.location,
    };
  });

  events.sort((a, b) => a.startDate - b.startDate);

  const appointments = events.map((event) => {
    const phone = extractPhone(event.summary);
    const service = extractService(event.summary);
    const name = extractName(
      event.summary?.replace("ocena", "") || "",
      service,
      phone
    );
    console.log(
      event.summary + " => " + service + " => " + phone + " => " + name
    );

    const timeFrom =
      event.startDate.getHours().toString().padStart(2, "0") +
      ":" +
      event.startDate.getMinutes().toString().padStart(2, "0");

    const timeTo =
      event.endDate.getHours().toString().padStart(2, "0") +
      ":" +
      event.endDate.getMinutes().toString().padStart(2, "0");
    const date =
      event.startDate.getDate().toString().padStart(2, "0") +
      "." +
      (event.startDate.getMonth() + 1).toString().padStart(2, "0") +
      "." +
      event.startDate.getFullYear();

    return {
      location: LOCATION,
      phone: phone,
      customer: extractName(event.summary),
      service: "Google calendar",
      timeFrom: timeFrom,
      timeTo: timeTo,
      address: "",
      email: "",
      subject: SUBJECT,
      date: date,
      comment: event.summary,
    };
  });

  fs.writeFileSync(
    "./reservations.json",
    JSON.stringify(appointments, null, 2)
  );
});
