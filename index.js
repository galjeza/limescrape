const puppeteer = require("puppeteer");
const { wait } = require("./utils/utils");
const fs = require("fs");

const EMAIL = "baj.nina@gmail.com";
const PASSWORD = "ZL$T$jajca!";

const prostori = ["WELLNES", "MASAŽA", "NEGA OBRAZA", "PEDIKURA"];
(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: false,
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1024 });

    // Login
    await page.goto("https://www.myplanly.com/login");
    await page.type("#email", EMAIL);
    await wait(1);
    await page.type("#pass", PASSWORD);
    await wait(1);
    await page.click('button[type="submit"]');
    await wait(5);

    await page.waitForSelector("#username");
    await wait(10);

    await page.goto("https://www.myplanly.com/home");
    await wait(3);

    // get subjects
    // get all options of select with id calendar
    const options = await page.$$("#calendar option");
    const subjects = [];
    for (const option of options) {
      const text = await option.evaluate((node) => node.innerText);
      const value = await option.evaluate((node) => node.getAttribute("value"));
      subjects.push({
        text,
        value,
      });
    }

    let appointments = [];
    // select each subject on dropdown one by one
    for (const subject of subjects) {
      if (subject.text.trim() === "Vsi koledarji") {
        continue;
      }
      const trimmedSubject = subject.text.trim();
      // if trimmed subject is andreja or nika or ana continue
      if (
        trimmedSubject.toLowerCase().includes("miza") ||
        trimmedSubject.toLowerCase().includes("stol")
      ) {
        continue;
      }

      await page.select("#calendar", subject.value);
      await wait(5);
      let currentDate = new Date();

      currentDate.setFullYear(2023, 1, 1);
      const scrapeToDate = new Date();
      scrapeToDate.setFullYear(2025, 1, 1);
      const numberOfDays = Math.floor(
        (scrapeToDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24)
      );
      console.log(numberOfDays);

      for (let i = 0; i < numberOfDays; i++) {
        console.log("Subject: " + subject.text + " Date: " + currentDate);
        const appointmentDivs = await page.$$(".panel-body");
        appointmentDivs.shift();
        console.log(appointmentDivs.length);
        for (const appointmentDiv of appointmentDivs) {
          try {
            let service,
              comment,
              time,
              timeFrom,
              timeTo,
              name,
              lastName,
              countryCode,
              gsm,
              address,
              email;

            const paragraphs = await appointmentDiv.$$("p");
            const paragraphsTexts = [];
            for (const paragraph of paragraphs) {
              const text = await paragraph.evaluate((node) => node.innerText);
              paragraphsTexts.push(text);
            }

            for (const text of paragraphsTexts) {
              if (text.includes("[") && text.includes("]")) {
                service = text.split("[")[1].split("]")[0].trim();
                service = service.split("\\")[1] || service.split("\\")[0];
                service = service.trim();
              }
            }

            const h5 = await appointmentDiv.$("h5");
            time = await h5.evaluate((node) => node.innerText);

            time = time.replace(/[a-zA-Z,]/g, "");
            time = time
              .replace("ž", "")
              .replace("Ž", "")
              .replace("č", "")
              .replace("Č", "")
              .replace("š", "")
              .replace("Š", "")
              .replace("ć", "")
              .replace("Ć", "")
              .replace("đ", "")
              .replace("Đ", "")
              .replace("Č", "")
              .replace("č", "")
              .replace("Ć", "")
              .replace("ć", "")
              .replace("Š", "")
              .replace("š", "")
              .replace("Ž", "")
              .replace("ž", "")
              .replace("Đ", "")
              .trim();
            timeFrom = time.split(" ")[0].trim().replace(".", ":");
            timeTo = time.split(" ")[2].trim().replace(".", ":");

            const aElements = await appointmentDiv.$$("p a");
            let phone = "";
            address = "";
            email = "";
            for (const aElement of aElements) {
              const href = await aElement.evaluate((node) =>
                node.getAttribute("href")
              );
              const text = await aElement.evaluate((node) => node.innerText);
              if (href.includes("mailto:")) {
                email = text;
              } // if the href of the element contains tel: then it is a phone number
              else if (href.includes("tel:")) {
                phone = text;
                // split phomne bny 386
                phone = "386 " + phone.split("386")[1];
              } else {
                address = text;
              }
            }

            // check if there is a div with class selectize-input inside appointmentDiv
            let customer = "";
            const isGroupAppointment = await appointmentDiv.$(
              ".selectize-input"
            );
            if (isGroupAppointment) {
              const a = await appointmentDiv.$(
                "i.ico-edit + a[onclick^='showclientcard']"
              );
              if (a) {
                customer = await a.evaluate((node) => node.innerText);
              }
            } else {
              const a = await h5.$("span a");
              if (a) {
                customer = await a.evaluate((node) => node.innerText);
              }
            }

            name = customer.split(" ")[0];
            lastName = customer.split(" ").slice(1).join(" ");

            // set country code to first 3 digits of phone number
            countryCode = phone.substring(0, 3);
            gsm = phone.substring(3).trim();

            // set comment to the join of all paragraphs
            comment = paragraphsTexts.join(" ");
            const appointment = {
              locationLabel: "temp",
              gsm: gsm || null,
              countryCode: countryCode || null,
              service: service || "Brez storitve",
              name: name || "Brez",
              lastName: lastName || "Stranke",
              comment: comment || null,
              timeFrom,
              timeTo,
              email: email || null,
              userLabel: subject.text,
              date: currentDate
                .toLocaleDateString("sl-SI", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
                .replace(/\s/g, ""),
            };

            if (!timeFrom || !timeTo) {
              continue;
            }

            appointments.push(appointment);
            console.log(appointment);
          } catch (error) {
            console.log("Prislo je do napake");
            console.log(error);
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
        let dateString = currentDate.toLocaleDateString("sl-SI", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        dateString = dateString.replace(/\s/g, "");

        await page.evaluate((dateString) => {
          document.querySelector("#date").value = dateString;
        }, dateString);

        await wait(1);

        await page.evaluate(() => {
          document.querySelector("#Form1").submit();
        });

        await page.waitForNavigation({
          waitUntil: "networkidle0",
        });
      }
    }

    // make a array of appointments where userLabel is in prostori
    const appointmentsFiltered = appointments.filter((appointment) =>
      prostori.includes(appointment.userLabel)
    );

    console.log("Appt filtere:", appointmentsFiltered.length);
    // iterate over appointments filtered
    appointmentsFiltered.map((prostoriAppt) => {
      try {
        // find a appointment in appointments where date, timeFrom, timeTo, , name, lastName, are the same
        const appointment = appointments.find(
          (appointment) =>
            appointment.date === prostoriAppt.date &&
            appointment.timeFrom === prostoriAppt.timeFrom &&
            appointment.timeTo === prostoriAppt.timeTo &&
            appointment.name === prostoriAppt.name &&
            appointment.lastName === prostoriAppt.lastName
        );

        // add a resourceLabel to the appoiintment
        appointment.resourceLabel = prostoriAppt.userLabel;
      } catch (error) {
        console.log(prostoriAppt);
        console.log(error);
      }
    });

    await browser.close();
    fs.writeFileSync(
      "./output/ninabaj/appointments.json",
      JSON.stringify(appointments, null, 2)
    );

    appointments = appointments.filter(
      (appointment) => !prostori.includes(appointment.userLabel)
    );
  } catch (error) {
    console.log(error);
    await wait(1000);
  }
})();
