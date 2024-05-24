const fs = require("fs");
const axios = require("axios");
const { moment } = require("moment-timezone");
const { formatAppointment } = require("./utils/utils");
const knex = require("knex")({
  client: "mysql",
  connection: {
    host: "awseb-e-zde3yra9ey-stack-awsebrdsdatabase-z8y5kwcjyweh.cmwoslsj5g0k.eu-central-1.rds.amazonaws.com",
    port: 3306,
    user: "root",
    password: "x9GMbyx6gk9Ue8",
    database: "ebdb",
  },
});

const CLIENT_ID = 1197;

(async () => {
  console.log("Migration started");
  const services = JSON.parse(fs.readFileSync("./output/amak/services.json"));

  for (const service of services) {
    console.log("Starting service: " + service.name);
    if (!service.available_online) {
      continue;
    }
    if (service.staff.length === 0) {
      continue;
    }
    for (const worker of service.staff) {
      console.log("Migrating service: " + service.name);
      console.log("Migrating worker: " + worker);

      try {
        const actuallService = service.name;

        // console.log(actuallService);
        const subjectId = await knex("subject")
          .where({ label: worker })
          .where("FK_clientId", CLIENT_ID)
          .where("isDeleted", 0)
          .select("subjectId")
          .first();
        const serviceId = await knex("service")
          .where({ name: actuallService })
          .where("FK_clientId", CLIENT_ID)
          .where("isDeleted", 0)
          .select("serviceId")
          .first();
        let tag = null;

        const subjectService = await knex("subject_service")
          .insert({
            FK_subjectId: subjectId.subjectId,
            FK_serviceId: serviceId.serviceId,
          })
          .catch((err) => {
            //console.log(err);
          });
      } catch (err) {
        console.log(err);
        console.log("Error with worker: " + worker);
        console.log("Error with service: " + service);
      }
      console.log("Migrated service: " + service.name);
      console.log("Migrated worker: " + worker);
    }
  }
})();
