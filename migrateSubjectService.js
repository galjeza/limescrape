
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

const CLIENT_ID = 900;

(async () => {
  console.log("Migration started");
  const workers = JSON.parse(fs.readFileSync("./output/workers.json"));
  let ite = 0;
  for (const worker of workers) {
    for (const service of worker.services) {
      ite++;
      console.log("Ite: " + ite);
      console.log("Migrating service: " + service);
      console.log("Migrating worker: " + worker.name);

      try {
        // split by / remove the first element and joing the others by /
        // count number of (/) and if there is more than 1, remove the last one
        // if there is no /, just use the service
        const actuallService = transformString(service);

        // console.log(actuallService);
        const subjectId = await knex("subject")
          .where({ label: worker.name })
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
        if (!serviceId) {
          tag = await knex("tag")
            .where({ tagName: actuallService })
            .where("FK_clientId", CLIENT_ID)
            .select("tagId")
            .first();
          //console.log(tag);
          // find all services with this tag
          const servicesWithTag = await knex("service_tag")
            .where("FK_tagId", tag.tagId)
            .select("FK_serviceId");
          //console.log(servicesWithTag);
          // insert into subject_service for all services with this tag
          for (const serviceWithTag of servicesWithTag) {
            const subjectService = await knex("subject_service")
              .insert({
                FK_subjectId: subjectId.subjectId,
                FK_serviceId: serviceWithTag.FK_serviceId,
              })
              .catch((err) => {
                // console.log(err);
              });
          }
        } else {
          const subjectService = await knex("subject_service")
            .insert({
              FK_subjectId: subjectId.subjectId,
              FK_serviceId: serviceId.serviceId,
            })
            .catch((err) => {
              console.log(err);
            });
        }
      } catch (err) {
        console.log(err);
        console.log("Error with worker: " + worker.name);
        console.log("Error with service: " + service);
        console.log("Error with service: " + actuallService);
      }
    }
  }
})();
