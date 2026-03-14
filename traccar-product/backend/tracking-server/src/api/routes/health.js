const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const Redis = require("ioredis");
const os = require("os");

// Configure DB Pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'traccar',
  password: process.env.DB_PASSWORD || 'traccar',
  database: process.env.DB_NAME || 'traccar',
  port: process.env.DB_PORT || 5432,
});

// Configure Redis Client
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  retryStrategy: () => false, // Don't retry for health check
});

async function checkDatabase() {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    return "connected";
  } catch (err) {
    return `error: ${err.message}`;
  }
}

async function checkRedis() {
  try {
    await redis.ping();
    return "connected";
  } catch (err) {
    return `error: ${err.message}`;
  }
}

router.get("/health", async (req, res) => {
  const dbStatus = await checkDatabase();
  const redisStatus = await checkRedis();

  const isHealthy = dbStatus === "connected" && redisStatus === "connected";

  const healthData = {
    status: isHealthy ? "ok" : "error",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: dbStatus,
      redis: redisStatus,
    },
    system: {
      memoryUsage: process.memoryUsage(),
      loadavg: os.loadavg(),
      platform: process.platform,
    },
  };

  if (!isHealthy) {
    return res.status(503).json(healthData);
  }

  res.json(healthData);
});

module.exports = router;
