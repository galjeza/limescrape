const ICAL = require("ical.js");
const fs = require("fs");

fs.readFile("./ajasverko/export.ics", "utf8", function (err, data) {
  if (err) throw err;

  // Parse the .ics data
  const jcalData = ICAL.parse(data);
  const comp = new ICAL.Component(jcalData);

  // Get all the eventscsv
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

  for (const event of events) {
    console.log(event);
    const description = event.description?.split("\n") || null;
    if (!description) {
      continue;
    }
    // Find an array item that includes string "PROVIDER:"
    const providerItem = description.find((item) => item.includes("PROVIDER:"));
    const provider = providerItem.split(":")[1].trim();

    const customerItem = description.find((item) => item.includes("NAME:"));
    const customer = customerItem?.split(":")[1].trim() || "Brez stranke";

    const gsmItem = description.find((item) => item.includes("MOBILE:"));
    const gsmRaw = gsmItem?.split(":")[1].trim().replace("+", "") || "";

    const countryCode = gsmRaw.substring(0, 3);
    const gsm = gsmRaw.substring(3);

    const emailItem = description.find((item) => item.includes("EMAIL:"));
    const email = emailItem?.split(":")[1].trim() || null;

    const from = new Date(event.startDate);
    const to = new Date(event.endDate);

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

    let serviceItem = description.find((item) => item.includes("SERVICE:"));
    let service = "Brez storitve";
    if (serviceItem) {
      service = serviceItem.split(":")[1].trim();
    }

    const name = customer.split(" ")[0];
    //set remaining name to surname
    const lastName = customer.split(" ").slice(1).join(" ");

    const appointment = {
      locationLabel: "temp",
      userLabel: provider,
      gsm: gsm.trim() !== "" ? gsm : null,
      countryCode: countryCode.trim() !== "" ? countryCode : null,
      name,
      lastName,
      date,
      timeFrom,
      timeTo,
      service,
      email,
      comment: description.join("\n"),
    };
    appointments.push(appointment);
  }

  fs.writeFileSync(
    "./ajasverko/appointments.json",
    JSON.stringify(appointments, null, 2)
  );
});
