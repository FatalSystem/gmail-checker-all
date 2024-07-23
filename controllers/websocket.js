const WebSocket = require("ws");
const server = new WebSocket.Server({
  host: "ns-324.awsdns-40.com",
  port: 8080,
});

server.on("connection", (ws) => {
  ws.on("message", (message) => {
    console.log("received: %s", message);
    ws.send(`Hello, you sent -> ${message}`);
  });
  ws.send("Hi there, I am a WebSocket server");
});

console.log("WebSocket server is running on ws://localhost:8080");
