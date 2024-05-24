const fs = require("fs");
(() => {
  const customers = JSON.parse(
    fs.readFileSync("output/savanaspa/customers_raw.json")
  );
  const newCustomers = [];
  for (const customer of customers) {
    let lastName, firstname;
    if (customer.firstname) {
      firstname =
        customer.firstname.charAt(0).toUpperCase() +
        customer.firstname.slice(1);
    }

    if (customer.lastname) {
      lastName =
        customer.lastname.charAt(0).toUpperCase() + customer.lastname.slice(1);
    }

    let email = customer.email || "";
    email = email.replace(/\s/g, "");
    if (email === "") {
      email = null;
    }
    const gsmRaw = customer.gsm || "";
    let countryCode = gsmRaw.slice(0, 3);
    // remove first 4 chars from gsmRaw and add a 0 at the beginning
    let gsm = gsmRaw.replace("+386", "0").trim();
    // remove all spaces from gsm
    gsm = gsm.replace(/\s/g, "");
    if (gsm === "") {
      gsm = null;
    }
    if (countryCode === "") {
      countryCode = null;
    }

    const newCustomer = {
      name: firstname || "",
      lastName: lastName || "",
      email: email || null,
      gsm: gsm?.length > 7 ? gsm : null,
      countryCode: gsm?.length > 7 ? "386" : null,
    };

    newCustomers.push(newCustomer);
  }

  fs.writeFileSync(
    "output/savanaspa/customers_formatted.json",
    JSON.stringify(newCustomers, null, 2)
  );
})();
