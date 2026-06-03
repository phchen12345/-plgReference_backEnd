const { randomUUID } = require("node:crypto");
const { WebSocketServer } = require("ws");

const CHAT_NICKNAME = "匿名球迷";
const messageHistory = [];
const MAX_HISTORY = 50;

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function sendJson(socket, payload) {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

function broadcast(wss, payload) {
  for (const client of wss.clients) {
    sendJson(client, payload);
  }
}

function createChatServer(server) {
  const wss = new WebSocketServer({
    server,
    path: "/ws/chat",
  });

  wss.on("connection", (socket) => {
    sendJson(socket, {
      type: "chat.history",
      messages: messageHistory,
      onlineCount: wss.clients.size,
    });

    broadcast(wss, {
      type: "chat.presence",
      onlineCount: wss.clients.size,
    });

    socket.on("message", (rawMessage) => {
      const data = safeJsonParse(rawMessage.toString());

      if (!data || data.type !== "chat.message") {
        return;
      }

      const text = String(data.text || "").trim().slice(0, 300);

      if (!text) {
        return;
      }

      const message = {
        id: randomUUID(),
        nickname: CHAT_NICKNAME,
        text,
        createdAt: new Date().toISOString(),
      };

      messageHistory.push(message);

      if (messageHistory.length > MAX_HISTORY) {
        messageHistory.shift();
      }

      broadcast(wss, {
        type: "chat.message",
        message,
      });
    });

    socket.on("close", () => {
      broadcast(wss, {
        type: "chat.presence",
        onlineCount: wss.clients.size,
      });
    });
  });

  return wss;
}

module.exports = createChatServer;
