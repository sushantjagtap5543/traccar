const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { pool, logger } = require('../services/db');
const { authenticateJWT } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const rzp = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_SECRET || 'secret_placeholder'
});

router.post('/orders', authenticateJWT, asyncHandler(async (req, res) => {
    const { planId } = req.body;
    
    let amount = 0;
    if (planId === '1month') amount = 200 * 100 * 1.18; // 200 + 18% GST
    else if (planId === '6month') amount = 950 * 100 * 1.18;
    else if (planId === '12month') amount = 1500 * 100 * 1.18;
    else if (planId === 'enterprise') amount = 4500 * 100 * 1.18;

    const options = {
        amount: Math.round(amount),
        currency: "INR",
        receipt: `receipt_${Date.now()}`
    };

    const order = await rzp.orders.create(options);
    res.json(order);
}));

router.post('/verify', authenticateJWT, asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET || 'secret_placeholder')
        .update(sign.toString())
        .digest("hex");

    if (razorpay_signature === expectedSign) {
        // Success: Update subscription
        const userId = req.user.id;
        const months = planId === '1month' ? 1 : (planId === '6month' ? 6 : 12);
        const deviceLimit = planId === 'enterprise' ? 100 : 50;

        await pool.query(
            "INSERT INTO geosurepath_subscriptions (user_id, plan_id, status, expiry_date, device_limit, razorpay_payment_id) VALUES ($1, $2, 'active', NOW() + INTERVAL '$3 month', $4, $5)",
            [userId, planId, months, deviceLimit, razorpay_payment_id]
        );

        res.json({ success: true });
    } else {
        res.status(400).json({ error: 'Invalid signature' });
    }
}));

router.get('/subscription/:userId', authenticateJWT, asyncHandler(async (req, res) => {
    const result = await pool.query(
        "SELECT *, (expiry_date - NOW()) as time_left FROM geosurepath_subscriptions WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1",
        [req.params.userId]
    );
    res.json(result.rows[0] || { status: 'none' });
}));

module.exports = router;
