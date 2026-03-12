const request = require('supertest');
const si = require('systeminformation');
const { Pool } = require('pg');
const { exec } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const jwt = require('jsonwebtoken');

// Mocks
jest.mock('pg', () => {
    const mPool = {
        query: jest.fn().mockResolvedValue({ rowCount: 1, rows: [] }),
        end: jest.fn().mockResolvedValue(null),
        on: jest.fn(),
    };
    return { Pool: jest.fn(() => mPool) };
});
jest.mock('child_process');
jest.mock('systeminformation');
jest.mock('axios');
jest.mock('fs');
jest.mock('morgan', () => () => (req, res, next) => next());
jest.mock('prom-client', () => ({
    Registry: jest.fn().mockImplementation(() => ({
        registerMetric: jest.fn(),
        metrics: jest.fn().mockResolvedValue('metrics'),
        contentType: 'text/plain'
    })),
    collectDefaultMetrics: jest.fn(),
    Gauge: jest.fn().mockImplementation(() => ({
        set: jest.fn()
    }))
}));

jest.mock('redis', () => ({
    createClient: jest.fn().mockReturnValue({
        on: jest.fn(),
        connect: jest.fn().mockResolvedValue(null),
        ping: jest.fn().mockResolvedValue('PONG'),
        info: jest.fn().mockResolvedValue('redis_version:7.0.0'),
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1),
        quit: jest.fn().mockResolvedValue(null),
    }),
}));

jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => ({
        call: jest.fn().mockResolvedValue('OK'),
        quit: jest.fn().mockResolvedValue(null),
    }));
});

// Setup default SI mocks
si.currentLoad.mockResolvedValue({ currentLoad: 10 });
si.mem.mockResolvedValue({ total: 16000000000, active: 8000000000 });
si.fsSize.mockResolvedValue([{ size: 1000000000, used: 500000000, use: 50, mount: '/' }]);
si.networkStats.mockResolvedValue([{ rx_sec: 1000, tx_sec: 2000 }]);
si.time.mockReturnValue({ uptime: 3600 });

// Mock environment
const API_KEY = 'test_key_32chars_minimum_here_must_be_long_entropy';
process.env.ADMIN_API_KEY = API_KEY;
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';

const app = require('./server');

