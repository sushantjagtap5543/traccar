const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const promClient = require('prom-client');
const si = require('systeminformation');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { RedisStore } = require('rate-limit-redis');
const uuid = require('uuid');

// --- LOAD MODULAR COMPONENTS ---
const { pool, redisClient, ioRedisClient, logger } = require('./services/db');
const { startMonitor } = require('./services/monitor');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const backupRoutes = require('./routes/backup');
const migrationRoutes = require('./routes/migration');
const { adminAuth } = require('./middleware/auth');
const backupService = require('./services/backupService');

const app = express();
const PORT = process.env.PORT || 8083;

// --- ENV VALIDATION ---
const requiredEnvVars = [
    'DATABASE_URL',
    'REDIS_URL',
    'JWT_SECRET',
    'ADMIN_EMAIL',
    'ADMIN_PASSWORD_HASH',
    'ENCRYPTION_KEY',
    'NODE_ENV'
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        logger.error(`FATAL: Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
}
logger.info('All required environment variables are configured.');

// --- RATE LIMITING ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  store: new RedisStore({
    sendCommand: (...args) => ioRedisClient.call(...args),
  }),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 attempts per 15 mins
  store: new RedisStore({
    sendCommand: (...args) => ioRedisClient.call(...args),
  }),
  skipSuccessfulRequests: true
});

const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20, // 20 attempts per hour
  store: new RedisStore({
    sendCommand: (...args) => ioRedisClient.call(...args),
  }),
});

if (process.env.NODE_ENV !== 'test') {
  app.use(limiter);
}

app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuid.v4();
  res.setHeader('x-request-id', req.id);
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    res.setHeader('x-response-time', `${duration}ms`);
  });
  next();
});

// Access Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms', {
    stream: { write: (message) => logger.info(message.trim()) }
  }));
}

// Maintenance Mode Middleware
app.use(async (req, res, next) => {
    if (req.path.startsWith('/api/admin') || req.path === '/api/health' || req.path === '/metrics') {
        return next();
    }
    
    try {
        const maintRes = await redisClient.get('maintenance_mode');
        if (maintRes === 'true') {
            return res.status(503).json({ error: 'System is under maintenance. Please try again later.' });
        }
    } catch (err) {
        // Fallback to DB if Redis fails
        const dbRes = await pool.query("SELECT value FROM geosurepath_settings WHERE key = 'maintenance_mode' LIMIT 1");
        if (dbRes.rowCount > 0 && dbRes.rows[0].value === 'true') {
            return res.status(503).json({ error: 'System is under maintenance. Please try again later.' });
        }
    }
    next();
});

// --- METRICS CONFIGURATION ---
const registry = new promClient.Registry();
promClient.collectDefaultMetrics({ register: registry });
const cpuMetric = new promClient.Gauge({ name: 'cpu_load', help: 'Current CPU Load percentage' });
const ramMetric = new promClient.Gauge({ name: 'ram_percent', help: 'Current RAM usage percentage' });
registry.registerMetric(cpuMetric);
registry.registerMetric(ramMetric);

// --- SWAGGER CONFIGURATION ---
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.1.0',
    info: { title: 'GeoSurePath Admin API', version: '7.1.0' },
    servers: [{ url: process.env.PUBLIC_URL || `http://localhost:${PORT}` }],
    components: {
      securitySchemes: { ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'x-api-key' } }
    },
    security: [{ ApiKeyAuth: [] }]
  },
  apis: ['./routes/*.js'],
};

let swaggerDocs = {};
if (process.env.NODE_ENV !== 'test') {
  swaggerDocs = swaggerJsDoc(swaggerOptions);
}

// --- MIDDLEWARE ---
app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
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

// --- ROUTES ---
app.use('/api', authLimiter, authRoutes);
app.use('/api', adminRoutes);
app.use('/api', backupRoutes);
app.use('/api', migrationRoutes);
app.use('/api', require('./routes/devices')); // Limit enforcement proxy
app.use('/api/payments', paymentLimiter, require('./routes/payments'));

// Protected metrics
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

// Swagger UI
app.use('/api-docs', (req, res, next) => {
  res.removeHeader('Content-Security-Policy');
  next();
}, swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Public health for Docker
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    services: {
      api: 'UP'
    }
  };

  try {
    await pool.query('SELECT 1');
    health.services.database = 'UP';
  } catch (err) {
    health.services.database = 'DOWN';
    health.status = 'DEGRADED';
  }

  try {
    const redisRes = await redisClient.ping();
    health.services.redis = (redisRes === 'PONG') ? 'UP' : 'DOWN';
    if (redisRes !== 'PONG') health.status = 'DEGRADED';
  } catch (err) {
    health.services.redis = 'DOWN';
    health.status = 'DEGRADED';
  }

  res.status(health.status === 'UP' ? 200 : 503).json(health);
});

// --- GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const requestId = req.id || 'unknown';

  logger.error(`[${requestId}] Error:`, { status, message, stack: err.stack });

  res.status(status).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message,
      requestId,
      timestamp: new Date().toISOString()
    }
  });
});

// --- STARTUP ---
const startServer = async () => {
  // 1. Run migrations first
  try {
    const knex = require('knex')(require('./knexfile'));
    await knex.migrate.latest();
    logger.info('Database migrations completed.');
    await knex.destroy();
  } catch (err) {
    logger.error('FATAL: Database migrations failed:', err);
    logger.error('Cannot proceed with inconsistent database schema. Exiting immediately.');
    process.exit(1);
  }

  // 2. Start core services
  startMonitor();
  const { startAlertEngine } = require('./services/alertEngine');
  startAlertEngine();
  backupService.startCron();

  // 3. Listen
  const server = app.listen(PORT, () => {
    logger.info(`GeoSurePath Admin API v14.1 running on port ${PORT}`);
  });

  // --- GRACEFUL SHUTDOWN ---
  const gracefulShutdown = async (signal) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);
    
    // Stop core services first
    const { stopAlertEngine } = require('./services/alertEngine');
    stopAlertEngine();
    backupService.stopCron();

    server.close(async () => {
      try {
        await Promise.all([
          pool.end(),
          redisClient.quit(),
          ioRedisClient.quit()
        ]);
        logger.info('Connections closed. Process exiting.');
        process.exit(0);
      } catch (err) {
        logger.error('Error during shutdown:', err);
        process.exit(1);
      }
    });

    // Forced exit after 10s if graceful shutdown hangs
    setTimeout(() => {
        logger.error('Could not close connections in time, forceful shutdown');
        process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

startServer();

module.exports = app;
