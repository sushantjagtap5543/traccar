const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/traccar";
mongoose.connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB for Geofencing/Alerts"))
  .catch(err => console.error("MongoDB connection error:", err));

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const deviceRoutes = require("./routes/device.routes");
const positionRoutes = require("./routes/position.routes");
const reportRoutes = require("./routes/report.routes");

const geofenceRoutes = require("./routes/geofence.routes");

const rateLimiter = require("./middleware/rateLimiter");
const auditLog = require("./middleware/audit.middleware");
const dashboardRoutes = require("../routes/dashboard");
const healthRoutes = require("../routes/health");
const { verifyToken } = require("../middleware/auth");

const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: { origin: "*" }
});

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

app.use(rateLimiter);
app.use(auditLog);

// Pass io to routes/controllers that need it
app.use("/api/auth", authRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/users", userRoutes);
app.use("/api/positions", positionRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dashboard", verifyToken, dashboardRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/geofences", geofenceRoutes);

const { PORT } = require("../config/env");

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`API Server with Socket.io running on port ${PORT}`);
  });
}

module.exports = app;
