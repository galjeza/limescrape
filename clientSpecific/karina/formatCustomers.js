const { count } = require("console");
const fs = require("fs");
(() => {
  const customers = JSON.parse(fs.readFileSync("./customersraw.json"));
  const newCustomers = [];
  for (const customer of customers) {
    let lastName, firstName, gsm, email, notes;
    firstName = customer["name"];
    lastName = customer["lastName"];
    gsm = customer["gsm"].replace(/\s/g, "").replaceAll("-", "");
    if (gsm.length < 6) {
      gsm = null;
    }

    email = customer["email"];
    if (email.length < 6) {
      email = null;
    }

    notes =
      customer["address"] +
      "\n" +
      customer["city"] +
      "\n" +
      customer["dateOfBirth"] +
      "\n" +
      "Stalni popust: " +
      customer["stalni popust"];

    let countryCode = null;
    if (gsm && gsm.length > 6) {
      countryCode = "386";
    }

    const newCustomer = {
      name: firstName,
      lastName,
      email: email,
      gsm: gsm,
      notes,
      countryCode: countryCode,
    };
    newCustomers.push(newCustomer);
  }

  fs.writeFileSync(
    "formattedCustomers.json",
    JSON.stringify(newCustomers, null, 2)
  );
})();
