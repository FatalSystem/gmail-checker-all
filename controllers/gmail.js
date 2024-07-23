const { google } = require("googleapis");
const WebSocket = require("ws");
const server = new WebSocket.Server({ port: 8080 });

console.log("WebSocket server is running on ws://localhost:8080");

const axios = require("axios");
const processedMessages = new Set(); // To keep track of processed messages
let isProcessing = false; // To ensure only one processing cycle runs at a time
const listEmailOxford = [
  "oxford@mp.oxfordclub.com",
  "oxford@mb.oxfordclub.com",
];
const listEmailStewie = ["stewie@artoftrading.net"];
const listEmailLeaderboard = ["do-not-reply@mail.investors.com"];
require("dotenv").config();

const { messageFormat } = require("../utils/messageFormat");
const { messageFormatStewie } = require("../utils/messageFormatStewie");
const { hostname } = require("os");
function checkNewEmails(auth) {
  const gmail = google.gmail({ version: "v1", auth });

  setInterval(async () => {
    if (isProcessing) return; // Prevent overlapping intervals
    isProcessing = true; // Mark as processing

    try {
      const res = await gmail.users.messages.list({
        userId: "me",
        labelIds: ["INBOX"],
        q: "is:unread",
      });

      const messages = res.data.messages;

      if (messages && messages.length > 0) {
        for (const message of messages) {
          if (!processedMessages.has(message.id)) {
            processedMessages.add(message.id);

            const msgRes = await gmail.users.messages.get({
              userId: "me",
              id: message.id,
            });
            const msg = msgRes.data;
            server.on("connection", (ws) => {
              ws.on("message", (messa) => {
                ws.send(
                  msg.payload.headers?.find((info) =>
                    info.name.includes("From")
                  )?.value
                );
              }).setMaxListeners(0);
            });
            console.log(
              listEmailOxford.filter((email) =>
                listEmailOxford.filter((email) =>
                  msg.payload.headers
                    ?.find((info) => info.name.includes("From"))
                    ?.value.includes(email)
                )
              ).length > 0
            );
            if (
              listEmailOxford.filter((email) =>
                listEmailOxford.filter((email) =>
                  msg.payload.headers
                    ?.find((info) => info.name.includes("From"))
                    ?.value.includes(email)
                )
              ).length > 0 &&
              msgRes.data.payload.parts
            )
              parseOxfordGmail(msgRes, message.id, auth);
            if (
              listEmailStewie.filter((email) =>
                listEmailStewie.filter((email) =>
                  msg.payload.headers
                    ?.find((info) => info.name.includes("From"))
                    ?.value.includes(email)
                )
              ).length > 0 &&
              msgRes.data.payload.parts
            ) {
              parseStewieGmail(msgRes, message.id, auth);
              ws.send(
                msg.payload.headers?.find((info) => info.name.includes("From"))
                  ?.value
              );
            }
            if (
              listEmailLeaderboard.filter((email) =>
                listEmailLeaderboard.filter((email) =>
                  msg.payload.headers
                    ?.find((info) => info.name.includes("From"))
                    ?.value.includes(email)
                )
              ).length > 0 &&
              msgRes.data.payload.parts
            )
              parseLeaderboardGmail(msgRes, message.id, auth);
          }
        }
      } else {
        console.log("NEW message empty");
      }
    } catch (err) {
      console.error("API повернув помилку: " + err);
    } finally {
      isProcessing = false; // Mark as not processing
    }
  }, 1000);
  // Checking every 10 seconds
}

// Ensure you have a valid OAuth2 client and call checkNewEmails with it

// Ensure you have a valid OAuth2 client and call checkNewEmails with it

// Ensure you have valid OAuth2 client and call checkNewEmails with it
async function parseLeaderboardGmail(msgRes, messageId, auth) {
  const msg = msgRes.data;

  const whiteList = [
    "joins",
    "increasing",
    "raised",
    "adding",
    "moves to",
    "rejoins",
  ];
  const backList = ["watchlist"];
  const title = msg.payload.headers?.find((info) =>
    info.name.includes("Subject")
  )?.value;
  const isSendMessage =
    whiteList.some((word) =>
      title.toLowerCase().includes(word.toLowerCase())
    ) &&
    !backList.some((word) =>
      title.toLowerCase().includes(word.toLowerCase())
    ) &&
    msg.payload.headers
      ?.find((info) => info.name.includes("From"))
      ?.value.search("do-not-reply@mail.investors.com") !== -1;

  const currentTime =
    "<b><u>Current time</u>: </b>" + new Date().toTimeString();
  const currentTitle = "<b><u>Title</u>: </b>" + title;
  const customMessage =
    "📈 LEADERBOARD %0A" + currentTitle + "%0A" + currentTime;
  const label = "LEADERBOARD";

  // Mark message as read before sending
  isSendMessage && (await markMessageAsRead(auth, messageId, "LEADERBOARD"));

  // Send message to bot

  isSendMessage && (await sendMessageToBot(customMessage, isSendMessage));
}

