const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { pool, logger } = require('../services/db');
const { decrypt } = require('../utils/crypto');
const Joi = require('joi');

/**
 * Razorpay Payment Integration
 * Handles order creation and verification for platform subscriptions.
 */

// Initialize Razorpay
const getRazorpayClient = async () => {
    const res = await pool.query("SELECT key, value FROM geosurepath_settings WHERE key IN ('razorpay_key_id', 'razorpay_secret')");
    const config = {};
    res.rows.forEach(r => config[r.key] = decrypt(r.value));

    const keyId = config.razorpay_key_id || process.env.RAZORPAY_KEY_ID;
    const secret = config.razorpay_secret || process.env.RAZORPAY_SECRET;

    if (!keyId || !secret) {
        throw new Error('Razorpay credentials not configured');
    }

    return new Razorpay({ key_id: keyId, key_secret: secret });
};

// 1. Create Order
router.post('/orders', async (req, res) => {
    const schema = Joi.object({
        planId: Joi.string().valid('1month', '6month', '12month', 'enterprise').required(),
        userId: Joi.number().integer().positive().required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { planId, userId } = value;

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
                basePrice,
                gst,
                planId
            }
        };

        const order = await client.orders.create(options);
        res.json({ ...order, gst, totalAmount: totalAmount / 100 });
    } catch (err) {
        logger.error('Razorpay Order Error:', { message: err.message, userId, planId });
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
        planId // '1month', '6month', '12month', 'enterprise'
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId || !planId) {
        return res.status(400).json({ error: 'Missing required payment verification fields' });
    }

    try {
        const resSettings = await pool.query("SELECT value FROM geosurepath_settings WHERE key = 'razorpay_secret' LIMIT 1");
        const secret = decrypt(resSettings.rows[0]?.value) || process.env.RAZORPAY_SECRET;

        if (!secret) return res.status(500).json({ error: 'Payment gateway secret not configured' });

        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const expectedSignature = hmac.digest('hex');

        // Timing-safe comparison
        const isMatch = crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpay_signature));

        if (isMatch) {
            // Determine duration
            let months = 1;
            if (planId === '6month') months = 6;
            else if (planId === '12month' || planId === 'enterprise') months = 12;

            const dbClient = await pool.connect();
            try {
                await dbClient.query('BEGIN');

                // Check for existing active subscription
                const existingSub = await dbClient.query(
                    "SELECT id FROM geosurepath_subscriptions WHERE user_id = $1 AND status = 'active' AND expiry_date > NOW() FOR UPDATE",
                    [userId]
                );

                if (existingSub.rowCount > 0) {
                    // Update existing one to cancelled/replaced or just expire it
                    await dbClient.query(
                        "UPDATE geosurepath_subscriptions SET status = 'replaced' WHERE user_id = $1 AND status = 'active'",
                        [userId]
                    );
                }

                const expiryDate = new Date();
                expiryDate.setMonth(expiryDate.getMonth() + months);

                // Fetch device limit and price from settings
                const limitKey = `plan_limit_${planId}`;
                const priceKey = `plan_price_${planId}`;

                const [limitRes, priceRes] = await Promise.all([
                    dbClient.query("SELECT value FROM geosurepath_settings WHERE key = $1", [limitKey]),
                    dbClient.query("SELECT value FROM geosurepath_settings WHERE key = $1", [priceKey])
                ]);

                const deviceLimit = limitRes.rowCount > 0 ? parseInt(limitRes.rows[0].value) : (planId === 'enterprise' ? 100 : 25);
                const basePrice = priceRes.rowCount > 0 ? parseInt(priceRes.rows[0].value) : (planId === 'enterprise' ? 4500 : 1500);
                const gst = Math.round(basePrice * 0.18);
                const totalAmount = basePrice + gst;

                await dbClient.query(
                    `INSERT INTO geosurepath_subscriptions 
                    (user_id, plan_id, status, razorpay_order_id, razorpay_payment_id, expiry_date, device_limit, amount_paid, currency)
                    VALUES ($1, $2, 'active', $3, $4, $5, $6, $7, 'INR')`,
                    [userId, planId, razorpay_order_id, razorpay_payment_id, expiryDate, deviceLimit, totalAmount]
                );

                await dbClient.query('COMMIT');
                logger.info(`Subscription activated for User ${userId}: ${planId} (₹${totalAmount})`);
                res.json({ success: true, message: `Subscription activated for ${months} month(s)` });
            } catch (err) {
                await dbClient.query('ROLLBACK');
                throw err;
            } finally {
                dbClient.release();
            }
        } else {
            res.status(400).json({ success: false, error: 'Invalid payment signature' });
        }
    } catch (err) {
        logger.error('Payment Verification Error:', { error: err.message, userId, orderId: razorpay_order_id });
        res.status(500).json({ error: 'Verification failed' });
    }
});

// 3. Get Subscription Status
router.get('/subscription/:userId', async (req, res) => {
    try {
        const subRes = await pool.query(
            "SELECT *, (expiry_date - NOW()) as time_remaining FROM geosurepath_subscriptions WHERE user_id = $1 AND status = 'active' AND expiry_date > NOW() ORDER BY created_at DESC LIMIT 1",
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
        const total = parseFloat(sub.amount_paid) || (sub.plan_id === '1month' ? 236 : (sub.plan_id === 'enterprise' ? 5310 : 1770));
        const baseAmount = Math.round(total / 1.18);
        const gst = total - baseAmount;

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
                        <small style="text-transform: uppercase; color: #777; font-weight: bold;">Bill To:</small><br>
                        <b>${sub.user_name}</b><br>
                        ${sub.user_email}<br>
                        Payment ID: ${sub.razorpay_payment_id}<br>
                        Date: ${new Date(sub.created_at).toLocaleDateString()}
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
                                <td style="text-align: right;">₹${baseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                                <td>Integrated GST (18%)</td>
                                <td>1</td>
                                <td style="text-align: right;">₹${gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="totals">
                        <div>Subtotal: ₹${baseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                        <div>Tax: ₹${gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                        <div style="font-size: 20px; font-weight: bold; color: #0B7A75;">Total Paid: ₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
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