describe('GeoSurePath Admin API', () => {
    describe('ADMIN AUTH (JWT)', () => {
        it('should return a token for valid credentials', async () => {
            const password = 'test_password';
            const hash = require('bcryptjs').hashSync(password, 10);
            process.env.ADMIN_PASSWORD_HASH = hash;

            const res = await request(app)
                .post('/api/admin/auth/login')
                .send({ email: 'admin@geosurepath.com', password });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('token');
        });

        it('should allow access via JWT token', async () => {
            const token = jwt.sign({ role: 'admin' }, 'test_secret');
            const res = await request(app)
                .get('/api/admin/health')
                .set('x-admin-token', token);

            expect(res.statusCode).toBe(200);
        });
    });

    describe('POST /api/admin/backup', () => {
        it('should complete backup successfully', async () => {
            exec.mockImplementation((cmd, cb) => cb(null, '', ''));
            process.env.DATABASE_URL = 'postgres://test:test@localhost/test';
            const res = await request(app)
                .post('/api/admin/backup')
                .set('x-api-key', API_KEY);
            expect(res.statusCode).toBe(200);
            expect(res.body.filename).toMatch(/backup-.*\.sql/);
        });
    });

    describe('GET /api/admin/db/tables', () => {
        it('should return table statistics', async () => {
            const mockPool = new Pool();
            mockPool.query.mockResolvedValue({ rows: [{ table_name: 'devices', row_count: 42 }] });
            const res = await request(app)
                .get('/api/admin/db/tables')
                .set('x-api-key', API_KEY);
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.tables)).toBe(true);
        });
    });

    describe('POST /api/auth/send-otp', () => {
        it('should accept valid mobile number', async () => {
            const res = await request(app)
                .post('/api/auth/send-otp')
                .send({ mobile: '9999999999' });
            expect(res.statusCode).toBe(200);
            expect(res.body.message).toContain('sent');
        });
    });

    describe('POST /api/auth/verify-otp', () => {
        it('should reject invalid or expired code', async () => {
            const res = await request(app)
                .post('/api/auth/verify-otp')
                .send({ mobile: '9999999999', code: '000000' });
            expect(res.statusCode).toBe(400);
        });
    });

    describe('GET /api/admin/health', () => {
        it('should return 403 without any auth', async () => {
            const res = await request(app).get('/api/admin/health');
            expect(res.statusCode).toBe(403);
        });

        it('should return 200 with valid API key', async () => {
            const mockPool = new Pool();
            mockPool.query.mockResolvedValue({ rowCount: 1, rows: [{ size: '10 MB' }] });

            const res = await request(app)
                .get('/api/admin/health')
                .set('x-api-key', API_KEY);

            expect(res.statusCode).toBe(200);
            expect(res.body.cpu).toBe('10.00');
        });
    });

    describe('GET /api/admin/uptime', () => {
        it('should return formatted uptime', async () => {
            const res = await request(app).get('/api/admin/uptime').set('x-api-key', API_KEY);
            expect(res.statusCode).toBe(200);
            expect(res.body.process.formatted).toMatch(/\d+h \d+m \d+s/);
        });
    });

    describe('POST /api/admin/alerts/config', () => {
        it('should return updated url in response', async () => {
            const webhook = 'https://example.com';
            const res = await request(app)
                .post('/api/admin/alerts/config')
                .set('x-api-key', API_KEY)
                .send({ webhookUrl: webhook });

            expect(res.statusCode).toBe(200);
            expect(res.body.url).toBe(webhook);
        });
    });

    describe('GET /api/admin/redis/info', () => {
        it('should return redis info string', async () => {
            const res = await request(app).get('/api/admin/redis/info').set('x-api-key', API_KEY);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('info');
        });
    });

    describe('GET /api/admin/logs', () => {
        it('should return logs array', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('log line 1\nlog line 2');
            const res = await request(app).get('/api/admin/logs').set('x-api-key', API_KEY);
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.logs)).toBe(true);
        });
    });

    describe('GET /api/admin/traccar/status', () => {
        it('should return traccar status', async () => {
            axios.get.mockResolvedValue({ data: { version: '5.12' } });
            const res = await request(app).get('/api/admin/traccar/status').set('x-api-key', API_KEY);
            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('REACHABLE');
        });
    });

    describe('POST /api/admin/restart/:service', () => {
        it('should restart service successfully', async () => {
            exec.mockImplementation((cmd, cb) => cb(null, 'ok', ''));
            const res = await request(app)
                .post('/api/admin/restart/traccar')
                .set('x-api-key', API_KEY);
            expect(res.statusCode).toBe(200);
            expect(res.body.message).toContain('Successfully');
        });

        it('should fail for invalid service', async () => {
            const res = await request(app)
                .post('/api/admin/restart/invalid_service')
                .set('x-api-key', API_KEY);
            expect(res.statusCode).toBe(400);
        });
    });

    describe('COOKIE AUTH', () => {
        it('should allow access via cookie', async () => {
            const token = jwt.sign({ role: 'admin' }, 'test_secret');
            const res = await request(app)
                .get('/api/admin/health')
                .set('Cookie', [`adminToken=${token}`]);
            expect(res.statusCode).toBe(200);
        });
    });

    describe('METRICS PROTECTION', () => {
        it('should block metrics without auth', async () => {
            const res = await request(app).get('/metrics');
            expect(res.statusCode).toBe(403);
        });

        it('should allow metrics with API key in Authorization header', async () => {
            const res = await request(app)
                .get('/metrics')
                .set('Authorization', `ApiKey ${API_KEY}`);
            expect(res.statusCode).toBe(200);
        });
    });
});
