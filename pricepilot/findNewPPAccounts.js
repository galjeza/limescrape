const fs = require("fs");

// Function to read a JSON file and return parsed object
function readJsonFile(filePath) {
  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data);
}

// Function to compare two arrays of objects by email field and return new clients
function compareClients(oldClients, newClients) {
  const oldEmails = new Set(oldClients.map((client) => client.email));
  return newClients.filter((client) => !oldEmails.has(client.email));
}

// Function to write new clients to a new JSON file
function writeNewClientsToFile(newClients, filePath) {
  const data = JSON.stringify(newClients, null, 2);
  fs.writeFileSync(filePath, data, "utf8");
}

// Paths to the JSON files
const oldFilePath = "./pricepilotclients.json";
const newFilePath = "./ppclients2.json";
const outputFilePath = "./new_clients_diff.json";

// Read old and new clients from JSON files
const oldClients = readJsonFile(oldFilePath);
const newClients = readJsonFile(newFilePath);

// Compare and find new clients
const newClientsDiff = compareClients(oldClients, newClients);

// Write new clients to a new JSON file
writeNewClientsToFile(newClientsDiff, outputFilePath);

console.log("New clients have been saved to", outputFilePath);
