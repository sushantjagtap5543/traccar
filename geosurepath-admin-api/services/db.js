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

const maskSensitive = winston.format((info) => {
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth']; // BUG-027: Removed email/mobile from broad masking
    const mask = (obj) => {
        for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                mask(obj[key]);
            } else if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
                obj[key] = '********';
            }
        }
    };
    if (info.payload && typeof info.payload === 'object') mask(info.payload);
    if (typeof info.message === 'object') mask(info.message);
    return info;
});

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        maskSensitive(),
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
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 100, // increased from 20
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000, // increased from 2000
});

const connectWithRetry = async (retries = 5) => {
    try {
        await pool.query('SELECT 1');
        logger.info('Database connected successfully');
    } catch (err) {
        if (retries > 0) {
            logger.warn(`Database connection failed. Retrying in 5s... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            return connectWithRetry(retries - 1);
        } else {
            logger.error('Could not connect to database after several attempts.');
            throw err;
        }
    }
};

// --- REDIS (Cache) ---
const redisClient = redis.createClient({ url: process.env.REDIS_URL });
redisClient.on('error', (err) => logger.error('Redis Client Error:', err));

const init = async () => {
    if (process.env.NODE_ENV === 'test') return;
    try {
        await connectWithRetry();
        await redisClient.connect();
        logger.info('External services initialization complete');
    } catch (err) {
        logger.error('Initialization failed:', err);
        process.exit(1);
    }
};

// --- IOREDIS (Rate Limiter) ---
const ioRedisClient = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
});

module.exports = { pool, redisClient, ioRedisClient, logger, init };
