// write and export a function that waits for a given number of seconds
const moment = require("moment-timezone");
const wait = (seconds) => {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
};

const formatAppointment = (appointment) => {
  const splitTime = appointment.time.split(" ");
  let fixedTimeFrom = "";
  let fixedTimeTo = "";
  // for each time check if it is a correct time
  for (const time of splitTime) {
    // check if time is in format H:mm
    if (time.match(/^\d{1,2}:\d{2}$/)) {
      if (fixedTimeFrom === "") {
        fixedTimeFrom = time;
      } else if (fixedTimeTo === "") {
        fixedTimeTo = time;
      }

      //add leading zero if needed
      if (fixedTimeFrom.length === 4) {
        fixedTimeFrom = "0" + fixedTimeFrom;
      }
      if (fixedTimeTo.length === 4) {
        fixedTimeTo = "0" + fixedTimeTo;
      }
    }
    // check if this is the first time
  }

  const timeFrom = moment(
    appointment.date + " " + fixedTimeFrom,
    "DD.MM.YYYY HH:mm"
  ).subtract(2, "hours");
  const timeTo = moment(
    appointment.date + " " + fixedTimeTo,
    "DD.MM.YYYY HH:mm"
  ).subtract(2, "hours");
  //  appointment.timeFrom = timeFrom.format("YYYY-MM-DDTHH:mm:ss");
  // appointment.timeTo = timeTo.format("YYYY-MM-DDTHH:mm:ss");
  delete appointment.time;
  //delete appointment.date;
  return appointment;
};

const stringToColour = function (str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  var colour = "#";
  for (var i = 0; i < 3; i++) {
    var value = (hash >> (i * 8)) & 0xff;
    colour += ("00" + value.toString(16)).substr(-2);
  }
  return colour;
};

module.exports = {
  wait,
  stringToColour,
  formatAppointment,
};
