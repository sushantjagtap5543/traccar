const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const deviceRoutes = require("./routes/device.routes");
const positionRoutes = require("./routes/position.routes");
const reportRoutes = require("./routes/report.routes");

const rateLimiter = require("./middleware/rateLimiter");

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

app.use(rateLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/users", userRoutes);
app.use("/api/positions", positionRoutes);
app.use("/api/reports", reportRoutes);

const { PORT } = require("../config/env");

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API Server running on port ${PORT}`);
  });
}

module.exports = app;
