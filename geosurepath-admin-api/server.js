require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const si = require('systeminformation');
const { exec } = require('child_process');
const { Pool } = require('pg');
const winston = require('winston');
const morgan = require('morgan');
const redis = require('redis');
const Joi = require('joi');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8083;
const BACKGROUND_MONITOR_INTERVAL = 60000; // 1 minute
let ALERT_WEBHOOK = process.env.ALERT_WEBHOOK || null;

// --- STARTUP SECURITY AUDIT ---
const expectedKey = process.env.ADMIN_API_KEY;
if (expectedKey && expectedKey.length < 16) {
  console.warn('⚠️ WARNING: ADMIN_API_KEY is too short (<16 chars). This is a security risk.');
}
if (expectedKey === 'your_secure_api_key_here' || expectedKey === 'password') {
  console.error('❌ CRITICAL: Default or weak ADMIN_API_KEY detected. Aborting for security.');
  process.exit(1);
}

// --- Joi Validation Schemas ---
const restartSchema = Joi.object({
  service: Joi.string().valid('traccar', 'database', 'backend', 'cache').required()
});

// --- SWAGGER CONFIGURATION ---
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'GeoSurePath Admin API',
      version: '3.0.0',
      description: 'Enterprise Ops API for GeoSurePath Infrastructure',
    },
    servers: [{ url: `http://localhost:${PORT}` }],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key'
        }
      }
    },
    security: [{ ApiKeyAuth: [] }]
  },
  apis: [__filename],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// --- LOGGING CONFIGURATION ---
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// --- DATABASE CONFIGURATION ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/traccar',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,
});

// Database Retry Logic
const connectWithRetry = (retries = 5) => {
  pool.query('SELECT 1')
    .then(() => logger.info('Database connected successfully'))
    .catch((err) => {
      if (retries > 0) {
        logger.error(`Database connection failed. Retrying in 5s... (${retries} retries left)`);
        setTimeout(() => connectWithRetry(retries - 1), 5000);
      } else {
        logger.error('Database connection failed after maximum retries:', err);
      }
    });
};
connectWithRetry();

// --- REDIS CONFIGURATION ---
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.connect().then(() => logger.info('Redis connected successfully'));

// --- SECURITY & LOGGING MIDDLEWARE ---
app.use(helmet());
app.use(express.json());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:5173'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// --- AUTHENTICATION MIDDLEWARE ---
const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.ADMIN_API_KEY;

  if (!expectedKey) {
    logger.warn('ADMIN_API_KEY not set in environment. Access denied.');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (apiKey && apiKey === expectedKey) {
    next();
  } else {
    logger.warn(`Unauthorized access attempt from ${req.ip}`);
    res.status(403).json({ error: 'Unauthorized' });
  }
};

/**
 * @openapi
 * /api/admin/health:
 *   get:
 *     summary: Get overall infrastructure health
 *     responses:
 *       200:
 *         description: System metrics and service status
 */
