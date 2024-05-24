const fs = require("fs");
const generateColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();

  return "#" + "00000".substring(0, 6 - c.length) + c;
};
(() => {
  const rawServices = JSON.parse(
    fs.readFileSync("./output/2437/servicesraw.json")
  );
  const services = [];
  for (const s of rawServices) {
    console.log(s);
    const name = s["Ime storitve"].trim();
    const price = s["Cena (€, uporabi piko ne vejice)"];
    const duration = s["Čas trajanja (min)"];
    const description = s["Opis storitve (neobvezno)"];
    let tag = s["Tagi"] || null;
    if (tag && tag.length < 1) {
      tag = null;
    }
    if (name.trim().length < 3) {
      continue;
    }
    console.log(s);
    let timeOffStart = s["Time without client on the service (min)(neobvezno)"];
    let timeOffDuration = s["Lasts (min) (neobvezno)"];

    if (timeOffStart === "") {
      timeOffStart = null;
    }
    if (timeOffDuration === "") {
      timeOffDuration = null;
    }

    let workers = s["Izvajalci (Nobvezno, Ločeni z vejico)"].split(",");
    workers = workers.filter((worker) => worker !== "");

    const randomString = Math.random().toString(36).substring(2, 15);
    const color = s["Barva(neobvezno) "] || generateColor(tag || randomString);
    const service = {
      name,
      price: price.replace(".", ",").replace("'", ""),
      duration,
      tag: tag || null,
      color,
      min: "1",
      max: "1",
      workers,
      timeOffStart,
      timeOffDuration,
      description,
    };
    services.push(service);
  }

  fs.writeFileSync(
    "./output/2437/services.json",
    JSON.stringify(services, null, 2)
  );
})();
