const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { pool, logger } = require('../services/db');
const { decrypt } = require('../utils/crypto');
const Joi = require('joi');
const { logAudit } = require('../services/auditService');
const { verifyRazorpaySignature } = require('../middleware/razorpay');
const { asyncHandler } = require('../middleware/errorHandler');
const { AppError } = require('../utils/errors');

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
router.post('/orders', authenticateJWT, asyncHandler(async (req, res, next) => {
    const schema = Joi.object({
        planId: Joi.string().valid('1month', '6month', '12month', 'enterprise').required(),
        userId: Joi.number().integer().positive().required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) return next(new AppError('VALIDATION_ERROR', error.details[0].message, 400));

    const { planId, userId } = value;

    const client = await getRazorpayClient();

    // Fetch base price from DB
    const priceKey = `plan_price_${planId}`;
    const priceRes = await pool.query("SELECT value FROM geosurepath_settings WHERE key = $1", [priceKey]);

    if (priceRes.rowCount === 0) return next(new AppError('PLAN_INVALID', 'Invalid plan selected', 400));

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
}));

// 2. Verify Payment & Activate Plan
router.post('/verify', authenticateJWT, asyncHandler(async (req, res, next) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        userId,
        planId
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId || !planId) {
        return next(new AppError('MISSING_FIELDS', 'Missing required payment verification fields', 400));
    }

    const resSettings = await pool.query("SELECT value FROM geosurepath_settings WHERE key = 'razorpay_secret' LIMIT 1");
    const secret = decrypt(resSettings.rows[0]?.value) || process.env.RAZORPAY_SECRET;

    if (!secret) return next(new AppError('CONFIG_ERROR', 'Payment gateway secret not configured', 500));

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const expectedSignature = hmac.digest('hex');

    const isMatch = crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpay_signature));

    if (!isMatch) return next(new AppError('PAYMENT_SIGNATURE_INVALID', 'Invalid payment signature', 400));

    // Determine duration
    let months = 1;
    if (planId === '6month') months = 6;
    else if (planId === '12month' || planId === 'enterprise') months = 12;

    const dbClient = await pool.connect();
    try {
        await dbClient.query('BEGIN');

        const idempotencyCheck = await dbClient.query(
            "SELECT id FROM geosurepath_subscriptions WHERE razorpay_payment_id = $1",
            [razorpay_payment_id]
        );

        if (idempotencyCheck.rowCount > 0) {
            await dbClient.query('ROLLBACK');
            return res.json({ success: true, message: 'Payment already verified and subscription active' });
        }

        const existingSub = await dbClient.query(
            "SELECT id FROM geosurepath_subscriptions WHERE user_id = $1 AND status = 'active' AND expiry_date > NOW() FOR UPDATE",
            [userId]
        );

        let carryOverDays = 0;
        if (existingSub.rowCount > 0) {
            const oldSub = existingSub.rows[0];
            const diff = new Date(oldSub.expiry_date) - new Date();
            carryOverDays = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));

            await dbClient.query(
                "UPDATE geosurepath_subscriptions SET status = 'replaced' WHERE user_id = $1 AND status = 'active'",
                [userId]
            );
        }

        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + months);
        expiryDate.setDate(expiryDate.getDate() + carryOverDays);

        const limitKey = `plan_limit_${planId}`;
        const priceKey = `plan_price_${planId}`;

        const [limitRes, priceRes] = await Promise.all([
            dbClient.query("SELECT value FROM geosurepath_settings WHERE key = $1", [limitKey]),
            dbClient.query("SELECT value FROM geosurepath_settings WHERE key = $1", [priceKey])
        ]);

        const invoiceSettings = await dbClient.query("SELECT key, value FROM geosurepath_settings WHERE key IN ('invoice_prefix', 'invoice_next_val') FOR UPDATE");
        const invConfig = {};
        invoiceSettings.rows.forEach(r => invConfig[r.key] = r.value);
        
        const prefix = invConfig.invoice_prefix || 'GSP-';
        const nextVal = parseInt(invConfig.invoice_next_val || '1001');
        
        const now = new Date();
        const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
        const invoiceNumber = `${prefix}${yearMonth}-${String(nextVal).padStart(6, '0')}`;

        await dbClient.query("UPDATE geosurepath_settings SET value = $1 WHERE key = 'invoice_next_val'", [(nextVal + 1).toString()]);

        const deviceLimit = limitRes.rowCount > 0 ? parseInt(limitRes.rows[0].value) : (planId === 'enterprise' ? 100 : 25);
        const basePrice = priceRes.rowCount > 0 ? parseInt(priceRes.rows[0].value) : (planId === 'enterprise' ? 4500 : 1500);
        const gst = Math.round(basePrice * 0.18);
        const totalAmount = basePrice + gst;

        await dbClient.query(
            `INSERT INTO geosurepath_subscriptions 
            (user_id, plan_id, status, razorpay_order_id, razorpay_payment_id, expiry_date, device_limit, amount_paid, currency, invoice_number)
            VALUES ($1, $2, 'active', $3, $4, $5, $6, $7, 'INR', $8)`,
            [userId, planId, razorpay_order_id, razorpay_payment_id, expiryDate, deviceLimit, totalAmount, invoiceNumber]
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
}));

