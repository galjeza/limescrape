const puppeteer = require("puppeteer");
const axios = require("axios");
const fs = require("fs");

const EMAIL = "biljana.tot1@gmail.com";
const PASSWORD = "matruheadspa1";
const FROM_DATE = "2024-10-10";
const TO_DATE = "2024-10-11";
const LOCATION_ID = "1035";

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1024 });

  // Navigate to the login page
  await page.goto("https://partner.buker.hr/login");

  // Perform login
  await page.type("#mat-input-0", EMAIL); // Type in the email address
  await page.type("#mat-input-1", PASSWORD); // Type in the password
  await page.click('button[type="submit"]'); // Click the login button

  // Wait for navigation after login
  await page.waitForNavigation();

  // Extract cookies to use in axios request
  const cookies = await page.cookies();
  const cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');

  // Get local storage data
  const localStorageData = await page.evaluate(() => {
    return JSON.stringify(window.localStorage);
  });

  console.log('Local Storage Data:', localStorageData);

  const accessToken = await page.evaluate(() => {
    return JSON.parse(window.localStorage.getItem('bukerUser')).accessToken;
  });

  console.log('Access Token:', accessToken);

  // Use axios to send the requests until data is empty
  let pageIndex = 0;
  let formattedServices = [];
  let hasMoreData = true;

  try {
    while (hasMoreData) {
      const response = await axios.get(`https://buker.hr/api/service?page=${pageIndex}`, {
        headers: {
          'authority': 'buker.hr',
          'accept': '*/*',
          'accept-language': 'en-US,en;q=0.9',
          'authorization': 'Bearer ' + accessToken,
          'origin': 'https://partner.buker.hr',
          'referer': 'https://partner.buker.hr/',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
          'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
          'cookie': cookieString,
        }
      });

      if (response.data && response.data.length > 0) {
        response.data.forEach(category => {
          const categoryTag = category.name;
          category.services.forEach(service => {
            formattedServices.push({
              description: service.description || "",
              name: service.name,
              tag: categoryTag,
              color: service.color,
              duration: service.duration,
              price: service.price.toFixed(2)
            });
          });
        });
        pageIndex++;
      } else {
        hasMoreData = false;
      }
    }

    console.log('Formatted Services:', formattedServices);

    fs.writeFileSync("services.json", JSON.stringify(formattedServices, null, 2));
  } catch (error) {
    console.error('Error making request:', error);
  }

  // Fetch appointments for each day between FROM_DATE and TO_DATE
  let currentDate = new Date(FROM_DATE);
  const endDate = new Date(TO_DATE);
  let formattedAppointments = [];

  try {
    while (currentDate <= endDate) {
      const formattedDate = currentDate.toISOString().split('T')[0];
      const response = await axios.get(`https://buker.hr/api/calendar?startDate=${formattedDate}&isWeek=false&isAllEmployees=true&locationId=${LOCATION_ID}`, {
        headers: {
          'authority': 'buker.hr',
          'accept': 'application/json, text/plain, */*',
          'accept-language': 'en-US,en;q=0.9',
          'authorization': 'Bearer ' + accessToken,
          'origin': 'https://partner.buker.hr',
          'referer': 'https://partner.buker.hr/',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
          'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
          'cookie': cookieString,
        }
      });


      console.log('Response' + response);
      if (response.data && response.data.length > 0) {
        response.data.forEach((worker)=>{
            console.log("Getting appointments for, ",  worker.name)
            worker.appointments.forEach((appointment)=>{
                console.log("Appointment: ", appointment)
                const appointmentDate = new Date(appointment.date)
                const customer = appointment.clients[0].clientName
                const customerFirstName = customer.split(" ")[0]    
                const customerLastName = customer.split(" ").slice(1).join(" ");
                appointment.appointmentServices.forEach((appointmentService)=>{
                    console.log("Service: ", appointmentService.name);
                    const timeFrom = appointmentService.timeStart
                    formattedAppointments.push({
                        locationLabel: "temp",
                        userLabel: worker.name,
                        serviceLabel: appointmentService.name,
                        date: appointmentDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replaceAll("/", "."),
                        name: customerFirstName,
                        lastName: customerLastName,
                        timeFrom: appointmentService.timeStart.substring(0, 5),
                        timeTo :   appointmentService.timeEnd.substring(0, 5),  
                        comment: appointment.note || null,

                    });
            })
        })
        })


      currentDate.setDate(currentDate.getDate() + 1);
    }
    }

    console.log('Formatted Appointments:', formattedAppointments);

    // Save the formatted appointments to a JSON file
    fs.writeFileSync("appointments.json", JSON.stringify(formattedAppointments, null, 2));
  } catch (error) {
    console.error('Error making request:', error);
  }

  await browser.close();
})();
