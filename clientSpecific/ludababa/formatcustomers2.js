const fs = require("fs");
(() => {
  const customers = JSON.parse(fs.readFileSync("./customerssraw2.json"));
  const newCustomers = [];
  for (const customer of customers) {
    let lastName, firstName, gsm, countryCode, email, notes;

    notes = "Date of birth: " + customer["Date of birth / Datum rođenja"];

    email = customer["E mail"].replace(/\s/g, "");
    let fullNameRaw = customer["Ime"];
    // remove any non-letter characters
    fullNameRaw = fullNameRaw.replace(/[^a-zA-Z\s]/g, "").trim();
    let fullName = fullNameRaw.split(" ");

    firstName = fullName[0];
    lastName = fullName.slice(1).join(" ");
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
    "customers_formatted2.json",
    JSON.stringify(newCustomers, null, 2)
  );
})();
