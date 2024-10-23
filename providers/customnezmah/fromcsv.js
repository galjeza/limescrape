const csv = require("csvtojson");
const fs = require("fs");
(async () => {
  const data = await csv().fromFile("export.csv");
  const customers = data.map((row) => {
    let name = row["First Name"];
    let lastName = row["Last Name"];
    let countryCode = row["Mobile Phone"]
      ? row["Mobile Phone"].split(" ")[0].replace("+", "")
      : null;
    let gsm = row["Mobile Phone"].replace("+" + countryCode + " ", "");
    gsm = gsm.replaceAll(" ", "");

    let email = row["E-mail Address"];

    if (email.length < 5) {
      email = null;
    }

    if (gsm.length < 5) {
      gsm = null;
      countryCode = null;
    }

    return {
      name,
      lastName,
      countryCode,
      gsm,
      email,
    };
  });

  fs.writeFileSync("customers.json", JSON.stringify(customers, null, 2));

  console.log(customers);
})();
