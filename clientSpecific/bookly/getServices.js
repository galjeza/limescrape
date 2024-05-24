const puppeteer = require("puppeteer");
const fs = require("fs");

// Define constants for username and password
const USERNAME = "katja.pozun@gmail.com";
const PASSWORD = "K4tj4p0zun123";

(async () => {
  const browser = await puppeteer.launch({ headless: false }); // Use headless: true in production
  const page = await browser.newPage();

  // Navigate to the login page
  await page.goto("https://www.nailepsa.si/wp-login.php");

  await page.waitForTimeout(1000);
  // Perform login
  await page.type("#user_login", USERNAME);
  // wait for 1 second
  await page.waitForTimeout(1000);

  await page.type("#user_pass", PASSWORD);

  // wait for 1 second
  await page.waitForTimeout(1000);
  await Promise.all([page.waitForNavigation(), page.click("#wp-submit")]);

  // Go to the services page

  await page.goto(
    "https://www.nailepsa.si/wp-admin/admin.php?page=bookly-services"
  );

  // Wait for the services table to load
  await page.waitForSelector("#services-list"); // Adjusted to the specific structure

  // Function to extract services from the current page
  const extractServices = async () => {
    return await page.evaluate(() => {
      const services = [];
      document.querySelectorAll("#services-list tbody tr").forEach((row) => {
        const name = row.querySelector("td:nth-child(2)").innerText;
        const tag = row.querySelector("td:nth-child(3)").innerText;
        const durationStringRaw =
          row.querySelector("td:nth-child(4)").innerText;
        const price = row.querySelector("td:nth-child(5)").innerText;

        function extractDuration(durationStr) {
          let totalMinutes = 0;
          const hoursRegex = /(\d+)\s*h/;
          const minutesRegex = /(\d+)\s*min/;
          const hoursMatch = durationStr.match(hoursRegex);
          if (hoursMatch) {
            totalMinutes += parseInt(hoursMatch[1], 10) * 60;
          }
          const minutesMatch = durationStr.match(minutesRegex);
          if (minutesMatch) {
            totalMinutes += parseInt(minutesMatch[1], 10);
          }
          return totalMinutes;
        }

        const duration = extractDuration(durationStringRaw); // This call should happen inside evaluate or be handled differently

        services.push({ name, tag, duration, price });
      });
      return services;
    });
  };

  let allServices = [];

  await page.waitForTimeout(10000);
  const services = await extractServices();
  allServices = services;

  // Function to handle pagination

  // Output the data as JSON
  console.log(JSON.stringify(allServices));
  // Save to JSON file
  fs.writeFileSync("services.json", JSON.stringify(allServices));

  // Close the browser
  await browser.close();
})();
