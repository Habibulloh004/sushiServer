import http from "http";
import express from "express";
import { Server } from "socket.io";

const app = express();

const server = http.createServer(app);

const userSocketMap = {};
const users = {};

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://localhost:3000",
      "http://localhost:5174",
      "https://kuryer-sushi.vercel.app",
      "https://joinposter.com",
      "https://platform.joinposter.com",
      "https://c853-213-230-72-138.ngrok-free.app"
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("user connected", socket.id);
  const userId = socket.handshake.query.userId;

  if (userId !== undefined) userSocketMap[userId] = socket.id;

  io.emit("onlineUsers", Object.keys(userSocketMap));
  users[socket.id] = true;
  io.emit("hey", { hey: "heyyooo whatsup broo" });

  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("onlineUsers", Object.keys(userSocketMap));
    io.emit("userStatusUpdate", { userId: socket.id, online: false });
  });
});

export { server, io, app };
