const fs = require("fs");
const axios = require("axios");

const CLIENT_ID = 3410;
(async () => {
  console.log("Migration started");
  const customers = JSON.parse(
    fs.readFileSync("./output/tilen/customers.json")
  );
  console.log("Customers read from file");
  console.log("Number of customers:", customers.length);
  for (let i = 0; i < customers.length; i++) {
    try {
      const customer = customers[i];
      console.log(i);
      console.log(customer);
      if (customer.name === "" && customer.lastName === "") {
        console.log("Skipping empty customer");
        continue;
      }

      // remove chara
      if (!customer.lastName) {
        customer.lastName = "";
      }

      if (!customer.name) {
        customer.name = "";
      }

      const response = await axios.post(
        "http://localhost:8080/import/customer",
        {
          ...customer,
          clientId: CLIENT_ID,
        }
      );
      console.log(response.data);
    } catch (e) {
      console.error(e);
    }
  }
})();
p