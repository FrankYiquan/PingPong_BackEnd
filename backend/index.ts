import "dotenv/config";
import express from "express";
import http from "http";
import mongoose from "mongoose";
import { Server as SocketIOServer } from "socket.io";

import { redis } from "./redis/redisClient"; // shared redis instance
import { startMatchEngine } from "./matchmaking/matchEngine"; 
import { createMatchRouter } from "./routes/matchRoutes";
import { Notifier } from "./matchmaking/notifier";
import { createUserRouter } from "./routes/userRoutes";
const cors = require("cors");

// ---------- EXPRESS SETUP ----------
const app = express();
app.use(cors());
app.use(express.json());

// ---------- DATABASE ----------
mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => console.log("MongoDB connected"))
  .catch(console.error);

// ---------- REDIS TEST ----------
redis.ping().then((res) => console.log("Redis:", res));

// ---------- SOCKET.IO ----------
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: "*" },
});

// Maps userId → socketId
const userSockets = new Map<string, string>();

// everytime a client connects to socket.io server 
// we register their userId with the socketId
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Client must send: socket.emit("register", userId)
  socket.on("register", (userId: string) => {
    console.log("Registered user:", userId);
    userSockets.set(userId, socket.id);
  });

  // Clean up on disconnect
  socket.on("disconnect", () => {
    for (const [userId, sockId] of userSockets.entries()) {
      if (sockId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
  });
});

// ---------- NOTIFIER IMPLEMENTATION ----------
const notifier: Notifier = {
  async notifyUser(userId, event, payload) {
    const socketId = userSockets.get(userId);
    if (!socketId) return;
    io.to(socketId).emit(event, payload);
  },
};

// ---------- MATCH ENGINE ----------
startMatchEngine(notifier, 1000); // run every 1s

// ---------- EXPRESS ROUTES ----------
app.use("/match", createMatchRouter(notifier));
app.use("/user", createUserRouter());


app.get("/", (req, res) => {
  res.send("Matchmaking API is running");
});

// ---------- START SERVER ----------
server.listen(process.env.PORT, () => {
  console.log(`Server running on ${process.env.PORT}`);
}); 
