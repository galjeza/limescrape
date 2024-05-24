const fs = require("fs");
(() => {
  const customers = JSON.parse(fs.readFileSync("./customerssraw.json"));
  const newCustomers = [];
  for (const customer of customers) {
    let lastName, firstName, gsm, countryCode, email, notes;

    notes = "Date of birth: " + customer["Date of birth / Datum rođenja"];

    email = customer["E mail"].replace(/\s/g, "");
    firstName = customer["Name / Ime"];
    lastName = customer["Last name / Prezime"];

    let rawPhone = customer["Mobile number / Broj mobitela"];
    rawPhone = rawPhone.replace(/\s/g, "");

    if (rawPhone.includes("+")) {
      countryCode = rawPhone.slice(1, 4);
      gsm = rawPhone.slice(4);
    } else {
      countryCode = "385";
      gsm = rawPhone;
    }

    if (gsm.length < 7) {
      gsm = null;
      countryCode = null;
    }

    const newCustomer = {
      email,
      name: firstName,
      lastName,
      gsm,
      countryCode,
      notes,
    };

    newCustomers.push(newCustomer);
  }

  fs.writeFileSync(
    "customers_formatted.json",
    JSON.stringify(newCustomers, null, 2)
  );
})();
