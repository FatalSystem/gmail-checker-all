const { google } = require("googleapis");
const WebSocket = require("ws");
const axios = require("axios");
const https = require("https");
const fs = require("fs");
require("dotenv").config();

const { messageFormat } = require("../utils/messageFormat");
const { messageFormatStewie } = require("../utils/messageFormatStewie");
const { isFromList } = require("../utils/isFromList");

// Load your SSL certificate and key
const url = "wss://70zyxfprvh.execute-api.us-east-1.amazonaws.com/dev/";
console.log("WebSocket is supported by your Browser!");

let ws = new WebSocket(url);
ws.onopen = function (event) {};
ws.onmessage = function (event) {
  console.log("Message from server ", event.message);
};

ws.onclose = () => {
  console.log("Disconnected from WebSocket server");
};

ws.onerror = (error) => {
  console.error(`WebSocket error: ${error}`);
};
console.log("WebSocket server is running on ws://localhost:8080");

const processedMessages = new Set(); // To keep track of processed messages
let isProcessing = false; // To ensure only one processing cycle runs at a time

const listEmailOxford = [
  "oxford@mp.oxfordclub.com",
  "oxford@mb.oxfordclub.com",
];
const listEmailStewie = ["stewie@artoftrading.net"];
const listEmailLeaderboard = ["do-not-reply@mail.investors.com"];

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

            const fromHeader = msg.payload.headers?.find((info) =>
              info.name.includes("From")
            )?.value;

            if (isFromList(fromHeader, listEmailOxford) && msg.payload.parts) {
              parseOxfordGmail(msgRes, message.id, auth);
            } else if (
              isFromList(fromHeader, listEmailStewie) &&
              msg.payload.parts
            ) {
              parseStewieGmail(msgRes, message.id, auth);
            } else if (
              isFromList(fromHeader, listEmailLeaderboard) &&
              msg.payload.parts
            ) {
              parseLeaderboardGmail(msgRes, message.id, auth);
            }
          }
        }
      } else {
        console.log("No new messages");
      }
    } catch (err) {
      console.error("API error: " + err);
    } finally {
      isProcessing = false; // Mark as not processing
    }
  }, 1000); // Checking every 10 seconds
}
ws.setMaxListeners(120);

async function parseOxfordGmail(msgRes, messageId, auth) {
  const msg = msgRes.data;
  const body = Buffer.from(
    msgRes.data.payload.parts[0].body.data,
    "base64"
  ).toString("utf-8");
  const text = messageFormat(msgRes);
  const whiteList = ["action to take", "action to take: buy"];

  const isSendMessage =
    whiteList.some((word) => body.toLowerCase().includes(word.toLowerCase())) &&
    isFromList(
      msg.payload.headers?.find((info) => info.name.includes("From"))?.value,
      listEmailOxford
    );

  if (isSendMessage) {
    const currentTime =
      "<b><u>Current time</u>: </b>" + new Date().toTimeString();
    const actionToTake =
      "<b><u>Action To Take</u>: </b>" + text.slice(0, text.indexOf(")") + 1);
    const customMessage = "🏦 OXFORD %0A" + actionToTake + "%0A" + currentTime;
    ws.send(
      "BLUE+" +
        String(actionToTake)
          .match(/[A-Z]{2,4}/g)
          .join()
    );
    await markMessageAsRead(auth, messageId, "OXFORD");
    await sendMessageToBot(customMessage);
  }
}

async function parseStewieGmail(msgRes, messageId, auth) {
  const msg = msgRes.data;
  const body = Buffer.from(
    msgRes.data.payload.parts[0].body.data,
    "base64"
  ).toString("utf-8");
  const text = messageFormatStewie(msgRes);
  const whiteList = ["alert"];

  const isSendMessage =
    whiteList.some((word) => body.toLowerCase().includes(word.toLowerCase())) &&
    isFromList(
      msg.payload.headers?.find((info) => info.name.includes("From"))?.value,
      listEmailStewie
    );

  if (isSendMessage) {
    const currentTime =
      "<b><u>Current time</u>: </b>" + new Date().toTimeString();
    const actionToTake =
      "<b><u>Action To Take</u>: </b>" + text.slice(0, text.indexOf(")") + 1);
    const customMessage =
      "🧑‍💻 STEWIE %0A" + actionToTake + "%0A" + currentTime;
    ws.send(
      "RED+" +
        String(customMessage)
          .match(/[A-Z]{2,4}/g)
          .join("")
    );
    await markMessageAsRead(auth, messageId, "STEWIE");
    await sendMessageToBot(customMessage);
  }
}

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
  const blackList = ["watchlist"];
  const title = msg.payload.headers?.find((info) =>
    info.name.includes("Subject")
  )?.value;

  const isSendMessage =
    whiteList.some((word) =>
      title.toLowerCase().includes(word.toLowerCase())
    ) &&
    !blackList.some((word) =>
      title.toLowerCase().includes(word.toLowerCase())
    ) &&
    isFromList(
      msg.payload.headers?.find((info) => info.name.includes("From"))?.value,
      listEmailLeaderboard
    );
  if (isSendMessage) {
    const currentTime =
      "<b><u>Current time</u>: </b>" + new Date().toTimeString();
    const currentTitle = "<b><u>Title</u>: </b>" + title;
    const customMessage =
      "📈 LEADERBOARD %0A" + currentTitle + "%0A" + currentTime;
    ws.send(
      "ORANGE+" +
        String(title)
          .match(/[A-Z]{2,4}/g)
          .join("")
    );
    await markMessageAsRead(auth, messageId, "LEADERBOARD");
    await sendMessageToBot(customMessage);
  }
}

async function markMessageAsRead(auth, messageId, label) {
  const gmail = google.gmail({ version: "v1", auth });

  try {
    const labelsRes = await gmail.users.labels.list({ userId: "me" });
    const labels = labelsRes.data.labels;
    const labelId = labels.find((_label) => _label.name === label).id;

    const response = await gmail.users.messages.modify({
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

async function sendMessageToBot(message) {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage?chat_id=593981143&text=${message}&parse_mode=HTML`;
  const url2 = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage?chat_id=466616096&text=${message}&parse_mode=HTML`;

  try {
    await axios.post(url, { parse_mode: "HTML" });
    await axios.post(url2, { parse_mode: "HTML" });
  } catch (error) {
    console.error("Error sending message to bot:", error.message);
  }
}

module.exports = { checkNewEmails };
