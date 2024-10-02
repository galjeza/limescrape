const axios = require("axios");
const fs = require("fs");

const getAllBusinesses = async () => {
  let currentPage = 1;
  let clientInfo = [];

  while (true) {
    console.log(
      `Getting data from page ${currentPage} of the Pricepilot API...`
    );

    const response = await axios.get(
      `https://api.pricepilot.io/providers?page={currentPage}`
    );
    const data = response.data;

    if (data._embedded && data._embedded.provider) {
      for (const provider of data._embedded.provider) {
        const info = {
          email: provider.email,
          phone: provider.phone1,
          address: provider.companyAddress,
          taxId: provider.taxId,
          brandName: provider.brandName,
          companyName: provider.companyName,
          created: provider.created,
        };
        clientInfo.push(info);
      }
    }

    if (currentPage >= data.pageCount) {
      break;
    }

    currentPage++;
  }

  return clientInfo;
};

getAllBusinesses()
  .then((clientInfo) => {
    console.log(clientInfo); // print all clients' info
    fs.writeFileSync("./ppclients99.json", JSON.stringify(clientInfo, null, 2));
  })
  .catch((err) => {
    console.error(err); // handle request errors
  });
