const ICAL = require("ical.js");
const fs = require("fs");

function generateRandomString() {
  // gebnerate a string of length 4 of alphabet characters
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let randomString = "";
  for (let i = 0; i < 4; i++) {
    randomString += alphabet.charAt(
      Math.floor(Math.random() * alphabet.length)
    );
  }
  return randomString;
}

function extractName(comment) {
  // set customer to first two words of comment
  const words = comment.split(" ");
  const name = words[0] + " " + words[1];
  return name;
}

fs.readFile(
  "./tjasacehner/tjasa.cehner@gmail.com.ics",
  "utf8",
  function (err, data) {
    if (err) throw err;

    // Parse the .ics data
    const jcalData = ICAL.parse(data);
    const comp = new ICAL.Component(jcalData);

    // Get all the events
    const vevents = comp.getAllSubcomponents("vevent");

    // log the numb of events
    console.log(vevents.length);

    const events = vevents.map((vevent) => {
      console.log(vevent);
      const event = new ICAL.Event(vevent);
      return {
        summary: event.summary,
        startDate: event.startDate.toJSDate(),
        endDate: event.endDate.toJSDate(),
        description: event.description,
        location: event.location,
      };
    });

    // set date to tommorow
    const now = new Date();
    now.setDate(now.getDate() + 1);

    const filteredEvents = events.filter((event) => {
      if (event.startDate < now) {
        return false;
      } else {
        return true;
      }
    });

    filteredEvents.sort((a, b) => a.startDate - b.startDate);

    const appointments = filteredEvents.map((event) => {
      console.log(event);
      const timeFrom =
        event.startDate.getHours().toString().padStart(2, "0") +
        ":" +
        event.startDate.getMinutes().toString().padStart(2, "0");

      // Add 30 minutes to the start time for the end time

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
      const randomString1 = generateRandomString(4);
      const randomString2 = generateRandomString();

      // Alternate the subject
      const subject = "";

      return {
        location: "Kozmetični salon Benedikt",
        phone: "",
        customer: extractName(event.summary),
        service: "Google Koledar",
        timeFrom: timeFrom,
        timeTo: timeTo,
        address: "",
        email: "",
        subject: subject,
        date: date,
        comment: event.summary,
      };
    });

    console.log(appointments.length);

    fs.writeFileSync(
      "./tjasacehner/reservations.json",
      JSON.stringify(appointments, null, 2)
    );

    // console.log(appointments); // print appointments to the console
  }
);
