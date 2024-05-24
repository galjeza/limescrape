const axios = require("axios");
const fs = require("fs");

async function sendSMS(phoneNumber, message) {
  const url = `http://192.168.1.101:18080/?phone=${phoneNumber}&message=${message}`;

  // Capture the start time
  const start = process.hrtime.bigint();

  // Send get request to the endpoint
  const res = await axios.get(url);

  // Capture the end time
  const end = process.hrtime.bigint();

  // Calculate the difference in milliseconds
  const durationInMilliseconds = Number(end - start) / 1e6;

  console.log(`Sending SMS took ${durationInMilliseconds} ms`);

  return res;
}

(async () => {
  const phoneNumber = "+38631295335";
  let totalTime = 0;
  let totalRequests = 100;

  for (let i = 0; i < totalRequests; i++) {
    let message = new Date().toLocaleTimeString("sl-SI", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      millisecond: "2-digit",
    });

    const start = process.hrtime.bigint();
    const res = await sendSMS(phoneNumber, message);
    const end = process.hrtime.bigint();

    const durationInMilliseconds = Number(end - start) / 1e6;
    totalTime += durationInMilliseconds;

    console.log(res.status);
  }

  console.log(`Average time per request: ${totalTime / totalRequests} ms`);
})();