// 3. Get Subscription Status
router.get('/subscription/:userId', authenticateJWT, asyncHandler(async (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.userId)) {
        return next(new AppError('FORBIDDEN', 'Access denied to other user data', 403));
    }
    const GRACE_PERIOD_DAYS = 3;
    const subRes = await pool.query(
        "SELECT *, (expiry_date - NOW()) as time_remaining FROM geosurepath_subscriptions WHERE user_id = $1 AND status = 'active' AND (expiry_date + INTERVAL '3 days') > NOW() ORDER BY created_at DESC LIMIT 1",
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
}));

// 4. Cancel Subscription (With Churn Analytics)
router.post('/cancel', authenticateJWT, asyncHandler(async (req, res, next) => {
    const { userId, reason } = req.body;
    
    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
        return next(new AppError('FORBIDDEN', 'Cannot cancel subscription for another user', 403));
    }
    const result = await pool.query(
        "UPDATE geosurepath_subscriptions SET status = 'cancelled' WHERE user_id = $1 AND status = 'active' RETURNING id",
        [userId]
    );
    
    if (result.rowCount > 0) {
        logger.warn(`User ${userId} cancelled subscription. Reason: ${reason || 'Not provided'}`);
        logAudit('SUBSCRIPTION_CANCELLED', 'subscription', { userId, reason }, userId);
    }

    res.json({ success: true, message: 'Subscription cancelled successfully' });
}));

// 5. Razorpay Webhook (For automated events)
router.post('/webhook', verifyRazorpaySignature, asyncHandler(async (req, res) => {
    const { event, payload } = req.body;
    logger.info('Razorpay webhook received', { event });

    switch (event) {
        case 'payment.captured':
            await handlePaymentCaptured(payload.payment.entity);
            break;
        case 'payment.failed':
            await handlePaymentFailed(payload.payment.entity);
            break;
        default:
            logger.warn('Unhandled webhook event', { event });
    }

    res.status(200).json({ status: 'received' });
}));

async function handlePaymentCaptured(payment) {
    const { order_id, id: payment_id, amount, notes } = payment;
    const userId = notes?.userId;
    const planId = notes?.planId;
    
    if (!userId || !planId) {
        logger.warn('Captured payment without metadata in notes:', { order_id, payment_id });
        return;
    }

    // REDUNDANT ACTIVATION (Fix for BUG-018): 
    // This handles the case where the user closes the browser before /verify completes.
    logger.info('Webhook: Triggering redundant subscription activation (BUG-018)', { order_id, payment_id, userId });
    
    const dbClient = await pool.connect();
    try {
        await dbClient.query('BEGIN');
        
        // Determing months (Logic duplicated from /verify for webhook resilience)
        let months = 1;
        if (planId === '6month') months = 6;
        else if (planId === '12month' || planId === 'enterprise') months = 12;

        const idempotencyCheck = await dbClient.query(
            "SELECT id FROM geosurepath_subscriptions WHERE razorpay_payment_id = $1",
            [payment_id]
        );

        if (idempotencyCheck.rowCount > 0) {
            await dbClient.query('ROLLBACK');
            return;
        }

        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + months);

        const limitKey = `plan_limit_${planId}`;
        const limitRes = await dbClient.query("SELECT value FROM geosurepath_settings WHERE key = $1", [limitKey]);
        const deviceLimit = limitRes.rowCount > 0 ? parseInt(limitRes.rows[0].value) : 25;

        await dbClient.query(
            `INSERT INTO geosurepath_subscriptions 
            (user_id, plan_id, status, razorpay_order_id, razorpay_payment_id, expiry_date, device_limit, amount_paid, currency)
            VALUES ($1, $2, 'active', $3, $4, $5, $6, $7, 'INR')`,
            [userId, planId, order_id, payment_id, expiryDate, deviceLimit, amount / 100]
        );

        await dbClient.query('COMMIT');
        logger.info(`Webhook: Successfully activated subscription for User ${userId}`);
    } catch (err) {
        await dbClient.query('ROLLBACK');
        logger.error('Webhook: Activation failure:', err.message);
    } finally {
        dbClient.release();
    }
}

