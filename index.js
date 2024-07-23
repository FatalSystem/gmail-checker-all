const fs = require("fs");
const readline = require("readline");
const { authorize } = require("./controllers/auth");
const { checkNewEmails } = require("./controllers/gmail");
fs.readFile("credentials.json", (err, content) => {
  if (err)
    return console.log("Помилка завантаження файлу секретів клієнта:", err);
  // Авторизуйте клієнта з обліковими даними, потім викличте Gmail API.
  authorize(JSON.parse(content), checkNewEmails);
});
