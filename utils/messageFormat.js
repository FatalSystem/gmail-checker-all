const regexBuy = new RegExp(`\\b${"Action to Take: Buy"}\\b`, "i");

function messageFormat(bodyMessage) {
  const message = Buffer.from(
    bodyMessage.data.payload.parts[0].body.data,
    "base64"
  )
    .toString("utf-8")
    .split(".")
    .filter((line) => regexBuy.test(line))
    .join(" ");

  return message;
}
module.exports = { messageFormat };