async function handlePaymentFailed(payment) {
    const { order_id, id: payment_id, error_description } = payment;
    logger.error('Payment failed via webhook', { order_id, payment_id, error_description });
}

// 6. Styled Invoice Generator (Now Authenticated - BUG-019)
router.get('/invoice/:paymentId', authenticateJWT, asyncHandler(async (req, res, next) => {
    const result = await pool.query(
        "SELECT s.*, u.name as user_name, u.email as user_email FROM geosurepath_subscriptions s JOIN tc_users u ON s.user_id = u.id WHERE s.razorpay_payment_id = $1",
        [req.params.paymentId]
    );
    if (result.rowCount === 0) return next(new AppError('NOT_FOUND', 'Invoice Not Found', 404));

    const sub = result.rows[0];
    
    // Ownership Check
    if (req.user.role !== 'admin' && req.user.id !== sub.user_id) {
        return next(new AppError('FORBIDDEN', 'Access denied to this invoice', 403));
    }
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
                    Invoice: <b>${sub.invoice_number}</b><br>
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
            <!-- Auto-print disabled for better UX (BUG-023). Added manual print button if needed -->
        </body>
        </html>
    `);
}));

// 7. Refund & Dispute Handling (Strict Admin Only - BUG-003)
router.post('/refund/:paymentId', adminAuth, asyncHandler(async (req, res, next) => {
    const paymentId = req.params.paymentId;
    const { amount, reason } = req.body; // Optional partial refund

    try {
        const rzp = await getRazorpayClient();
        
        // 1. Check if payment exists and is not already refunded
        const checkRes = await pool.query(
            "SELECT status, amount_paid FROM geosurepath_subscriptions WHERE razorpay_payment_id = $1",
            [paymentId]
        );
        if (checkRes.rowCount === 0) return next(new AppError('NOT_FOUND', 'Payment record not found', 404));
        if (checkRes.rows[0].status === 'refunded') return next(new AppError('BAD_REQUEST', 'Payment already refunded', 400));

        // 2. Call Razorpay Refund API
        const refundOptions = {
            payment_id: paymentId,
            speed: 'normal',
            notes: { reason: reason || 'Admin requested refund' }
        };
        if (amount) refundOptions.amount = amount * 100; // Partial refund support

        const refund = await rzp.payments.refund(paymentId, refundOptions);

        // 3. Update local DB status
        await pool.query(
            "UPDATE geosurepath_subscriptions SET status = 'refunded', updated_at = NOW() WHERE razorpay_payment_id = $1",
            [paymentId]
        );

        logger.info(`Payment ${paymentId} refunded successfully via Razorpay API. Refund ID: ${refund.id}`);
        res.json({ success: true, message: 'Refund processed successfully', refundId: refund.id });
    } catch (err) {
        logger.error(`Razorpay Refund Error for ${paymentId}:`, err.message);
        return next(new AppError('REFUND_FAILED', `Payment gateway rejected refund: ${err.message}`, 502));
    }
}));

// 8. Payment History for a specific User
router.get('/history/:userId', authenticateJWT, asyncHandler(async (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.userId)) {
        return next(new AppError('FORBIDDEN', 'Access denied to user history', 403));
    }
    const result = await pool.query(
        "SELECT * FROM geosurepath_subscriptions WHERE user_id = $1 ORDER BY created_at DESC",
        [req.params.userId]
    );
    res.json(result.rows);
}));

module.exports = router;
