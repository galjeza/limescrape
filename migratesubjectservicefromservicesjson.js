const fs = require("fs");

const LIMECLIENTID = 2273;
(() => {
  const services = JSON.parse(fs.readFileSync("./output/2273/services.json"));

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

  services.forEach(async (serv) => {
    const service = await knex("service")
      .where({ name: serv.name })
      .where("FK_clientId", LIMECLIENTID)
      .where("isDeleted", 0)
      .select("serviceId")
      .first();
    serv.workers.forEach(async (worker) => {
      const subject = await knex("subject")
        .where({ label: worker.trim() })
        .where("FK_clientId", LIMECLIENTID)
        .where("isDeleted", 0)
        .select("subjectId")
        .first();
      if (subject && service) {
        knex("subject_service")
          .insert({
            FK_subjectId: subject.subjectId,
            FK_serviceId: service.serviceId,
          })
          .catch((err) => {
            console.log(err);
          });
      }
    });
  });
})();
