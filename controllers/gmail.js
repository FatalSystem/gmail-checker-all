require("dotenv").config();

const { google } = require("googleapis");
const WebSocket = require("ws");
const axios = require("axios");
const { isFromList } = require("../utils/isFromList");
const { messageFormat } = require("../utils/messageFormat");
const { getAssets } = require("../services/getAssets");
const url = "wss://70zyxfprvh.execute-api.us-east-1.amazonaws.com/dev/";
const ws = new WebSocket(url);

const processedMessages = new Set();
let isProcessing = false;

const listEmailOxford = [
  "oxford@mp.oxfordclub.com",
  "oxford@mb.oxfordclub.com",
];
const listEmailStewie = ["stewie@artoftrading.net", "<stewie@artoftrading.net"];
const listEmailLeaderboard = ["do-not-reply@mail.investors.com"];

async function checkNewEmails(auth) {
  let ws = new WebSocket(url);
  ws.onmessage = function (event) {
    console.log("Received message:", event.data);
  };

  ws.onclose = () => {
    setTimeout(() => {
      connect();
    }, 1000);
  };

  ws.onerror = (error) => {
    setTimeout(() => {
      connect();
    }, 1000);
  };

  function connect() {
    // empty function, not sure what it's supposed to do
  }

  const gmail = google.gmail({ version: "v1", auth });
  setInterval(async () => {
    if (isProcessing) return;
    isProcessing = true;

    try {
      const res = await gmail.users.messages.list({
        userId: "me",
        labelIds: ["INBOX"],
        q: "is:unread",
      });
      console.log("🚀 ~ setInterval ~ res:", res);

      const messages = res.data.messages;
      if (messages && messages.length > 0) {
        for (const message of messages) {
          console.log(
            "🚀 ~ setInterval ~ processedMessages.has(message.id):",
            processedMessages.has(message.id)
          );
          if (!processedMessages.has(message.id)) {
            processedMessages.add(message.id);

            const msgRes = await gmail.users.messages.get({
              userId: "me",
              id: message.id,
            });
            console.log("🚀 ~ setInterval ~ msgRes:", msgRes);
            const msg = msgRes.data;

            const fromHeader = msg.payload.headers?.find((info) =>
              info.name.includes("From")
            )?.value;

            if (isFromList(fromHeader, listEmailOxford) && msg.payload.parts) {
              await parseOxfordGmail(msgRes, message.id, auth);
            } else if (
              isFromList(fromHeader, listEmailStewie) &&
              msg.payload.parts
            ) {
              await parseStewieGmail(msgRes, message.id, auth);
            } else if (
              isFromList(fromHeader, listEmailLeaderboard) &&
              msg.payload.parts
            ) {
              await parseLeaderboardGmail(msgRes, message.id, auth);
            }
          }
        }
      } else {
        console.log("No new messages");
      }
      await scrapeData();
    } catch (err) {
      console.error("API error: " + err);
    } finally {
      isProcessing = false;
    }
  }, 1000);
}

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
    const customMessage = "OXFORD %0A" + actionToTake + "%0A" + currentTime;
    const wbMessage = `BLUE+${String(actionToTake.replace("NYSE", "")).match(
      /\b(?!NYSE\b)[A-Z]+\b/
    )}`;
    sendMessageWebsocket(wbMessage);
    await markMessageAsRead(auth, messageId, "OXFORD");
    await sendMessageToBot(customMessage);
  }
}

async function parseStewieGmail(msgRes, messageId, auth) {
  const msg = msgRes.data;
  const title = msg.payload.headers?.find((info) =>
    info.name.includes("Subject")
  )?.value;
  const whiteList = ["alert", "long"];
  const isSendMessage =
    whiteList.some((word) =>
      title.toLowerCase().includes(word.toLowerCase())
    ) &&
    whiteList.some((word) =>
      title.toLowerCase().includes(word.toLowerCase())
    ) &&
    isFromList(
      msg.payload.headers?.find((info) => info.name.includes("From"))?.value,
      listEmailStewie
    );

  if (isSendMessage) {
    const currentTime =
      "<b><u>Current time</u>: </b>" + new Date().toTimeString();
    const actionToTake = "<b><u>Action To Take</u>: </b>" + title;
    const customMessage = "STEWIE %0A" + actionToTake + "%0A" + currentTime;

    const matchedWords =
      String(actionToTake).match(/\b(?!ALERT\b)[A-Z]+\b/g) || [];

    if (matchedWords.includes("AOT")) {
      console.log("Не відправляти повідомлення");
    } else {
      if (matchedWords.length > 0 && isSendMessage) {
        console.log("Обробляємо слова:", matchedWords);
        sendMessageWebsocket(`RED+${matchedWords.join("")}`);
      } else {
        console.log("Немає слів для обробки");
      }
    }

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
      "LEADERBOARD %0A" + currentTitle + "%0A" + currentTime;
    const wbMessage = `ORANGE+${String(title)
      .match(/[A-Z]{2,4}/g)
      .join("")}
    `;
    sendMessageWebsocket(wbMessage);
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

function sendMessageWebsocket(message) {
  ws.send(message);
}

async function scrapeData() {
  const whiteList = ["selling", "sell", "buy", "buying"];
  const assets = await getAssets();
  console.log("Assets:", assets);
  if (assets.length > 0) {
    const currentAsset = "<b><u>Current asset</u>: </b>" + assets[0].toString();
    const currentTime =
      "<b><u>Current time</u>: </b>" + new Date().toTimeString();
    if (
      whiteList.some((word) =>
        assets[0].toString().toLowerCase().includes(word)
      )
    )
      return await sendMessageToBot(currentAsset + "%0A" + currentTime);
  }
}

module.exports = { checkNewEmails, sendMessageToBot };
