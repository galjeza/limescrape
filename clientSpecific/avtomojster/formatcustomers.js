// Write a script that reads some data from a json file and changes it

const fs = require("fs");

async function main() {
  const rawCustomers = JSON.parse(fs.readFileSync("./customersraw.json"));

  const customers = [];

  for (const c of rawCustomers) {
    const rawFullName = c["Ime in priimek"].trim();
    const firstName = rawFullName.split(" ")[0];
    const lastName = rawFullName.split(" ").slice(1).join(" ");
    let email = c["Email"].trim();
    const phoneRaw = c["Telefon"].trim();
    let gsm = phoneRaw.replace("+386", "0");
    if (gsm.length < 4) {
      gsm = null;
    }
    let countryCode;
    if (gsm) {
      countryCode = "386";
    } else {
      countryCode = null;
    }
    if (email === "") {
      email = null;
    }
    const customer = {
      name: firstName,
      lastName: lastName,
      gsm,
      email,
      countryCode: countryCode,
    };
    customers.push(customer);
  }

  fs.writeFileSync(
    "./customers_final.json",
    JSON.stringify(customers, null, 2)
  );
}

main();
