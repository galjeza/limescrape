const { getJson } = require("serpapi");
const fs = require("fs");

const getMyPlanlyClients = async () => {
  let clientUrls = [];
  let nextUrlParams = {
    engine: "google",
    q: "site:myplanly.com",
    api_key: "a4022fbfc4e59ca856664673fadfae7116acd97032cb3c353e3e29349acda946",
  };

  while (nextUrlParams) {
    try {
      // Get search results from SerpAPI
      const results = await getJson(nextUrlParams);
      results.organic_results.forEach((result) => {
        const { title, link } = result;
        clientUrls.push({ title, link });
      });

      // Check if there is a next page, update nextUrlParams for the next iteration
      if (results.serpapi_pagination && results.serpapi_pagination.next_link) {
        const nextUrl = new URL(results.serpapi_pagination.next_link);
        nextUrlParams = Object.fromEntries(nextUrl.searchParams.entries());
        nextUrlParams.api_key =
          "a4022fbfc4e59ca856664673fadfae7116acd97032cb3c353e3e29349acda946";
      } else {
        nextUrlParams = null; // No more pages, exit the loop
      }
    } catch (error) {
      console.error("Error fetching page:", error);
      nextUrlParams = null; // Exit the loop on error
    }
  }

  // Save all the extracted information to a JSON file
  fs.writeFileSync(
    "./myplanlyclients.json",
    JSON.stringify(clientUrls, null, 2)
  );
};

(async () => {
  await getMyPlanlyClients();
})();
