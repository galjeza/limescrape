const fs = require("fs");
(() => {
  const customers = JSON.parse(
    fs.readFileSync("./output/tanjanarocime/clients_kozmetika.json")
  );
  // set all fullNames to first letter of each word to uppercase , some fullName can only have one word
  for (const customer of customers) {
    // Set first letter of each word to uppercase
    customer.fullName = customer.fullName.replace(/\w\S*/g, function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  const uniqueCustomers = [];
  for (const customer of customers) {
    const foundCustomer = uniqueCustomers.find(
      (uniqueCustomer) =>
        uniqueCustomer.phone === customer.phone &&
        uniqueCustomer.fullName === customer.fullName
    );
    if (!foundCustomer) {
      uniqueCustomers.push(customer);
    }
  }
  console.log("Number of unique customers: " + uniqueCustomers.length);
  console.log("Number of customers: " + customers.length);

  fs.writeFileSync(
    "output/tanjanarocime/formattedclients1.json",
    JSON.stringify(uniqueCustomers, null, 2)
  );
})();
