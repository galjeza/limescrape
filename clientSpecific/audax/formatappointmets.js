const fs = require("fs");

// Path to your original JSON file
const originalFilePath = "./appointmentsraw.json";
// Path for the new JSON file to be saved
const newFilePath = "./appointments.json";
// Path for the customers JSON file to be saved
const customersFilePath = "./customers.json";

// Helper function to create a customer object
const createCustomerObject = (item) => {
  const email = item.Email.length >= 5 ? item.Email : null;
  const gsm = item.GSM.length >= 5 ? item.GSM : null;
  const countryCode = gsm ? "386" : null; // Set countryCode to null if gsm is null
  return {
    name: item.Ime,
    email: email,
    gsm: gsm,
    countryCode: countryCode,
    lastName: item.Priimek,
    note: `${item.Ulica}, ${item.Kraj}, ${item.DatumRojstva}`.trim(), // Using address and birthdate as note
  };
};

// Function to convert the original item to the new format
const convertToNewFormat = (item) => {
  const email = item.Email.length >= 5 ? item.Email : null;
  const gsm = item.GSM.length >= 5 ? item.GSM : null;
  const countryCode = gsm ? "386" : null; // Set countryCode to null if gsm is null
  return {
    location: "MED_ONA",
    gsm: gsm,
    countryCode: countryCode,
    service: "Audax",
    name: `${item.Ime}`,
    lastName: `${item.Priimek}`,
    comment: item.OPomba,
    timeFrom: item.Start.split(" ")[1].slice(0, -3),
    timeTo: item.Finish.split(" ")[1].slice(0, -3),
    email: email,
    subject: item.ResourceID,
    date: item.Start.split(" ")[0],
  };
};

try {
  // Read the original data from the file
  const originalData = JSON.parse(fs.readFileSync(originalFilePath, "utf8"));
  const customers = [];

  // Convert each item in the original data array to the new format
  const newData = originalData.map((item) => {
    const newCustomer = createCustomerObject(item);
    // Check if customer already exists (based on name, lastName, and email)
    if (
      !customers.some(
        (customer) =>
          customer.name === newCustomer.name &&
          customer.lastName === newCustomer.lastName &&
          customer.email === newCustomer.email
      )
    ) {
      customers.push(newCustomer);
    }
    return convertToNewFormat(item);
  });

  // Save the new data array to a file
  fs.writeFileSync(newFilePath, JSON.stringify(newData, null, 2), "utf8");
  // Save the unique customers to a file
  fs.writeFileSync(
    customersFilePath,
    JSON.stringify(customers, null, 2),
    "utf8"
  );

  console.log("Data conversion complete and saved to new files.");
} catch (err) {
  console.error("Error processing the data:", err);
}
