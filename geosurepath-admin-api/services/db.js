const { Pool } = require('pg');
const redis = require('redis');
const IORedis = require('ioredis');
const winston = require('winston');
const path = require('path');
require('winston-daily-rotate-file');

// --- LOGGING ---
const logDir = process.env.LOG_DIR || path.join(__dirname, '../logs');
const transport = new winston.transports.DailyRotateFile({
    filename: path.join(logDir, 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d'
});

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
        transport
    ],
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}

// --- DATABASE ---
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
});

const connectWithRetry = async (retries = 5) => {
    try {
        await pool.query('SELECT 1');
        logger.info('Database connected successfully');
    } catch (err) {
        if (retries > 0) {
            logger.warn(`Database connection failed. Retrying in 5s... (${retries} retries left)`);
            setTimeout(() => connectWithRetry(retries - 1), 5000);
        } else {
            logger.error('Could not connect to database after several attempts. Exiting...');
            process.exit(1);
        }
    }
};

if (process.env.NODE_ENV !== 'test') {
    connectWithRetry();
}

// --- REDIS (Cache) ---
const redisClient = redis.createClient({ url: process.env.REDIS_URL });
redisClient.on('error', (err) => logger.error('Redis Client Error:', err));
if (process.env.NODE_ENV !== 'test') {
    (async () => {
        try {
            await redisClient.connect();
            logger.info('Redis connected successfully');
        } catch (err) {
            logger.error('Redis Connection Failed:', err);
        }
    })();
}

// --- IOREDIS (Rate Limiter) ---
const ioRedisClient = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
});

module.exports = { pool, redisClient, ioRedisClient, logger };
