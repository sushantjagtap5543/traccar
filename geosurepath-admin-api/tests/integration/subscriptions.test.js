process.env.ENCRYPTION_KEY = '0f662b904f3557b004faa263a6ad261d0f662b904f3557b004faa263a6ad261d';
process.env.JWT_SECRET = 'test_secret_must_be_at_least_64_characters_long_for_security_reasons_1234567890';
process.env.NODE_ENV = 'test';
process.env.ADMIN_EMAIL = 'admin@geosurepath.com';
process.env.ADMIN_PASSWORD_HASH = '$2a$10$abcdefghijklmnopqrstuvwxyz01234567890abcdefghijkl';
process.env.DATABASE_URL = 'postgres://postgres:password@localhost:5432/traccar';
process.env.REDIS_URL = 'redis://localhost:6379';
const request = require('supertest');
const app = require('../../server');
const { pool } = require('../../services/db');

describe('Subscription Lifecycle Integration Tests', () => {
    let authToken;
    const testEmail = 'test_integration@geosurepath.com';

    beforeAll(async () => {
        // Mock a user check for login - in real world this hits DB
        // For testing we ensure the user exists if needed
    });

    afterAll(async () => {
        // Clean up test data
        await pool.query('DELETE FROM geosurepath_subscriptions WHERE user_id IN (SELECT id FROM tc_users WHERE email = $1)', [testEmail]);
    });

    test('should return 400 for invalid plan on order creation', async () => {
        const res = await request(app)
            .post('/api/payments/orders')
            .send({
                planId: 'nonexistent_plan',
                userId: 999
            });

        expect(res.statusCode).toBe(400);
    });

    test('should verify webhook signature correctly with middleware', async () => {
        const crypto = require('crypto');
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_secret';
        
        const payload = {
            event: 'payment.captured',
            payload: {
                payment: {
                    entity: {
                        id: 'pay_test_123',
                        order_id: 'order_test_123',
                        amount: 100000,
                        notes: { userId: 1 }
                    }
                }
            }
        };

        const bodyString = JSON.stringify(payload);
        const signature = crypto
            .createHmac('sha256', webhookSecret)
            .update(bodyString)
            .digest('hex');

        const res = await request(app)
            .post('/api/payments/webhook')
            .set('x-razorpay-signature', signature)
            .send(payload);

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('received');
    });

    test('should reject invalid webhook signature', async () => {
        const res = await request(app)
            .post('/api/payments/webhook')
            .set('x-razorpay-signature', 'invalid_sig')
            .send({ test: 'data' });

        expect(res.statusCode).toBe(401);
    });
});
