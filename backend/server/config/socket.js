const { Server } = require("socket.io");

let io;

const getAllowedOrigins = () =>
  (process.env.CLIENT_ORIGINS ||
    (process.env.NODE_ENV === "production"
      ? ""
      : "http://localhost:5000,http://localhost:5173,http://127.0.0.1:5173"))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

module.exports = {
  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: getAllowedOrigins(),
        methods: ["GET", "POST"],
        credentials: true,
      },
    });
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  },
};
