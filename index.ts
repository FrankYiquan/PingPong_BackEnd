import "dotenv/config";
import express from "express";
import http from "http";
import mongoose from "mongoose";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";

import { redis } from "./redis/redisClient";
import { startMatchEngine } from "./matchmaking/matchEngine";
import { createMatchRouter } from "./routes/matchRoutes";
import { Notifier } from "./matchmaking/notifier";
import { createUserRouter } from "./routes/userRoutes";

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// -------- DATABASE FIX --------
mongoose
  .connect(process.env.MONGO_URI || process.env.MONGODB_URI!)
  .then(() => console.log("MongoDB connected"))
  .catch(console.error);

// -------- REDIS TEST --------
redis.ping().then((res) => console.log("Redis:", res));

// -------- SOCKET.IO ----------
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

// Track connected users
const userSockets = new Map<string, string>();

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("register", (userId: string) => {
    userSockets.set(userId, socket.id);
  });

  socket.on("disconnect", () => {
    for (const [userId, sockId] of userSockets.entries()) {
      if (sockId === socket.id) userSockets.delete(userId);
    }
  });
});

// -------- NOTIFIER ----------
const notifier: Notifier = {
  async notifyUser(userId, event, payload) {
    const socketId = userSockets.get(userId);
    if (socketId) io.to(socketId).emit(event, payload);
  },
};

// -------- MATCH ENGINE ----------
startMatchEngine(notifier, 1000);

// -------- ROUTES ----------
app.use("/match", createMatchRouter(notifier));
app.use("/user", createUserRouter());

app.get("/", (req, res) => {
  res.send("Matchmaking API is running");
});

// -------- SERVER FIX --------
const PORT = Number(process.env.PORT);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
