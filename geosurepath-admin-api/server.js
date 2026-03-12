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
const { RedisStore } = require('rate-limit-redis');

// --- LOAD MODULAR COMPONENTS ---
const { pool, redisClient, ioRedisClient, logger } = require('./services/db');
const { startMonitor } = require('./services/monitor');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const { adminAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 8083;

// --- RATE LIMITING ---
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
app.use(express.json());
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
app.use('/api', authRoutes);
app.use('/api', adminRoutes);
app.use('/api/payments', require('./routes/payments'));

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
app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date().toISOString() });
});

// --- GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// --- STARTUP ---
const server = app.listen(PORT, async () => {
  logger.info(`GeoSurePath Admin API v7.2 modular running on port ${PORT}`);

  // Run migrations
  try {
    const knex = require('knex')(require('./knexfile'));
    await knex.migrate.latest();
    logger.info('Database migrations completed.');
    await knex.destroy();
  } catch (err) {
    logger.error('Migration failure:', err);
  }

  startMonitor();
  const { startAlertEngine } = require('./services/alertEngine');
  startAlertEngine();
});

// --- GRACEFUL SHUTDOWN ---
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  server.close(async () => {
    try {
      await Promise.all([pool.end(), redisClient.quit(), ioRedisClient.quit()]);
      logger.info('Connections closed.');
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
