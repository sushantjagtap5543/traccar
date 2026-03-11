const request = require('supertest');
const si = require('systeminformation');
const { Pool } = require('pg');
const { exec } = require('child_process');
const axios = require('axios');
const fs = require('fs');

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

const app = require('./server');

describe('GeoSurePath Admin API', () => {
    describe('GET /api/admin/health', () => {
        it('should return 403 without API key', async () => {
            const res = await request(app).get('/api/admin/health');
            expect(res.statusCode).toBe(403);
        });

        it('should return 200 with valid data', async () => {
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
            expect(res.body.database.storage).toBe('10 MB');
        });
    });

    describe('GET /api/admin/logs', () => {
        it('should return logs reversed', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('1\n2\n3');
            const res = await request(app).get('/api/admin/logs').set('x-api-key', API_KEY);
            expect(res.body.logs).toEqual(['3', '2', '1']);
        });
    });

    describe('GET /api/admin/uptime', () => {
        it('should return process and system uptime with correct formatting', async () => {
            const res = await request(app).get('/api/admin/uptime').set('x-api-key', API_KEY);
            expect(res.statusCode).toBe(200);
            expect(res.body.process).toHaveProperty('uptime');
            expect(typeof res.body.process.uptime).toBe('number');
            expect(res.body.process.formatted).toMatch(/\d+h \d+m \d+s/);
            expect(res.body.system).toHaveProperty('uptime');
            expect(typeof res.body.system.uptime).toBe('number');
        });
    });

    describe('POST /api/admin/backup', () => {
        it('should trigger backup script and return filename', async () => {
            exec.mockImplementation((cmd, cb) => cb(null, 'ok', ''));
            const res = await request(app).post('/api/admin/backup').set('x-api-key', API_KEY);
            expect(res.statusCode).toBe(200);
            expect(res.body.message).toContain('successfully');
            expect(res.body.filename).toMatch(/backup-.*\.sql/);
        });
    });

    describe('POST /api/admin/alerts/config', () => {
        it('should update webhook URL with valid input', async () => {
            const validUrl = 'https://hooks.slack.com/services/123';
            const res = await request(app)
                .post('/api/admin/alerts/config')
                .set('x-api-key', API_KEY)
                .send({ webhookUrl: validUrl });

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toContain('updated');
            expect(res.body.url).toBe(validUrl);
        });

        it('should return 400 for invalid URL', async () => {
            const res = await request(app)
                .post('/api/admin/alerts/config')
                .set('x-api-key', API_KEY)
                .send({ webhookUrl: 'not-a-url' });

            expect(res.statusCode).toBe(400);
        });
    });

    describe('GET /api/admin/traccar/status', () => {
        it('should check traccar version', async () => {
            axios.get.mockResolvedValue({ data: { version: '5.12' } });
            const res = await request(app).get('/api/admin/traccar/status').set('x-api-key', API_KEY);
            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('REACHABLE');
            expect(res.body.version).toBe('5.12');
        });
    });

    describe('POST /api/admin/restart/:service', () => {
        it('should restart backend services', async () => {
            exec.mockImplementation((cmd, cb) => cb(null, 'ok', ''));
            const res = await request(app).post('/api/admin/restart/traccar').set('x-api-key', API_KEY);
            expect(res.statusCode).toBe(200);
            expect(res.body.message).toContain('Successfully restarted traccar');
        });
    });
});
