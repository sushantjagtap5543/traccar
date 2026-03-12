const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { pool, logger } = require('../services/db');

/**
 * Razorpay Payment Integration
 * Handles order creation and verification for platform subscriptions.
 */

// Initialize Razorpay
const getRazorpayClient = async () => {
    const res = await pool.query("SELECT key, value FROM geosurepath_settings WHERE key IN ('razorpay_key_id', 'razorpay_secret')");
    const config = {};
    res.rows.forEach(r => config[r.key] = r.value);

    const keyId = config.razorpay_key_id || process.env.RAZORPAY_KEY_ID;
    const secret = config.razorpay_secret || process.env.RAZORPAY_SECRET;

    if (!keyId || !secret) {
        throw new Error('Razorpay credentials not configured');
    }

    return new Razorpay({ key_id: keyId, key_secret: secret });
};

// 1. Create Order
router.post('/orders', async (req, res) => {
    const { planId, userId } = req.body;
    // planId expected: '1month', '6month', '12month'

    try {
        const client = await getRazorpayClient();

        // Fetch base price from DB
        const priceKey = `plan_price_${planId}`;
        const priceRes = await pool.query("SELECT value FROM geosurepath_settings WHERE key = $1", [priceKey]);

        if (priceRes.rowCount === 0) return res.status(400).json({ error: 'Invalid plan selected' });

        const basePrice = parseInt(priceRes.rows[0].value);
        const gst = Math.round(basePrice * 0.18); // 18% GST
        const totalAmount = (basePrice + gst) * 100; // In paise

        const options = {
            amount: totalAmount,
            currency: 'INR',
            receipt: `receipt_${userId}_${Date.now()}`,
            notes: {
                basePrice: basePrice,
                gst: gst,
                planId: planId
            }
        };

        const order = await client.orders.create(options);
        res.json({ ...order, gst, totalAmount: totalAmount / 100 });
    } catch (err) {
        logger.error('Razorpay Order Error:', err.message);
        res.status(500).json({ error: 'Failed to create payment order' });
    }
});

// 2. Verify Payment & Activate Plan
router.post('/verify', async (req, res) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        userId,
        planId // '1month', '6month', '12month'
    } = req.body;

    try {
        const resSettings = await pool.query("SELECT value FROM geosurepath_settings WHERE key = 'razorpay_secret' LIMIT 1");
        const secret = resSettings.rows[0]?.value || process.env.RAZORPAY_SECRET;

        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const expectedSignature = hmac.digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Determine duration and device limit
            let months = 1;
            if (planId === '6month') months = 6;
            if (planId === '12month') months = 12;

            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + months);

            // Fetch device limit from settings or use defaults
            const limitKey = `plan_limit_${planId}`;
            const limitRes = await pool.query("SELECT value FROM geosurepath_settings WHERE key = $1", [limitKey]);
            const deviceLimit = limitRes.rowCount > 0 ? parseInt(limitRes.rows[0].value) : 10;

            await pool.query(
                `INSERT INTO geosurepath_subscriptions 
                (user_id, plan_id, status, razorpay_order_id, razorpay_payment_id, expiry_date, device_limit)
                VALUES ($1, $2, 'active', $3, $4, $5, $6)`,
                [userId, planId, razorpay_order_id, razorpay_payment_id, expiryDate, deviceLimit]
            );

            logger.info(`Subscription activated for User ${userId}: ${planId} (${months} months)`);
            res.json({ success: true, message: `Subscription activated for ${months} month(s)` });
        } else {
            res.status(400).json({ success: false, error: 'Invalid payment signature' });
        }
    } catch (err) {
        logger.error('Payment Verification Error:', err.message);
        res.status(500).json({ error: 'Verification failed' });
    }
});

// 3. Get Subscription Status
router.get('/subscription/:userId', async (req, res) => {
    try {
        const subRes = await pool.query(
            'SELECT *, (expiry_date - NOW()) as time_remaining FROM geosurepath_subscriptions WHERE user_id = $1 AND status = \'active\' ORDER BY created_at DESC LIMIT 1',
            [req.params.userId]
        );

        const deviceRes = await pool.query(
            'SELECT COUNT(*) as count FROM tc_devices WHERE id IN (SELECT deviceid FROM tc_user_device WHERE userid = $1)',
            [req.params.userId]
        );

        const sub = subRes.rows[0] || { plan_id: 'free', device_limit: 2 };

        let daysLeft = 0;
        if (sub.expiry_date) {
            const diff = new Date(sub.expiry_date) - new Date();
            daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        }

        res.json({
            ...sub,
            days_remaining: daysLeft,
            device_count: parseInt(deviceRes.rows[0]?.count || 0)
        });
    } catch (err) {
        logger.error('Fetch Subscription Error:', err.message);
        res.status(500).json({ error: 'Failed to fetch subscription' });
    }
});

// 4. Cancel Subscription
router.post('/cancel', async (req, res) => {
    const { userId } = req.body;
    try {
        await pool.query(
            "UPDATE geosurepath_subscriptions SET status = 'cancelled' WHERE user_id = $1 AND status = 'active'",
            [userId]
        );
        res.json({ success: true, message: 'Subscription cancelled successfully' });
    } catch (err) {
        logger.error('Cancel Subscription Error:', err.message);
        res.status(500).json({ error: 'Failed to cancel subscription' });
    }
});

// 5. Razorpay Webhook (For automated events)
router.post('/webhook', async (req, res) => {
    const resSettings = await pool.query("SELECT value FROM geosurepath_settings WHERE key = 'razorpay_webhook_secret' LIMIT 1");
    const secret = resSettings.rows[0]?.value || process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (secret && signature) {
        const expectedSignature = crypto.createHmac('sha256', secret).update(JSON.stringify(req.body)).digest('hex');
        if (expectedSignature !== signature) return res.status(400).send('Invalid signature');
    }

    const { event, payload } = req.body;
    logger.info(`Razorpay Event: ${event}`);

    if (event === 'payment.captured') {
        // Additional business logic if needed
    }

    res.json({ status: 'ok' });
});

// 6. Simple Invoice Data
router.get('/invoice/:paymentId', async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT s.*, u.name as user_name, u.email as user_email FROM geosurepath_subscriptions s JOIN tc_users u ON s.user_id = u.id WHERE s.razorpay_payment_id = $1",
            [req.params.paymentId]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Invoice not found' });

        const sub = result.rows[0];
        // In a real app, generate PDF here. For now, we return JSON meta-data
        res.json({
            invoiceNumber: `INV-${sub.id}-${Date.now()}`,
            date: sub.created_at,
            customer: { name: sub.user_name, email: sub.user_email },
            plan: sub.plan_id,
            amount: sub.plan_id === '1month' ? 236 : (sub.plan_id === '6month' ? 1121 : 1770), // Including 18% GST
            currency: 'INR',
            status: 'PAID',
            paymentId: sub.razorpay_payment_id
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch invoice' });
    }
});

module.exports = router;
