const fs = require("fs");

function loadJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

function saveJson(filename, data) {
  fs.writeFileSync(filename, JSON.stringify(data, null, 4), "utf8");
}

function findNewAppointments(oldAppointments, newAppointments) {
  const oldSet = new Set(
    oldAppointments.map(
      (appt) => `${appt.date}|${appt.timeFrom}|${appt.name}|${appt.lastName}`
    )
  );
  return newAppointments.filter(
    (appt) =>
      !oldSet.has(`${appt.date}|${appt.timeFrom}|${appt.name}|${appt.lastName}`)
  );
}

function main() {
  const oldAppointments = loadJson("./output/berni/appointments.json");
  const newAppointments = loadJson("./output/berni/appointmentsnew.json");

  const newUniqueAppointments = findNewAppointments(
    oldAppointments,
    newAppointments
  );

  saveJson("new_appointments.json", newUniqueAppointments);
  console.log("New unique appointments saved to new_appointments.json");
}

main();
