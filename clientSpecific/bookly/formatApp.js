const fs = require("fs");
const path = require("path");

async function formatAppointments() {
  try {
    // Read the JSON file
    const rawData = fs.readFileSync(path.join(__dirname, "appsraw.json"));
    const appointments = JSON.parse(rawData);

    // Transform the data
    const formattedAppointments = appointments.map((appointment) => {
      const timeInfo = getTime(appointment["Appointment date"]);

      let phoneRaw = appointment["Customer phone"];
      let gsm = phoneRaw.slice(4, phoneRaw.length);
      let countryCode = phoneRaw.slice(0, 4);

      gsm = gsm.replace(/\D/g, "");
      countryCode = countryCode.replace(/\D/g, "");

      console.log("Country code: ", countryCode);
      console.log("GSM: ", gsm);

      return {
        locationLabel: "NAILepša salon", // Assuming this is static
        gsm: gsm,
        countryCode: countryCode,
        name: getName(appointment["Customer name"]).firstName,
        lastName: getName(appointment["Customer name"]).lastName,
        service: appointment["Storitev"] || "Vse",
        timeFrom: timeInfo.timeFrom,
        timeTo: timeInfo.timeTo,
        address: appointment["Customer address"] || "",
        email: appointment["Customer email"] || "",
        userLabel: appointment["Vam na uslugo"] || "",
        date: formatDate(appointment["Appointment date"]),
        comment: appointment["Opombe"] || "",
      };
    });

    // Save to new JSON file
    fs.writeFileSync(
      path.join(__dirname, "formattedApps.json"),
      JSON.stringify(formattedAppointments, null, 2)
    );
    console.log("Data formatted and saved successfully.");
  } catch (err) {
    console.error("Error processing data:", err);
  }
}

function getName(fullName) {
  const parts = fullName.split(" ");
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function getTime(dateTime) {
  // Example dateTime: "29. maja, 2024 11:00"
  const timePart = dateTime.match(/(\d{1,2}:\d{2})/)[0];
  const hours = parseInt(timePart.split(":")[0], 10);
  const minutes = parseInt(timePart.split(":")[1], 10);

  const timeFrom = `${hours}:${minutes.toString().padStart(2, "0")}`;
  const timeTo = `${hours + 1}:${minutes.toString().padStart(2, "0")}`; // Assuming the service lasts exactly one hour
  return { timeFrom, timeTo };
}

function formatDate(dateTime) {
  const datePart = dateTime.split(",")[0].trim(); // "29. maja 2024"
  let [day, monthName] = datePart.split(" ");
  day = day.replace(/\D/g, "");
  let year = dateTime.split(",")[1].trim(); // "2024"
  year = year.split(" ")[0];
  const month = getMonthNumber(monthName.replace(".", ""));
  return `${day.padStart(2, "0")}.${month}.${year}`;
}

function getMonthNumber(monthName) {
  const months = {
    januarja: "01",
    februarja: "02",
    mareca: "03",
    aprila: "04",
    maja: "05",
    junija: "06",
    julija: "07",
    avgusta: "08",
    septembra: "09",
    oktobra: "10",
    novembra: "11",
    decembra: "12",
  };
  return months[monthName.toLowerCase()] || "01"; // Default to January if not found
}

formatAppointments();
