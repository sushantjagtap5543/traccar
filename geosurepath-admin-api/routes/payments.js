const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { pool, logger } = require('../services/db');

/**
 * Razorpay Payment Integration
 * Handles order creation and verification for platform subscriptions.
 */

// Initialize Razorpay (API keys from geosurepath_settings or env)
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

    try {
        const client = await getRazorpayClient();

        // Fetch price from DB
        const priceRes = await pool.query("SELECT value FROM geosurepath_settings WHERE key = $1", [`plan_price_${planId}`]);
        if (priceRes.rowCount === 0) return res.status(400).json({ error: 'Invalid plan selected' });

        const amount = parseInt(priceRes.rows[0].value) * 100; // In paise

        const options = {
            amount: amount,
            currency: 'INR',
            receipt: `receipt_${userId}_${Date.now()}`,
        };

        const order = await client.orders.create(options);
        res.json(order);
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
        planId
    } = req.body;

    try {
        const resSettings = await pool.query("SELECT value FROM geosurepath_settings WHERE key = 'razorpay_secret' LIMIT 1");
        const secret = resSettings.rows[0]?.value || process.env.RAZORPAY_SECRET;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Signature valid - Update Subscription
            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 1); // 1 month plan

            const deviceLimit = planId === 'enterprise' ? 100 : (planId === 'standard' ? 20 : 5);

            await pool.query(
                `INSERT INTO geosurepath_subscriptions 
                (user_id, plan_id, status, razorpay_order_id, razorpay_payment_id, expiry_date, device_limit)
                VALUES ($1, $2, 'active', $3, $4, $5, $6)`,
                [userId, planId, razorpay_order_id, razorpay_payment_id, expiryDate, deviceLimit]
            );

            logger.info(`Subscription activated for User ${userId}: ${planId}`);
            res.json({ success: true, message: 'Subscription activated' });
        } else {
            res.status(400).json({ success: false, error: 'Invalid payment signature' });
        }
        // 3. Get Subscription Status
        router.get('/subscription/:userId', async (req, res) => {
            try {
                const subRes = await pool.query(
                    'SELECT * FROM geosurepath_subscriptions WHERE user_id = $1 AND status = \'active\' ORDER BY created_at DESC LIMIT 1',
                    [req.params.userId]
                );

                // Also count current devices in Traccar
                const deviceRes = await pool.query('SELECT COUNT(*) as count FROM tc_devices WHERE id IN (SELECT deviceid FROM tc_user_device WHERE userid = $1)', [req.params.userId]);

                const sub = subRes.rows[0] || { plan_id: 'free', device_limit: 2 };
                res.json({
                    ...sub,
                    device_count: parseInt(deviceRes.rows[0]?.count || 0)
                });
            } catch (err) {
                logger.error('Fetch Subscription Error:', err.message);
                res.status(500).json({ error: 'Failed to fetch subscription' });
            }
        });

        module.exports = router;
