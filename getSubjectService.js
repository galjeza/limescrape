const fs = require("fs");

const LIMECLIENTID = 1116;
const ONEMANBAND = false;
const WORKERNAME = "Ana";
(() => {
  const appointments = JSON.parse(
    fs.readFileSync("./output/gregor.cadez@asantis.si/appointments.json")
  );

  let services = JSON.parse(
    fs.readFileSync("./output/gregor.cadez@asantis.si/services.json")
  );

  const subject_service = [];

  if (ONEMANBAND) {
    services.forEach((service) => {
      subject_service.push({
        subject: WORKERNAME,
        service: service.name,
      });
    });
  } else {
    appointments.forEach((appointment) => {
      const exists = subject_service.find(
        (s) =>
          s.subject === appointment.subject && s.service === appointment.service
      );

      if (exists || exists?.service === "Vse") {
        return;
      }
      subject_service.push({
        subject: appointment.subject,
        service: appointment.service,
      });
      return;
    });

    services = services.map((service) => {
      const subjects = subject_service
        .filter((ss) => ss.service === service.name)
        .map((ss) => ss.subject)
        .join(", ");

      return { ...service, subjects };
    });

    // Save the updated services data to a new JSON file
    fs.writeFileSync(
      "./output/gregor.cadez@asantis.si/updated_services.json",
      JSON.stringify(services, null, 2)
    );
  }

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

  subject_service.forEach(async (s) => {
    const subject = await knex("subject")
      .where({ label: s.subject })
      .where("FK_clientId", LIMECLIENTID)
      .where("isDeleted", 0)
      .select("subjectId")
      .first();
    const service = await knex("service")
      .where({ name: s.service })
      .where("FK_clientId", LIMECLIENTID)
      .where("isDeleted", 0)
      .select("serviceId")
      .first();
    if (!subject || !service) {
      return;
    }
    const subjectService = await knex("subject_service")
      .insert({
        FK_subjectId: subject.subjectId,
        FK_serviceId: service.serviceId,
      })
      .catch((err) => {
        console.log(err);
      });
    //console.log(subjectService);
  });
})();
