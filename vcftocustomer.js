const fs = require("fs");
const knex = require("knex")({
  client: "mysql",
  connection: {
    host: "awseb-e-zde3yra9ey-stack-awsebrdsdatabase-z8y5kwcjyweh.cmwoslsj5g0k.eu-central-1.rds.amazonaws.com",
    port: 3306,
    user: "root",
    password: "x9GMbyx6gk9Ue8",
    database: "ebdb",
  },
});

const insertCustomer = async (customer) => {
  try {
    const result = await knex("customer").insert(customer);
    console.log(`Customer inserted with id ${result[0]}`);
  } catch (error) {
    console.error(`Could not insert customer: ${error.message}`);
    console.log(customer);
  }
};

const inputFile = "./output/1701/customers.json";

const CLIENT_ID = 1071;

(async () => {
  try {
    // Read the contents of the JSON file
    const data = fs.readFileSync(inputFile, "utf8");
    const customers = [];

    const contacts = JSON.parse(data);
    for (const contact of contacts) {
      let formattedEmail = contact["E-mail Address"];
      if (!formattedEmail.includes("@")) {
        formattedEmail = null;
      }

      // generate a random hash of numbers and letters of length 7
      const randomHash = Math.random().toString(36).substring(2, 9);
      const displayName = contact["Display Name"];
      const fixedFirstName = displayName.split(" ")[0];
      const fixedLastName = displayName.split(" ").slice(1).join(" ");

      const homePhone = contact["Home Phone"];
      const mobilePhone = contact["Mobile Phone"];

      const phoneToUse = homePhone.length > 6 ? homePhone : mobilePhone;

      let countryCode = "386";

      let formattedGSM = phoneToUse
        .replaceAll(/\s/g, "")
        .replaceAll("+386", "0");
      if (formattedGSM.length !== 9) {
        formattedGSM = null;
        countryCode = null;
      }

      const newCustomer = {
        name: fixedFirstName,
        lastName: fixedLastName,
        gsm: formattedGSM,
        email: formattedEmail,
        countryCode: countryCode,
      };

      customers.push(newCustomer);
      console.log(newCustomer);
    }
    fs.writeFileSync("./customersvcf.json", JSON.stringify(customers, null, 2));
  } catch (error) {
    console.error("Error processing the JSON file:", error);
  }
})();
