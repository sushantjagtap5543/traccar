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

// 6. Styled Invoice Generator
router.get('/invoice/:paymentId', async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT s.*, u.name as user_name, u.email as user_email FROM geosurepath_subscriptions s JOIN tc_users u ON s.user_id = u.id WHERE s.razorpay_payment_id = $1",
            [req.params.paymentId]
        );
        if (result.rowCount === 0) return res.send('<h1>Invoice Not Found</h1>');

        const sub = result.rows[0];
        const baseAmount = sub.plan_id === '1month' ? 200 : (sub.plan_id === '6month' ? 950 : 1500);
        const gst = Math.round(baseAmount * 0.18);
        const total = baseAmount + gst;

        res.send(`
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; margin: 0; padding: 40px; }
                    .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, .15); font-size: 16px; line-height: 24px; color: #555; }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0B7A75; padding-bottom: 20px; margin-bottom: 20px; }
                    .logo { color: #0B7A75; font-size: 28px; font-weight: bold; }
                    .company-info { text-align: right; font-size: 12px; line-height: 18px; }
                    .bill-to { margin-bottom: 40px; }
                    table { width: 100%; line-height: inherit; text-align: left; border-collapse: collapse; }
                    table th { background: #f8f9fa; padding: 12px; border-bottom: 1px solid #eee; }
                    table td { padding: 12px; border-bottom: 1px solid #eee; }
                    .totals { text-align: right; margin-top: 30px; }
                    .totals div { margin-bottom: 10px; }
                    .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #aaa; border-top: 1px solid #eee; padding-top: 20px; }
                    .status-stamp { display: inline-block; padding: 5px 15px; border: 3px solid #4CAF50; color: #4CAF50; font-weight: bold; transform: rotate(-10deg); margin-top: 20px; text-transform: uppercase; }
                </style>
            </head>
            <body>
                <div class="invoice-box">
                    <div class="header">
                        <div class="logo">GeoSurePath</div>
                        <div class="company-info">
                            <b>GeoSurePath Solutions Ltd.</b><br>
                            123 Tech Park, Whitefield<br>
                            Bangalore, KA, India 560066<br>
                            GSTIN: 29AAAAA0000A1Z5
                        </div>
                    </div>
                    
                    <div class="bill-to">
                        <Typography variant="overline">BILL TO:</Typography><br>
                        <b>${sub.user_name}</b><br>
                        ${sub.user_email}<br>
                        Payment ID: ${sub.razorpay_payment_id}
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Qty</th>
                                <th style="text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>GPS Fleet Subscription - ${sub.plan_id.toUpperCase()} Tier</td>
                                <td>1</td>
                                <td style="text-align: right;">₹${baseAmount.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td>Integrated GST (18%)</td>
                                <td>1</td>
                                <td style="text-align: right;">₹${gst.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="totals">
                        <div>Subtotal: ₹${baseAmount.toFixed(2)}</div>
                        <div>Tax: ₹${gst.toFixed(2)}</div>
                        <div style="font-size: 20px; font-weight: bold; color: #0B7A75;">Total Paid: ₹${total.toFixed(2)}</div>
                        <div class="status-stamp">PAID</div>
                    </div>

                    <div class="footer">
                        This is a computer generated invoice. No signature required.<br>
                        © 2026 GeoSurePath Global Tracking.
                    </div>
                </div>
                <script>window.print();</script>
            </body>
            </html>
        `);
    } catch (err) {
        res.status(500).send('<h1>Internal Server Error</h1>');
    }
});

// 7. Payment History for a specific User
router.get('/history/:userId', async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM geosurepath_subscriptions WHERE user_id = $1 ORDER BY created_at DESC",
            [req.params.userId]
        );
        res.json(result.rows);
    } catch (err) {
        logger.error('Fetch Payment History Error:', err.message);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

module.exports = router;
