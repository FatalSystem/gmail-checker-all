const regexBuy = new RegExp(`\\bALERT: \\b`, "i");

function messageFormatStewie(bodyMessage) {
  console.log("🚀 ~ messageFormat ~ bodyMessage:", bodyMessage);
  const message = bodyMessage.data?.data?.payload.parts[0].body.data;
  Buffer.from(bodyMessage?.data?.payload.parts[0].body.data, "base64")
    ?.toString("utf-8")
    ?.split(".")
    ?.filter((line) => regexBuy.test(line))
    ?.join(" ");

  return message;
}
module.exports = { messageFormatStewie };
