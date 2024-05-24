const fs = require("fs");
(() => {
  const customers = JSON.parse(fs.readFileSync("./customerssraw.json"));
  const newCustomers = [];
  for (const customer of customers) {
    let lastName, firstName, gsm, countryCode, email, notes;

    notes =
      "Rojstni datum: " +
      customer["ROJSTNI DATUM"] +
      "\n" +
      "Naslov: " +
      customer["NASLOV"] +
      "\n" +
      "Kraj: " +
      customer["KRAJ"] +
      "\n" +
      "Obvestila: " +
      customer["OBVESTILA"];

    email = customer["EMAIL"].replace(/\s/g, "");
    firstName = customer["IME "];
    lastName = customer["PRIIMEK"];

    let rawPhone = customer["TELEFON"];
    rawPhone = rawPhone.replace(/\s/g, "").replaceAll("-", "");
    countryCode = "386";
    gsm = rawPhone;

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
