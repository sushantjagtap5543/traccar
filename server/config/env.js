require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || "gps_super_secret",
  DB: {
    HOST: process.env.DB_HOST || "localhost",
    USER: process.env.DB_USER || "gps",
    PASS: process.env.DB_PASS || "gps",
    NAME: process.env.DB_NAME || "gps_tracking"
  }
};
