const request = require('supertest');
const si = require('systeminformation');
const { Pool } = require('pg');
const { exec } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const jwt = require('jsonwebtoken');

// Mocks
jest.mock('pg');
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
        quit: jest.fn().mockResolvedValue(null),
    }),
}));
jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => ({
        call: jest.fn().mockResolvedValue('OK'),
        quit: jest.fn().mockResolvedValue(null),
    }));
});

// Mock environment
const API_KEY = 'test_key_32chars_minimum_here_must_be_long_entropy';
process.env.ADMIN_API_KEY = API_KEY;
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';

const app = require('./server');

describe('GeoSurePath Admin API', () => {
    describe('ADMIN AUTH (JWT)', () => {
        it('should return a token for valid credentials in test mode', async () => {
            const res = await request(app)
                .post('/api/admin/auth/login')
                .send({ email: 'admin@geosurepath.com', password: 'admin123' });

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

    describe('GET /api/admin/health', () => {
        it('should return 403 without any auth', async () => {
            const res = await request(app).get('/api/admin/health');
            expect(res.statusCode).toBe(403);
        });

        it('should return 200 with valid API key', async () => {
            si.currentLoad.mockResolvedValue({ currentLoad: 10 });
            si.mem.mockResolvedValue({ total: 16, active: 8 });
            si.fsSize.mockResolvedValue([{ size: 100, used: 50, use: 50, mount: '/' }]);
            si.networkStats.mockResolvedValue([{ rx_sec: 100, tx_sec: 200 }]);
            si.time.mockReturnValue({ uptime: 3600 });

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
});
