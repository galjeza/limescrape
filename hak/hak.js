const fetch = require("node-fetch");

fetch("https://api.sso.ringier.rs/api/user-profile?lang=sr", {
  headers: {
    accept: "*/*",
    "accept-language": "sl,sl-SI;q=0.9,en-GB;q=0.8,en;q=0.7",
    authorization:
      "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6ImF0K2p3dCIsImtpZCI6ImE2TTlRbHR1bzRnZmc2d2hQUFZfNTZMUDVzVExQaWNYRUJpX1BwMDJUa00ifQ.eyJodHRwczovL3JjLnJpbmdpZXIuY2gvdXJuOnJpbmdpZXI6YnJhbmQtbmFtZSI6InJpbmdpZXIgY29ubmVjdCIsImF1dGhfdGltZSI6MTcxMjQ5ODk2MywiZ3JhbnRfaWQiOiI1WXEyeGlpd2VSeGR6cFNHSWlSbDRicms0RHJMa0hIRFptVGd1M21HNWRHIiwianRpIjoiUDUxMTZZZ1JYUDlZLUp6Tmc4MzVJIiwic3ViIjoiNTAyNGZmMTJmNDZlNGJhZGI5ZjAwMzEwNDNlNjUxZDciLCJpYXQiOjE3MTI3NjAwNzgsImV4cCI6MTcxMjc2MzY3OCwic2NvcGUiOiJvcGVuaWQgZW1haWwgcHJvZmlsZTptYW5hZ2UiLCJjbGllbnRfaWQiOiIzYjYzZDhlZGQ5Yjc0YzRiOWQzMjEyZmI2MmQxZTI3ZiIsImlzcyI6Imh0dHBzOi8vbG9naW4uc3NvLnJpbmdpZXIucnMvIiwiYXVkIjoiM2I2M2Q4ZWRkOWI3NGM0YjlkMzIxMmZiNjJkMWUyN2YifQ.ZYE7ijvo9GfuxcIZQb5K9vugAzcgL8winYpsIrcxjnz4K1lnkqu16B-s45Y7aNzmqTZbBZmBCTC7k7HNYHFSTiH1x7JzXgVheY1zonTc0RtF5DIqVNxwyZv9D26vbiGVaRsVAA_wbQgQYZOLXWjpi79f-ieP3RuNXLxPVGr9yhjJJLMEpFz5xF9LNbYrTt_wsA6OAmQA3xQLfiTv9bVGDOW7DbaIJGf5WmBMtsI5K4BCLi8c3AToh8bH5mE-CVNrSQbyHKGPLm_0MnGneI6wQyTD69egHAl0PODo7dvsmH4dXjSuhb8db3TScdagQlfinK-3pJUlcg7ynPZOS9e7lQ",
    "cache-control": "no-store",
    "content-type": "application/json",
    pragma: "no-cache",
    "sec-ch-ua":
      '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "x-trace-interaction-id": "undefined",
  },
  referrerPolicy: "same-origin",
  body: '{"tabs":[{"tabName":"ana","nicknameAna":"galitoas","anaLocation":"Sloveniaad","anaOccupation":"Recunalnistvo","nicknameAnaIntegrityCheckValue":"32ecdb10324605afb4a2a55d11a0dfc7b3dfc469c9588183d8f79dbe53758525","newsletter":{},"anaUrl":"","anaUrlTitle":""},{"tabName":"global.profile","givenName":"Gal","familyName":"Jeza","gender":"male","birthYear":"2002","email":"gal.jeza55@gmail.com","brandsWithAdmeira":[],"brandsAgreementsWithoutAdmeira":[{"version":"1.0","url":"https://www.blic.rs/vesti/pravila-i-uslovi-koriscenja-sajta/2e8nb4j","language":"en","brandName":"blic","defaultLanguage":"sr"},{"version":"1.0","url":"https://www.blic.rs/vesti/pravila-i-uslovi-koriscenja-sajta/2e8nb4j","language":"sr","brandName":"blic","defaultLanguage":"sr"},{"version":"1.0","url":"https://www.ana.rs/forum/index.php?action=privacy","language":"en","brandName":"ana","defaultLanguage":"sr"},{"version":"1.0","url":"https://www.ana.rs/forum/index.php?action=privacy","language":"sr","brandName":"ana","defaultLanguage":"sr"}],"shouldShowAdmeiraOption":false}]}',
  method: "POST",
});
