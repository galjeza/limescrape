const puppeteer = require("puppeteer");
const fs = require("fs");
const cheerio = require("cheerio");

const EMAIL = "tamara.bajt@gmail.com";
const PASSWORD = "tamara123";

const FROM_DATE = "01.10.2024"; // Hardcoded start date (dd.mm.yyyy)
const TO_DATE = "11.10.2024";   // Hardcoded end date (dd.mm.yyyy)

(async () => {
  // Launch a new browser instance and create a new page
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1024 });

  // Login
  await page.goto("https://www.myplanly.com/login");
  await page.type("#email", EMAIL); // Type in the email address
  await page.type("#pass", PASSWORD); // Type in the password
  await page.click('button[type="submit"]'); // Click the login button
  await page.waitForSelector("#username"); // Wait until the page loads and the username element appears

  // Navigate to /home to capture the original request
  await page.goto("https://www.myplanly.com/home");

  // Extract all subjects (calendar options) from the dropdown
  const subjects = await page.evaluate(() => {
    const selectElement = document.querySelector("#calendar");
    const options = Array.from(selectElement.options);
    return options.map((option) => option.value);
  });

  console.log(subjects);

  await page.waitForTimeout(3000);

  // Submit the form to generate the first POST request
  const currentDate = new Date();
  let dateString = currentDate.toLocaleDateString("sl-SI", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  let calendarRequestData = null; // To store the captured POST request data
  let requestUrl = null; // To store the request URL

  // Capture the first POST request to /home
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().includes("home")) {
      calendarRequestData = request.postData(); // Save the request data
      requestUrl = request.url(); // Save the request URL
    }
  });

  // Set the date and submit the form
  await page.evaluate((dateString) => {
    document.querySelector("#date").value = dateString;
    document.querySelector("#Form1").submit();
  }, dateString);

  await page.waitForTimeout(3000);

  // Wait to ensure the request is captured
  await page.waitForTimeout(5000);

  if (calendarRequestData && requestUrl) {
    const params = new URLSearchParams(calendarRequestData); // Parse the captured request data
    const dates = generateDateRange(FROM_DATE, TO_DATE); // Generate the range of dates

    const requests = [];
    // Iterate over each date and subject to generate requests
    dates.forEach((date) => {
      subjects.forEach((subject) => {
        params.set("date", date); // Set the current date in the request parameters
        params.set("calendar", subject); // Set the current subject in the request parameters
        const modifiedPostData = params.toString();
        requests.push(
          page.evaluate(
            async (url, postData, subject, date) => {
              // Make the POST request with the modified data
              const response = await fetch(url, {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: postData,
              });
              return { date: date.toString(), subject, response: await response.text() };
            },
            requestUrl,
            modifiedPostData,
            subject,
            date
          )
        );
      });
    });

    // Execute all requests concurrently
    const responses = await Promise.all(requests);

    const appointments = [];

    // Extract data from each response using Cheerio
    responses.forEach(({ date, response }) => {
      const $ = cheerio.load(response);

      // Extract appointment data from HTML using Cheerio
      $(".panel-body").each((i, element) => {
        const paragraphs = $(element).find("p").toArray().map(p => $(p).text().trim());
        const timeText = $(element).find("h5").text().replace(/[a-zA-Z,]/g, "").replace(/[žŽčČšŠćĆđĐ]/g, "").trim();
        const timeFrom = timeText.split(" ")[0].trim().replace(".", ":");
        const timeTo = timeText.split(" ")[2].trim().replace(".", ":");
        let service = "Brez storitve";

        for (const text of paragraphs) {
          if (text.includes("[") && text.includes("]")) {
            service = text.split("[")[1].split("]")[0].trim();
            service = service.split("\\")[1] || service.split("\\")[0];
            service = service.trim();
          }
        }

        const customerInfo = $(element).find("h5 span a").text().split(" ");
        const name = customerInfo[0] || "Brez";
        const lastName = customerInfo.slice(1).join(" ") || "Stranke";

        const appointment = {
          locationLabel: "temp",
          service: service,
          name: name,
          lastName: lastName,
          timeFrom: timeFrom,
          timeTo: timeTo,
          userLabel: "Calendar",
          date: date,
        };

        if (timeFrom && timeTo) {
          appointments.push(appointment);
          console.log(appointment);
        }
      });

      console.log(`Processed response for date: ${date}`);
    });

    // Save appointments data to JSON
    fs.writeFileSync("appointments.json", JSON.stringify(appointments, null, 2));
    console.log("Saved all appointments to appointments.json");
  }

  // Close the browser
  await browser.close();
})();

// Function to generate an array of dates between fromDate and toDate
function generateDateRange(fromDate, toDate) {
  const dates = [];
  const [fromDay, fromMonth, fromYear] = fromDate.split(".").map(Number);
  const [toDay, toMonth, toYear] = toDate.split(".").map(Number);

  let currentDate = new Date(fromYear, fromMonth - 1, fromDay);
  const endDate = new Date(toYear, toMonth - 1, toDay);

  // Generate dates from start to end date
  while (currentDate <= endDate) {
    dates.push(
      currentDate.toLocaleDateString("sl-SI", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    );
    currentDate.setDate(currentDate.getDate() + 1); // Increment the current date by one day
  }

  return dates;
}