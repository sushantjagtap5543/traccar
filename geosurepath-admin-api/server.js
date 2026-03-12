require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const si = require('systeminformation');
const { exec } = require('child_process');
const { Pool } = require('pg');
const winston = require('winston');
const morgan = require('morgan');
const redis = require('redis');
const Redis = require('ioredis');
const { RedisStore } = require('rate-limit-redis');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const axios = require('axios');
const promClient = require('prom-client');
const fs = require('fs');
const path = require('path');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 8083;
const BACKGROUND_MONITOR_INTERVAL = 60000; // 1 minute
let ALERT_WEBHOOK = process.env.ALERT_WEBHOOK || null;

// --- STARTUP SECURITY AUDIT ---
const expectedKey = process.env.ADMIN_API_KEY;
if (process.env.NODE_ENV !== 'test') {
  if (!expectedKey || expectedKey.length < 32) {
    console.error('❌ CRITICAL: ADMIN_API_KEY must be at least 32 characters for sufficient entropy.');
    process.exit(1);
  }
  if (expectedKey === 'your_secure_api_key_here_must_be_long' || expectedKey === 'password' || expectedKey.includes('12345')) {
    console.error('❌ CRITICAL: Default or common ADMIN_API_KEY detected. Aborting.');
    process.exit(1);
  }
}

// --- Joi Validation Schemas ---
const restartSchema = Joi.object({
  service: Joi.string().valid('traccar', 'database', 'backend', 'cache').required()
});

// --- SWAGGER CONFIGURATION ---
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.1.0',
    info: {
      title: 'GeoSurePath Admin API',
      version: '3.6.0',
      description: 'Enterprise API for GeoSurePath Infrastructure Monitoring',
    },
    servers: [
      {
        url: process.env.PUBLIC_URL || `http://localhost:${PORT}`,
        description: 'Production Admin Server',
      },
    ],
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

let swaggerDocs = {};
if (process.env.NODE_ENV !== 'test') {
  swaggerDocs = swaggerJsDoc(swaggerOptions);
}

// Fix CSP for Swagger UI
app.use('/api-docs', (req, res, next) => {
  res.removeHeader('Content-Security-Policy');
  next();
}, swaggerUi.serve, swaggerUi.setup(swaggerDocs));

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
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisClient = redis.createClient({ url: redisUrl });
const ioRedisClient = new Redis(redisUrl);

redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.connect().then(() => logger.info('Redis connected successfully'));

// --- SECURITY & LOGGING MIDDLEWARE ---
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  store: new RedisStore({
    sendCommand: (...args) => ioRedisClient.call(...args),
  }),
});
if (process.env.NODE_ENV !== 'test') {
  app.use(limiter);
}

// --- METRICS CONFIGURATION ---
const registry = new promClient.Registry();
promClient.collectDefaultMetrics({ register: registry });
const cpuMetric = new promClient.Gauge({ name: 'cpu_load', help: 'Current CPU Load percentage' });
const ramMetric = new promClient.Gauge({ name: 'ram_percent', help: 'Current RAM usage percentage' });
registry.registerMetric(cpuMetric);
registry.registerMetric(ramMetric);

const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:5173'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// --- AUTHENTICATION MIDDLEWARE ---
const verifyAdminToken = (req, res, next) => {
  const token = req.cookies.adminToken || req.headers['x-admin-token'];
  if (!token) {
    logger.warn(`Auth failure: No token from ${req.ip}`);
    return res.status(403).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, decoded) => {
    if (err || decoded.role !== 'admin') {
      logger.warn(`Invalid JWT attempt from ${req.ip}`);
      return res.status(403).json({ error: 'Unauthorized session' });
    }
    req.admin = decoded;
    next();
  });
};

const adminAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || (req.headers['authorization']?.startsWith('ApiKey ') ? req.headers['authorization'].split(' ')[1] : null);
  if (apiKey && apiKey === expectedKey) return next();
  return verifyAdminToken(req, res, next);
};

// --- AUTH ENDPOINTS ---
app.post('/api/admin/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@geosurepath.com';
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminPasswordHash) {
    logger.error('ADMIN_PASSWORD_HASH not configured. Login rejected.');
    return res.status(500).json({ error: 'Server authentication configuration missing' });
  }

  const isValid = await bcrypt.compare(password, adminPasswordHash);

  if (!isValid) {
    logger.warn(`Invalid password for admin email: ${email}`);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ role: 'admin', email }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30m' });
  res.json({ token });
});

/**
 * @openapi
 * /api/admin/auth/totp-setup:
 *   get:
 *     summary: Generate a new TOTP secret and QR code
 */
app.get('/api/admin/auth/totp-setup', adminAuth, async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({ name: 'GeoSurePath Admin', issuer: 'GeoSurePath' });
    // Store in Redis temporarily for verification step
    await redisClient.set(`totp_secret:${req.admin?.email || 'admin'}`, secret.base32, { EX: 600 });
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);
    res.json({ qrCode, secret: secret.base32 });
  } catch (err) {
    logger.error('TOTP Setup failed:', err);
    res.status(500).json({ error: 'Failed to generate 2FA secret' });
  }
});

/**
 * @openapi
 * /api/admin/auth/verify-totp:
 *   post:
 *     summary: Verify a TOTP code and issue a persistent session token
 */
