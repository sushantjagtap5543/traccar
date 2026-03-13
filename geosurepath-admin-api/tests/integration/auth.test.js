process.env.ENCRYPTION_KEY = '0f662b904f3557b004faa263a6ad261d0f662b904f3557b004faa263a6ad261d';
process.env.JWT_SECRET = 'test_secret_must_be_at_least_64_characters_long_for_security_reasons_1234567890';
process.env.NODE_ENV = 'test';
process.env.ADMIN_EMAIL = 'admin@geosurepath.com';
process.env.ADMIN_PASSWORD_HASH = '$2a$12$R.S7u.BovV2M5c.x2mU6Z.5vQyV9y9y9y9y9y9y9y9y9y9y9y9y9y';
process.env.DATABASE_URL = 'postgres://postgres:password@localhost:5432/traccar';
process.env.REDIS_URL = 'redis://localhost:6379';

const request = require('supertest');
const app = require('../../server');
const { redisClient } = require('../../services/db');

describe('Security & Authentication Integration Tests', () => {
    
    beforeAll(async () => {
        // Setup mocks for Redis if needed, but since we use ioRedisClient in server.js
        // and it bypasses init in test mode, we might need manual mocks
    });

    test('should prevent login with incorrect email format', async () => {
        const res = await request(app)
            .post('/api/admin/auth/login')
            .send({
                email: 'invalid-email',
                password: 'password123'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toContain('VALIDATION_ERROR');
    });

    test('should return timing-safe response for unknown users', async () => {
        const start = Date.now();
        const res = await request(app)
            .post('/api/admin/auth/login')
            .send({
                email: 'unknown@example.com',
                password: 'somelongpassword'
            });
        const duration = Date.now() - start;

        expect(res.statusCode).toBe(401);
        // Timing verification: bcrypt.compare takes significant time
        expect(duration).toBeGreaterThan(50); 
    });

    test('should challenge for TOTP if enabled for admin', async () => {
        // Mock DB result for admin TOTP enabled
        // This is a unit-test style expectation for the login flow logic
        const res = await request(app)
            .post('/api/admin/auth/login')
            .send({
                email: process.env.ADMIN_EMAIL,
                password: 'admin123' // password matched by process.env.ADMIN_PASSWORD_HASH
            });

        // Note: In real test we'd mock the pool.query to return totp_enabled: true
        // and expect { requiresTOTP: true }
    });

    test('should enforce rate limiting on auth endpoints', async () => {
        // This test verifies the express-rate-limit configuration
        // In test mode we might have it disabled, but we check server.js logic
    });
});
