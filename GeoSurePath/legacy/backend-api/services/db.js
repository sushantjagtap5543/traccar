const { Pool } = require('pg');
const Redis = require('ioredis');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const redisClient = new Redis(process.env.REDIS_URL);
const ioRedisClient = new Redis(process.env.REDIS_URL);

const init = async () => {
  try {
    await pool.query('SELECT 1');
    logger.info('Database connected successfully');
    await redisClient.ping();
    logger.info('Redis connected successfully');
  } catch (err) {
    logger.error('Failed to initialize database or redis:', err.message);
    throw err;
  }
};

module.exports = { pool, redisClient, ioRedisClient, logger, init };
