const request = require('supertest');
const si = require('systeminformation');
const { Pool } = require('pg');
const { exec } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Mocks
jest.mock('pg');
jest.mock('child_process');
jest.mock('systeminformation');
jest.mock('axios');
jest.mock('fs');
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
    }));
});

const app = require('./server');

describe('GeoSurePath Admin API', () => {
    const API_KEY = 'test_key_32chars_minimum_here_must_be_long';

    beforeAll(() => {
        process.env.ADMIN_API_KEY = API_KEY;
        process.env.NODE_ENV = 'test';
    });

    describe('GET /api/admin/health', () => {
        it('should return 403 without API key', async () => {
            const res = await request(app).get('/api/admin/health');
            expect(res.statusCode).toBe(403);
        });

        it('should return 200 with valid API key and mocked data', async () => {
            si.currentLoad.mockResolvedValue({ currentLoad: 10.5 });
            si.mem.mockResolvedValue({ total: 16000000000, active: 8000000000 });
            si.fsSize.mockResolvedValue([{ fs: '/', size: 1000, used: 500, use: 50, mount: '/' }]);
            si.networkStats.mockResolvedValue([{ rx_sec: 1024, tx_sec: 2048 }]);
            si.time.mockReturnValue({ uptime: 3600 });

            const mockPool = new Pool();
            mockPool.query.mockResolvedValue({ rowCount: 1, rows: [{ size: '10 MB' }] });

            const res = await request(app)
                .get('/api/admin/health')
                .set('x-api-key', API_KEY);

            expect(res.statusCode).toBe(200);
            expect(res.body.cpu).toBe('10.50');
            expect(res.body.database.storage).toBe('10 MB');
        });
    });

    describe('GET /api/admin/logs', () => {
        it('should return 200 and reversed logs', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('log1\nlog2\nlog3');

            const res = await request(app)
                .get('/api/admin/logs')
                .set('x-api-key', API_KEY);

            expect(res.statusCode).toBe(200);
            expect(res.body.logs).toEqual(['log3', 'log2', 'log1']);
        });
    });

    describe('GET /api/admin/traccar/status', () => {
        it('should return REACHABLE if traccar responds', async () => {
            axios.get.mockResolvedValue({ data: { version: '5.6' } });

            const res = await request(app)
                .get('/api/admin/traccar/status')
                .set('x-api-key', API_KEY);

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('REACHABLE');
            expect(res.body.version).toBe('5.6');
        });
    });

    describe('POST /api/admin/alerts/config', () => {
        it('should return 400 for invalid URL', async () => {
            const res = await request(app)
                .post('/api/admin/alerts/config')
                .set('x-api-key', API_KEY)
                .send({ webhookUrl: 'invalid' });

            expect(res.statusCode).toBe(400);
        });

        it('should return 200 for valid URL', async () => {
            const res = await request(app)
                .post('/api/admin/alerts/config')
                .set('x-api-key', API_KEY)
                .send({ webhookUrl: 'http://hooks.slack.com/123' });

            expect(res.statusCode).toBe(200);
        });
    });

    describe('POST /api/admin/restart/:service', () => {
        it('should return 400 for invalid service', async () => {
            const res = await request(app)
                .post('/api/admin/restart/invalid')
                .set('x-api-key', API_KEY);
            expect(res.statusCode).toBe(400);
        });

        it('should return 200 for valid service with mocked exec', async () => {
            exec.mockImplementation((cmd, callback) => callback(null, 'restarted', ''));

            const res = await request(app)
                .post('/api/admin/restart/traccar')
                .set('x-api-key', API_KEY);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toContain('Successfully restarted traccar');
        });
    });
});
