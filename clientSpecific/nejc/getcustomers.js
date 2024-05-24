const fs = require("fs");
(() => {
const customers = JSON.parse(fs.readFileSync("output.json"));
const newCustomers = [];
for (const customer of customers) {
  let lastName, firstName, gsm, email;
  firstName = customer["Ime"];
  lastName = customer["Priimek"];
  gsm = customer["Službeni telefon"].replace(/\s/g, "");

  const newCustomer = {
    name: firstName,
    lastName,
    email: null,
    gsm: gsm.length > 6 ? gsm : null,
    countryCode: gsm.length > 6 ? "386" : null,
  };
  newCustomers.push(newCustomer);
}

fs.writeFileSync(
  "formattedCustomers.json",
  JSON.stringify(newCustomers, null, 2)
);
})();