app.get('/api/admin/health', authenticate, async (req, res) => {
  try {
    const cpu = await si.currentLoad();
    const mem = await si.mem();
    const disk = await si.fsSize();
    const network = await si.networkStats();

    // Real DB check
    const start = Date.now();
    let dbStatus = 'OFFLINE';
    let dbLatency = 0;
    let dbSize = 'Unknown';
    try {
      const dbRes = await pool.query('SELECT pg_size_pretty(pg_database_size(current_database())) as size');
      if (dbRes.rowCount === 1) {
        dbStatus = 'ONLINE';
        dbLatency = Date.now() - start;
        dbSize = dbRes.rows[0].size;
      }
    } catch (err) {
      logger.error('Database Health Check Failed:', err);
    }

    // Real Redis check
    let redisStatus = 'OFFLINE';
    try {
      const ping = await redisClient.ping();
      if (ping === 'PONG') redisStatus = 'ONLINE';
    } catch (err) {
      logger.error('Redis Health Check Failed:', err);
    }

    res.json({
      cpu: cpu.currentLoad.toFixed(2),
      ram: {
        total: mem.total,
        used: mem.active,
        percent: ((mem.active / mem.total) * 100).toFixed(2)
      },
      disk: disk.map(d => ({
        fs: d.fs,
        size: d.size,
        used: d.used,
        percent: d.use,
        mount: d.mount
      })),
      network: network.length > 0 ? {
        rx: (network[0].rx_sec / 1024).toFixed(2),
        tx: (network[0].tx_sec / 1024).toFixed(2)
      } : { rx: 0, tx: 0 },
      database: {
        status: dbStatus,
        latency: dbLatency,
        storage: dbSize
      },
      cache: {
        status: redisStatus
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('System Info Error:', error);
    res.status(500).json({ error: 'Failed to retrieve system health' });
  }
});

/**
 * @openapi
 * /api/admin/logs:
 *   get:
 *     summary: Retrieve recent system logs
 */
app.get('/api/admin/logs', authenticate, (req, res) => {
  const logPath = path.join(__dirname, 'combined.log');
  if (!fs.existsSync(logPath)) return res.json({ logs: ['No logs found.'] });

  const logs = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean).slice(-100);
  res.json({ logs: logs.reverse() });
});

/**
 * @openapi
 * /api/admin/db/tables:
 *   get:
 *     summary: Get database table statistics
 */
app.get('/api/admin/db/tables', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT table_name, 
      (xpath('/row/cnt/text()', xml_count))[1]::text::int as row_count
      FROM (
        SELECT table_name, query_to_xml(format('select count(*) as cnt from %I', table_name), false, true, '') as xml_count
        FROM information_schema.tables
        WHERE table_schema = 'public'
      ) t
    `);
    res.json({ tables: result.rows });
  } catch (err) {
    logger.error('DB Tables Error:', err);
    res.status(500).json({ error: 'Failed to fetch table stats' });
  }
});

/**
 * @openapi
 * /api/admin/redis/info:
 *   get:
 *     summary: Get detailed Redis information
 */
app.get('/api/admin/redis/info', authenticate, async (req, res) => {
  try {
    const info = await redisClient.info();
    res.json({ info });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Redis info' });
  }
});

/**
 * @openapi
 * /api/admin/traccar/status:
 *   get:
 *     summary: Verify Traccar backend availability
 */
app.get('/api/admin/traccar/status', authenticate, async (req, res) => {
  try {
    const traccarUrl = process.env.TRACCAR_URL || 'http://localhost:8082';
    const response = await axios.get(`${traccarUrl}/api/server`, { timeout: 3000 });
    res.json({ status: 'REACHABLE', version: response.data.version || 'Unknown' });
  } catch (err) {
    res.json({ status: 'UNREACHABLE', error: err.message });
  }
});

/**
 * @openapi
 * /api/admin/restart/{service}:
 *   post:
 *     summary: Restart a specific infrastructure service
 *     parameters:
 *       - in: path
 *         name: service
 *         required: true
 *         schema:
 *           type: string
 *           enum: [traccar, database, backend, cache]
 */
app.post('/api/admin/restart/:service', authenticate, (req, res) => {
  const { error } = restartSchema.validate(req.params);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { service } = req.params;

  let command = '';
  switch (service) {
    case 'traccar':
      command = process.platform === 'win32' ? 'net stop traccar && net start traccar' : 'sudo systemctl restart traccar';
      break;
    case 'database':
      command = process.platform === 'win32' ? 'net stop postgresql-x64-15 && net start postgresql-x64-15' : 'sudo systemctl restart postgresql';
      break;
    case 'backend':
      command = 'pm2 restart geosurepath-admin-api';
      break;
    case 'cache':
      command = 'redis-cli flushall';
      break;
  }

  logger.info(`Restarting service: ${service} by request of ${req.ip}`);

  exec(command, (error, stdout, stderr) => {
    if (error) {
      logger.error(`Exec Error for ${service}: ${error}`);
      return res.status(500).json({ error: `Failed to restart ${service}` });
    }
    res.json({ message: `Successfully restarted ${service}` });
  });
});

/**
 * @openapi
 * /api/admin/alerts/config:
 *   post:
 *     summary: Configure the emergency alert webhook
 */
app.post('/api/admin/alerts/config', authenticate, (req, res) => {
  const { webhookUrl } = req.body;
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return res.status(400).json({ error: 'Invalid webhook URL' });
  }
  ALERT_WEBHOOK = webhookUrl;
  logger.info(`Emergency webhook configured: ${webhookUrl}`);
  res.json({ message: 'Alerting system updated.' });
});

// --- EMERGENCY NOTIFICATION DISPATCHER ---
const sendAlert = async (title, message, severity = 'WARNING') => {
  logger.warn(`ALERT [${severity}]: ${title} - ${message}`);
  if (!ALERT_WEBHOOK) return;

  try {
    await axios.post(ALERT_WEBHOOK, {
      content: `🚨 **GS-INFRA ALERT [${severity}]**\n**${title}**: ${message}\nTime: ${new Date().toISOString()}`
    });
  } catch (err) {
    logger.error('Failed to dispatch alert webhook:', err.message);
  }
};

// --- BACKGROUND INFRASTRUCTURE MONITOR ---
setInterval(async () => {
  try {
    const cpu = await si.currentLoad();
    const mem = await si.mem();
    const ramPercent = (mem.active / mem.total) * 100;

    if (cpu.currentLoad > 90) {
      await sendAlert('CRITICAL_CPU', `CPU Load reached ${cpu.currentLoad.toFixed(2)}%`, 'CRITICAL');
    }

    if (ramPercent > 90) {
      await sendAlert('CRITICAL_RAM', `Memory usage reached ${ramPercent.toFixed(2)}%`, 'CRITICAL');
    }

    try {
      await pool.query('SELECT 1');
    } catch (err) {
      await sendAlert('DATABASE_OFFLINE', 'The SQL engine is unreachable. Disaster recovery required.', 'EMERGENCY');
    }
  } catch (err) {
    logger.error('Background Monitor Error:', err.message);
  }
}, BACKGROUND_MONITOR_INTERVAL);

// --- GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const server = app.listen(PORT, () => {
  logger.info(`GeoSurePath Admin API running on port ${PORT}`);
});

// --- GRACEFUL SHUTDOWN ---
const gracefulShutdown = () => {
  logger.info('Shutting down gracefully...');
  server.close(() => {
    logger.info('HTTP server closed.');
    Promise.all([
      pool.end().then(() => logger.info('Database pool closed.')),
      redisClient.quit().then(() => logger.info('Redis connection closed.'))
    ]).then(() => {
      process.exit(0);
    });
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = app;
