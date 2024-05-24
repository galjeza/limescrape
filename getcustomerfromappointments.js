const fs = require("fs");

const CLIENT_ID = 723;

(async () => {
  const appointments = JSON.parse(
    fs.readFileSync("./setmore/appointments.json")
  );

  const customers = [];

  for (let i = 0; i < appointments.length; i++) {
    const appointment = appointments[i];
    const firstName = appointment.name;
    const lastName = appointment.lastName;
    let gsm = appointment.gsm;
    let email = appointment.email;
    let countryCode = appointment.countryCode;

    if (gsm === "") {
      gsm = null;
    }
    if (email === "") {
      email = null;
    }
    if (countryCode === "") {
      countryCode = null;
    }

    const customer = {
      name: firstName,
      lastName: lastName,
      gsm: gsm,
      email: email,
      countryCode: countryCode,
      clientId: CLIENT_ID,
    };

    customers.push(customer);
  }

  fs.writeFileSync(
    "./setmore/fixedcustomers.json",
    JSON.stringify(customers, null, 2)
  );
})();
