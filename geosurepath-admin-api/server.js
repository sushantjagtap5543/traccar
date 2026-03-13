// Sentry initialized after express app creation (NEW-010)

const Sentry = require('@sentry/node');
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
const { startMaintenanceTasks } = require('./services/maintenance');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const alertsRouter = require('./routes/alerts');
const backupRoutes = require('./routes/backup');
const migrationRoutes = require('./routes/migration');
const reportRoutes = require('./routes/reports');
const { adminAuth } = require('./middleware/auth');
const backupService = require('./services/backupService');

const app = express();

// Initialize Sentry (NEW-010)
if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        integrations: [
            new Sentry.Integrations.Http({ tracing: true }),
            new Sentry.Integrations.Express({ app }),
        ],
        tracesSampleRate: 1.0,
    });
}
const PORT = process.env.PORT || 8083;

// --- ENV VALIDATION ---
const requiredEnvVars = [
    'DATABASE_URL',
    'REDIS_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'ADMIN_EMAIL',
    'ADMIN_PASSWORD_HASH',
    'ENCRYPTION_KEY',
    'ADMIN_API_KEY',
    'NODE_ENV'
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        logger.error(`FATAL: Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
}

// 1. Validate NODE_ENV
const VALID_NODE_ENVS = ['production', 'development', 'test'];
if (!VALID_NODE_ENVS.includes(process.env.NODE_ENV)) {
    logger.error(`FATAL: NODE_ENV must be one of: ${VALID_NODE_ENVS.join(', ')}`);
    process.exit(1);
}

// 2. Validate ENCRYPTION_KEY length (must be 64 characters/32 bytes for AES-256)
if (process.env.ENCRYPTION_KEY.length !== 64) {
    logger.error('FATAL: ENCRYPTION_KEY must be exactly 64 hexadecimal characters (32 bytes)');
    process.exit(1);
}

// 3. Validate JWT_SECRET length
if (process.env.JWT_SECRET.length < 64) {
    logger.error('FATAL: JWT_SECRET must be at least 64 characters for security');
    process.exit(1);
}

// 3. Validate ALLOWED_ORIGINS in production
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(o => o.length > 0);
if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
    logger.error('FATAL: ALLOWED_ORIGINS must be set in production');
    process.exit(1);
}
if (allowedOrigins.length === 0 && process.env.NODE_ENV !== 'production') {
    allowedOrigins.push('http://localhost:3000', 'http://localhost:5173');
}

// 4. Validate External Service Credentials (Warning only, don't crash unless strictly required)
if (process.env.NODE_ENV === 'production') {
    const externalVars = ['RAZORPAY_KEY_ID', 'RAZORPAY_SECRET', 'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'];
    externalVars.forEach(v => {
        if (!process.env[v]) {
            logger.warn(`Production: Missing optional external service variable: ${v}`);
        }
    });
}

logger.info('All required environment variables are configured and validated.');

// --- RATE LIMITING ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // decreased from 100 for better security
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
  skipSuccessfulRequests: true,
  message: { error: 'Too many login attempts, please try again after 15 minutes' }
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
    logger.debug(`Request ${req.id} finished in ${duration}ms`);
  });
  next();
});

// Access Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms', {
    stream: { write: (message) => logger.info(message.trim()) }
  }));
}

// Maintenance Mode Middleware (BUG-009 Resilience)
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
        logger.error('Maintenance check failed (Redis), falling back to DB:', err.message);
        try {
            const dbRes = await pool.query("SELECT value FROM geosurepath_settings WHERE key = 'maintenance_mode' LIMIT 1");
            if (dbRes.rowCount > 0 && dbRes.rows[0].value === 'true') {
                return res.status(503).json({ error: 'System is under maintenance. Please try again later.' });
            }
        } catch (dbErr) {
            logger.error('Maintenance check failed (Postgres):', dbErr.message);
            // Fail-open: proceed if both fail
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
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'checkout.razorpay.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', '*.openstreetmap.org', '*.tile.opentopomap.org', 'checkout.razorpay.com'],
      connectSrc: ["'self'", 'api.razorpay.com', 'lumberjack.razorpay.com'],
      fontSrc: ["'self'", 'fonts.gstatic.com'],
      frameSrc: ["'self'", 'checkout.razorpay.com'],
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cookieParser());
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    if (req.originalUrl.includes('/webhook')) {
      req.rawBody = buf;
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, backend services)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      logger.warn(`Blocked CORS request from origin: ${origin}`);
      callback(new Error('Cross-Origin Request Blocked by GeoSurePath Policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-api-key', 'X-Refresh-Token']
}));

// Security headers extra layer
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// --- ROUTES ---
app.use('/api', authRoutes); // Auth limiter moved inside authRoutes for granularity (BUG-011)
app.use('/api', adminRoutes);
app.use('/api', backupRoutes);
app.use('/api', migrationRoutes);
app.use('/api', reportRoutes);
app.use('/api', require('./routes/devices')); // Limit enforcement proxy
app.use('/api/payments', paymentLimiter, require('./routes/payments'));
app.use('/api/alerts', alertsRouter);

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
    logger.error('Metrics collection failure:', err.message);
    res.status(500).json({ error: 'Failed to collect metrics' });
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
const { errorHandler } = require('./middleware/errorHandler');
app.use(errorHandler);

// --- STARTUP ---
const startServer = async () => {
  // 1. Run migrations first
  try {
    const knexConfig = require('./knexfile');
    const knex = require('knex')(knexConfig[process.env.NODE_ENV || 'development']);
    await knex.migrate.latest();
    logger.info('Database migrations completed.');
    await knex.destroy();
  } catch (err) {
    logger.error('FATAL: Database migrations failed:', err);
    logger.error('Cannot proceed with inconsistent database schema. Exiting immediately.');
    process.exit(1);
  }
  // --- INITIALIZE EXTERNAL SERVICES ---
  const { init } = require('./services/db');
  await init();

  // --- START BACKGROUND TASKS ---
  if (process.env.NODE_ENV !== 'test') {
    const { startAlertEngine } = require('./services/alertEngine');
    startAlertEngine();
    startMonitor();
    startMaintenanceTasks();
    backupService.startCron();
  }

  // 3. Listen
  // 3. Listen with WebSocket support
  const { createServer } = require('http');
  const httpServer = createServer(app);
  const { initWebSocket } = require('./services/websocket');
  initWebSocket(httpServer);

  httpServer.listen(PORT, () => {
    logger.info(`GeoSurePath Admin API v14.1 running on port ${PORT}`);
  });

  // --- GRACEFUL SHUTDOWN ---
  const gracefulShutdown = async (signal) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);
    
    // Stop core services first
    const { stopAlertEngine } = require('./services/alertEngine');
    stopAlertEngine();
    backupService.stopCron();

    // Set a timeout for the entire shutdown process
    const shutdownTimeout = setTimeout(() => {
        logger.error('Could not close connections in time, forceful shutdown');
        process.exit(1);
    }, 15000);

    httpServer.close(async () => {
      try {
        logger.info('HTTP server closed. Closing database and cache connections...');
        
        // Use Promise.allSettled to ensure we try to close everything even if one fails
        await Promise.allSettled([
          pool.end(),
          redisClient.quit().catch(() => redisClient.disconnect()),
          ioRedisClient.quit().catch(() => ioRedisClient.disconnect())
        ]);

        clearTimeout(shutdownTimeout);
        logger.info('Connections closed. Process exiting.');
        process.exit(0);
      } catch (err) {
        logger.error('Error during shutdown:', err);
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
