const ICAL = require("ical.js");
const fs = require("fs");

function generateRandomString() {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < 5; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

fs.readFile("./output/spavmestu/vanja.ics", "utf8", function (err, data) {
  if (err) throw err;

  // Parse the .ics data
  const jcalData = ICAL.parse(data);
  const comp = new ICAL.Component(jcalData);

  // Get all the events
  const vevents = comp.getAllSubcomponents("vevent");

  const events = vevents.map((vevent) => {
    const event = new ICAL.Event(vevent);
    return {
      summary: event.summary,
      startDate: event.startDate.toJSDate(),
      endDate: event.endDate.toJSDate(),
      description: event.description,
    };
  });

  let appointments = [];
  console.log(events.length);

  for (const event of events) {
    if (event.summary) {
      if (event.summary.includes("-") || event.summary.includes(" and ")) {
        continue;
      }
    }

    // Find an array item that includes string "PROVIDER:"

    const from = new Date(event.startDate);
    const to = new Date(event.endDate);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (from < yesterday) {
      continue;
    }

    const timeFrom =
      from.getHours().toString().padStart(2, "0") +
      ":" +
      from.getMinutes().toString().padStart(2, "0");

    const timeTo =
      to.getHours().toString().padStart(2, "0") +
      ":" +
      to.getMinutes().toString().padStart(2, "0");
    const date =
      from.getDate().toString().padStart(2, "0") +
      "." +
      (from.getMonth() + 1).toString().padStart(2, "0") +
      "." +
      from.getFullYear();

    const randomName = generateRandomString();
    const randomLastName = generateRandomString();
    const appointment = {
      locationLabel: "Spa v mestu",
      userLabel: "Vanja 1",
      gsm: null,
      countryCode: null,
      name: randomName,
      lastName: randomLastName,
      date,
      timeFrom,
      timeTo,
      service: "Google calendar",
      email: null,
      comment: event.summary || "google calendar",
    };
    appointments.push(appointment);
  }

  fs.writeFileSync(
    "./output/spavmestu/vanja.json",
    JSON.stringify(appointments, null, 2)
  );
});