app.post('/api/admin/auth/verify-totp', async (req, res) => {
  const { token: totpToken, email } = req.body;
  try {
    const secret = await redisClient.get(`totp_secret:${email || 'admin'}`);
    if (!secret) return res.status(400).json({ error: '2FA session expired or not initialized' });

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: totpToken,
      window: 2
    });

    if (verified) {
      const finalToken = jwt.sign({ role: 'admin', email: email || 'admin' }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1h' });
      res.cookie('adminToken', finalToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000
      });
      res.json({ success: true, token: finalToken });
    } else {
      res.status(400).json({ error: 'Invalid or expired 2FA code' });
    }
  } catch (err) {
    logger.error('TOTP Verification failed:', err);
    res.status(500).json({ error: 'Verification error' });
  }
});

/**
 * @openapi
 * /api/admin/health:
 *   get:
 *     summary: Get overall infrastructure health
 *     responses:
 *       200:
 *         description: System metrics and service status
 */
app.get('/api/admin/health', adminAuth, async (req, res) => {
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
      uptime: {
        process: Math.floor(process.uptime()),
        system: si.time().uptime
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
app.get('/api/admin/logs', adminAuth, (req, res) => {
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
app.get('/api/admin/db/tables', adminAuth, async (req, res) => {
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
app.get('/api/admin/redis/info', adminAuth, async (req, res) => {
  try {
    const info = await redisClient.info();
    res.json({ info });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Redis info' });
  }
});

/**
 * @openapi
 * /api/admin/uptime:
 *   get:
 *     summary: Get detailed uptime metrics
 */
app.get('/api/admin/uptime', adminAuth, (req, res) => {
  const processUptime = Math.floor(process.uptime());
  const systemUptime = si.time().uptime;

  const format = (seconds) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
  };

  res.json({
    process: {
      uptime: processUptime,
      formatted: format(processUptime)
    },
    system: {
      uptime: systemUptime,
      formatted: format(systemUptime)
    }
  });
});

/**
 * @openapi
 * /api/admin/backup:
 *   post:
 *     summary: Trigger a real database backup using pg_dump
 */
app.post('/api/admin/backup', adminAuth, (req, res) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.sql`;
  const backupDir = process.env.BACKUP_DIR || path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
  const filePath = path.join(backupDir, filename);

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return res.status(500).json({ error: 'DATABASE_URL not configured' });

  const cmd = `pg_dump "${dbUrl}" -f "${filePath}"`;

  logger.info(`Starting DB backup: ${filename}`);

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      logger.error(`Backup failed: ${error.message}`);
      return res.status(500).json({ error: 'Backup failed', details: stderr });
    }
    logger.info(`Backup completed: ${filename}`);
    res.json({ message: 'Backup completed successfully', filename });
  });
});

/**
 * @openapi
 * /metrics:
 *   get:
 *     summary: Prometheus metrics endpoint
 */
app.get('/metrics', adminAuth, async (req, res) => {
  try {
    const cpu = await si.currentLoad();
    const mem = await si.mem();
    cpuMetric.set(cpu.currentLoad);
    ramMetric.set((mem.active / mem.total) * 100);

    res.set('Content-Type', registry.contentType);
    res.end(await registry.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

/**
 * @openapi
 * /api/admin/traccar/status:
 *   get:
 *     summary: Verify Traccar backend availability
 */
app.get('/api/admin/traccar/status', adminAuth, async (req, res) => {
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
app.post('/api/admin/restart/:service', adminAuth, (req, res) => {
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
app.post('/api/admin/alerts/config', adminAuth, (req, res) => {
  const { webhookUrl } = req.body;
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return res.status(400).json({ error: 'Invalid webhook URL' });
  }
  ALERT_WEBHOOK = webhookUrl;
  logger.info(`Emergency webhook configured: ${webhookUrl}`);
  res.json({ message: 'Alerting system updated.', url: ALERT_WEBHOOK });
});

// --- OTP AUTHENTICATION (REDIS BACKED) ---
/**
 * @openapi
 * /api/auth/send-otp:
 *   post:
 *     summary: Generate and send a verification OTP
 */
app.post('/api/auth/send-otp', async (req, res) => {
  const { mobile } = req.body;
  if (!mobile) return res.status(400).json({ error: 'Mobile number required' });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  try {
    // Store in Redis with 5 minute expiry
    await redisClient.set(`otp:${mobile}`, code, { EX: 300 });

    // In a real app, you would call Twilio/SendGrid here.
    // For local testing, codes are delivered via secure channels.
    // logger.info(`[OTP] Verification code for ${mobile}: ${code}`);

    res.json({ message: 'OTP sent successfully', mobile });
  } catch (err) {
    logger.error('Redis OTP Storage Failed:', err);
    res.status(500).json({ error: 'Failed to generate OTP' });
  }
});

/**
 * @openapi
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify an OTP code
 */
app.post('/api/auth/verify-otp', async (req, res) => {
  const { mobile, code } = req.body;
  if (!mobile || !code) return res.status(400).json({ error: 'Mobile and code required' });

  try {
    const storedCode = await redisClient.get(`otp:${mobile}`);
    if (storedCode === code) {
      await redisClient.del(`otp:${mobile}`);
      res.json({ success: true, message: 'OTP verified' });
    } else {
      res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    }
  } catch (err) {
    logger.error('Redis OTP Retrieval Failed:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
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
if (process.env.NODE_ENV !== 'test') {
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
}

// --- GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const server = app.listen(PORT, () => {
  logger.info(`GeoSurePath Admin API running on port ${PORT}`);
});

// --- GRACEFUL SHUTDOWN ---
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await Promise.all([
        pool.end(),
        redisClient.quit(),
        ioRedisClient.quit()
      ]);
      logger.info('Database and Redis connections closed.');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown:', err);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = app;
