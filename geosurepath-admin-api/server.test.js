const request = require('supertest');
const si = require('systeminformation');
const { Pool } = require('pg');
const { exec } = require('child_process');

// Mocks
jest.mock('pg');
jest.mock('child_process');
jest.mock('systeminformation');
jest.mock('redis', () => ({
    createClient: jest.fn().mockReturnValue({
        on: jest.fn(),
        connect: jest.fn().mockResolvedValue(null),
        ping: jest.fn().mockResolvedValue('PONG'),
        quit: jest.fn().mockResolvedValue(null),
    }),
}));

const app = require('./server');

describe('GeoSurePath Admin API', () => {
    const API_KEY = 'test_key';

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
            // Mock system info
            si.currentLoad.mockResolvedValue({ currentLoad: 10.5 });
            si.mem.mockResolvedValue({ total: 16000000000, active: 8000000000 });
            si.fsSize.mockResolvedValue([{ fs: '/', size: 1000, used: 500, use: 50, mount: '/' }]);
            si.networkStats.mockResolvedValue([{ rx_sec: 1024, tx_sec: 2048 }]);

            // Mock PG
            const mockPool = new Pool();
            mockPool.query.mockResolvedValue({ rowCount: 1, rows: [{ size: '10 MB' }] });

            const res = await request(app)
                .get('/api/admin/health')
                .set('x-api-key', API_KEY);

            expect(res.statusCode).toBe(200);
            expect(res.body.cpu).toBe('10.50');
            expect(res.body.database.storage).toBe('10 MB');
            expect(res.body.cache.status).toBe('ONLINE');
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
            expect(exec).toHaveBeenCalled();
        });

        it('should return 500 if exec fails', async () => {
            exec.mockImplementation((cmd, callback) => callback(new Error('failed'), '', 'error output'));

            const res = await request(app)
                .post('/api/admin/restart/traccar')
                .set('x-api-key', API_KEY);

            expect(res.statusCode).toBe(500);
            expect(res.body.error).toBe('Failed to restart traccar');
        });
    });
});
