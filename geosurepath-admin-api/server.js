require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const si = require('systeminformation');
const { exec } = require('child_process');
const { Pool } = require('pg');
const winston = require('winston');
const Joi = require('joi');

const app = express();
const PORT = process.env.PORT || 8083;

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
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// --- SECURITY MIDDLEWARE ---
app.use(helmet());
app.use(express.json());

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

// --- SYSTEM HEALTH MONITORING ---
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
    try {
      const dbRes = await pool.query('SELECT 1');
      if (dbRes.rowCount === 1) {
        dbStatus = 'ONLINE';
        dbLatency = Date.now() - start;
      }
    } catch (err) {
      logger.error('Database Health Check Failed:', err);
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
        storage: 'Connected'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('System Info Error:', error);
    res.status(500).json({ error: 'Failed to retrieve system health' });
  }
});

// --- ONE-CLICK FIXES (SANITIZED) ---
const allowedServices = ['traccar', 'database', 'backend', 'cache'];

app.post('/api/admin/restart/:service', authenticate, (req, res) => {
  const { service } = req.params;

  if (!allowedServices.includes(service)) {
    return res.status(400).json({ error: 'Invalid service specified' });
  }

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

// --- GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  logger.info(`GeoSurePath Admin API running on port ${PORT}`);
});
