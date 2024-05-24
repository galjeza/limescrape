const fs = require("fs");
(() => {
  const customers = JSON.parse(
    fs.readFileSync("../output/shecenter/customersconverted.json")
  );
  const newCustomers = [];
  for (const customer of customers) {
    let lastName, firstName;
    firstName = customer.firstName;
    lastName = customer.lastName;
    let email = customer.email;
    email = email.replace(/\s/g, "");
    if (email === "") {
      email = null;
    }

    const gsmRaw = customer.phone || "";
    let gsm = gsmRaw.replace("+386", "0").trim();
    gsm = gsm.replace(/\s/g, "");
    if (gsm === "") {
      gsm = null;
    }

    const newCustomer = {
      name: firstName || "",
      lastName: lastName || "",
      email: email || null,
      gsm: gsm?.length > 7 ? gsm : null,
      countryCode: gsm?.length > 7 ? "386" : null,
    };

    newCustomers.push(newCustomer);
  }

  fs.writeFileSync(
    "customers_formatted.json",
    JSON.stringify(newCustomers, null, 2)
  );
})();
