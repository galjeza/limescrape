// write a program that reads customers from json file and prints them

const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "customers-raw.json");

fs.readFile(filePath, "utf8", (err, data) => {
  if (err) {
    console.log(err);
    return;
  }
  const customers = JSON.parse(data);
  let formattedCustomers = [];
  customers.forEach((customer) => {
    const name = customer["Naziv"].split(" ")[0];
    const lastName = customer["Naziv"].replace(name, "").trim();
    let notes = "";
    notes += customer["Naslov"] + " , ";
    notes += customer["Pošta"];
    formattedCustomers.push({
      name,
      lastName,
      notes,
      gsm: null,
      email: null,
      countryCode: null,
    });
  });

  fs.writeFileSync(
    path.join(__dirname, "customers_formatted2.json"),
    JSON.stringify(formattedCustomers, null, 2)
  );
});
