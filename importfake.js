const axios = require("axios");

const CLIENT_ID = 2106;

(async () => {
  console.log("Migration started");

  for (let i = 2; i <= 300; i++) {
    const customer = {
      lastName: `${i.toString().padStart(3, "0")}`, // Setting lastName to empty string
      name: "RUTH", // Generates names ruth001 to ruth300
      email: null,
      gsm: null,
      countryCode: null,
    };

    try {
      console.log(i);
      console.log(customer);

      const response = await axios.post(
        "https://api.lime-booking.com/migration/importCustomer",
        {
          ...customer,
          clientId: CLIENT_ID,
        }
    //   );

      console.log(response.data);
    } catch (e) {
      console.error(`Failed to migrate customer ${customer.name}: ${e}`);
      continue;
    }
  }
})();
