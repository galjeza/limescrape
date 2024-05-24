const fs = require("fs");
const axios = require("axios");

(async () => {
  const currentLimeServices = JSON.parse(
    fs.readFileSync("./servs/current.json")
  );

  const sheetsServices = JSON.parse(fs.readFileSync("./servs/new_servs.json"));
  // print out all the services that are in the currentLimeServices but not in the sheetsServices ( by name)
  const currentNames = currentLimeServices.map((service) => service.name);
  const sheetNames = sheetsServices.map((service) => service.name);
  const difference = currentNames.filter((x) => !sheetNames.includes(x));
  console.log(difference);
  const differenceIds = [];
  for (let i = 0; i < difference.length; i++) {
    const name = difference[i];
    const service = currentLimeServices.find(
      (service) => service.name === name
    );
    differenceIds.push(service.serviceId);
  }

  // save the differenceIds to a file
  fs.writeFileSync("./servs/differenceIds.json", JSON.stringify(differenceIds));
})();
