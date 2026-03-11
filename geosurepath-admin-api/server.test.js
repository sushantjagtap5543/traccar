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
            expect(res.body).toHaveProperty('cpu');
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
        it('should return process and system uptime', async () => {
            const res = await request(app).get('/api/admin/uptime').set('x-api-key', API_KEY);
            expect(res.body.process).toHaveProperty('formatted');
        });
    });

    describe('POST /api/admin/backup', () => {
        it('should trigger backup script', async () => {
            exec.mockImplementation((cmd, cb) => cb(null, 'ok', ''));
            const res = await request(app).post('/api/admin/backup').set('x-api-key', API_KEY);
            expect(res.body.message).toContain('successfully');
        });
    });

    describe('GET /api/admin/traccar/status', () => {
        it('should check traccar version', async () => {
            axios.get.mockResolvedValue({ data: { version: '5' } });
            const res = await request(app).get('/api/admin/traccar/status').set('x-api-key', API_KEY);
            expect(res.body.status).toBe('REACHABLE');
        });
    });

    describe('POST /api/admin/restart/:service', () => {
        it('should restart backend services', async () => {
            exec.mockImplementation((cmd, cb) => cb(null, 'ok', ''));
            const res = await request(app).post('/api/admin/restart/traccar').set('x-api-key', API_KEY);
            expect(res.body.message).toContain('Successfully restarted');
        });
    });
});
