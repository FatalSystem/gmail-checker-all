const { google } = require("googleapis");

const fs = require("fs");
const readline = require("readline");
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
];
const { checkNewEmails } = require("./gmail");
const TOKEN_PATH = "./token.json";
/**
 * Створіть клієнт OAuth2 з наданими обліковими даними та виконайте
 * вказану функцію зворотного виклику.
 * @param {Object} credentials Облікові дані клієнта авторизації.
 * @param {function} callback Зворотний виклик для виклику з авторизованим клієнтом.
 */
// Define the authorize function before calling it
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Перевірте, чи раніше ми зберігали токен.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Отримати та зберегти новий токен після запиту на авторизацію користувача,
 * потім виконайте вказану функцію зворотного виклику з авторизованим OAuth2 клієнтом.
 * @param {google.auth.OAuth2} oAuth2Client OAuth2 клієнт для отримання токена.
 * @param {getEventsCallback} callback Зворотний виклик для авторизованого клієнта.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Авторизуйте цей додаток, відвідавши цей URL:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Введіть код з цієї сторінки тут: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error("Помилка отримання токена доступу", err);
      oAuth2Client.setCredentials(token);
      // Зберегти токен на диск для подальших виконань програми
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log("Токен збережено до", TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

module.exports = {
  authorize,
};
