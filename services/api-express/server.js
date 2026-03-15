const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const userRoutes = require("./src/routes/userRoutes");
const deviceRoutes = require("./src/routes/deviceRoutes");
const trackingRoutes = require("./src/routes/trackingRoutes");
const jwt = require("jsonwebtoken");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.json());

// Socket.io Authentication & Room Joining
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication error"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.user.id}`);
  
  // Join rooms for all assigned devices
  // In a real scenario, you'd fetch user devices from DB here
  // For now, we allow the client to request joining specific device rooms
  socket.on("joinDevice", (deviceId) => {
    socket.join(deviceId);
    console.log(`User ${socket.user.id} joined room: ${deviceId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/tracking", trackingRoutes(io));

// Basic health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.BACKEND_PORT || 3002;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/traccar";

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });
