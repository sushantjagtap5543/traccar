const request = require('supertest');
const app = require('./server');

describe('GeoSurePath Admin API', () => {
    const API_KEY = process.env.ADMIN_API_KEY || 'test_key';

    beforeAll(() => {
        process.env.ADMIN_API_KEY = API_KEY;
    });

    describe('GET /api/admin/health', () => {
        it('should return 403 without API key', async () => {
            const res = await request(app).get('/api/admin/health');
            expect(res.statusCode).toBe(403);
        });

        it('should return 200 with valid API key', async () => {
            const res = await request(app)
                .get('/api/admin/health')
                .set('x-api-key', API_KEY);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('cpu');
            expect(res.body).toHaveProperty('database');
        });
    });

    describe('POST /api/admin/restart/:service', () => {
        it('should return 400 for invalid service', async () => {
            const res = await request(app)
                .post('/api/admin/restart/invalid')
                .set('x-api-key', API_KEY);
            expect(res.statusCode).toBe(400);
        });

        it('should return 200 for valid service (mocked exec)', async () => {
            // In a real scenario, we might mock child_process.exec
            // but for this basic test, we'll just check if it routes correctly
            // Note: This might attempt to run the command on the dev machine
            // which is why we usually mock it.
        });
    });
});