async function parseOxfordGmail(msgRes, messageId, auth) {
  const whiteList = ["ction to take", "action to take: buy"];
  const msg = msgRes.data;
  const body = Buffer.from(
    msgRes.data.payload.parts[0].body.data,
    "base64"
  ).toString("utf-8");

  const text = messageFormat(msgRes);
  const isSendMessage =
    whiteList.some((word) =>
      body?.toLowerCase().includes(word.toLowerCase())
    ) &&
    listEmailOxford.filter((email) =>
      msg.payload.headers
        ?.find((info) => info.name.includes("From"))
        ?.value.includes(email)
    ).length > 0;

  console.log(
    "🚀 ~ isSendMessage:",
    isSendMessage,
    whiteList.filter((word) => {
      console.log(word);
      return body?.toLowerCase().includes(word.toLowerCase());
    })
  );

  const currentTime =
    "<b><u>Current time</u>: </b>" + new Date().toTimeString();
  const actionToTake =
    "<b><u>Action To Take</u>: </b>" + text.slice(0, text.indexOf(")") + 1);
  const customMessage = "🏦 OXFORD %0A" + actionToTake + "%0A" + currentTime;
  const label = "OXFORD";

  // Mark message as read before sending
  isSendMessage && (await markMessageAsRead(auth, messageId, label));

  // Send message to bot
  isSendMessage && (await sendMessageToBot(customMessage, isSendMessage));
}
async function parseStewieGmail(msgRes, messageId, auth) {
  const whiteList = ["alert"];

  const body = Buffer.from(
    msgRes.data.payload.parts[0].body.data,
    "base64"
  ).toString("utf-8");
  const msg = msgRes.data;

  const text = messageFormatStewie(msgRes);
  const isSendMessage =
    whiteList.some((word) =>
      body?.toLowerCase().includes(word.toLowerCase())
    ) &&
    listEmailStewie.filter((email) =>
      msg.payload.headers
        ?.find((info) => info.name.includes("From"))
        ?.value.includes(email)
    ).length > 0;

  console.log(
    "🚀 ~ isSendMessage:",
    isSendMessage,
    msg.payload.headers?.find((info) => info.name.includes("From"))?.value,
    whiteList.filter((word) => {
      console.log(word);
      return body?.toLowerCase().includes(word.toLowerCase());
    })
  );

  const currentTime =
    "<b><u>Current time</u>: </b>" + new Date().toTimeString();
  const actionToTake =
    "<b><u>Action To Take</u>: </b>" + text.slice(0, text.indexOf(")") + 1);
  const customMessage = "🧑‍💻 STEWIE %0A" + actionToTake + "%0A" + currentTime;
  const label = "STEWIE";

  // Mark message as read before sending
  isSendMessage && (await markMessageAsRead(auth, messageId, label));

  // Send message to bot

  isSendMessage && (await sendMessageToBot(customMessage, isSendMessage));
}

async function markMessageAsRead(auth, messageId, label) {
  const gmail = google.gmail({ version: "v1", auth });

  try {
    const labelsRes = await gmail.users.labels.list({
      userId: "me",
    });
    const labels = labelsRes.data.labels;
    const labelId = labels.find((_label) => _label.name === label).id;
    const response = gmail.users.messages.modify({
      userId: "me",
      id: messageId,
      resource: {
        addLabelIds: [labelId],
        removeLabelIds: ["UNREAD"], // Note: Label IDs are case-sensitive
      },
    });
    console.log("Message marked as read:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error marking message as read:", error.message);
    throw error;
  }
}

async function sendMessageToBot(message, isSendMessage) {
  const url =
    message &&
    `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage?chat_id=593981143&text=${message}&parse_mode=HTML`;
  const url2 =
    message &&
    `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage?chat_id=466616096&text=${message}&parse_mode=HTML`;

  isSendMessage &&
    (await axios.post(url, {
      data: {
        parse_mode: "HTML",
      },
    }));
  isSendMessage &&
    (await axios.post(url2, {
      data: {
        parse_mode: "HTML",
      },
    }));
}

async function createLabel(auth, messageId) {
  const gmail = google.gmail({ version: "v1", auth });
  const res = await gmail.users.messages.modify({
    userId: "me",
    id: messageId, // replace with your message ID
    requestBody: {
      addLabelIds: ["LEADERBOARD"],
      removeLabelIds: ["UNREAD"],
    },
  });
  return res.data.id;
}
module.exports = { checkNewEmails };
