const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const Joi = require('joi');
const { pool, redisClient, logger } = require('../services/db');
const { adminAuth } = require('../middleware/auth');
const { logAudit } = require('../services/auditService');

const { authenticateJWT } = require('../middleware/auth');
const { generateTokens, blacklistToken, verifyTOTPToken } = require('../services/authService');
const { asyncHandler } = require('../middleware/errorHandler');
const { AppError } = require('../utils/errors');

/**
 * @openapi
 * /api/admin/auth/login:
 *   post:
 *     summary: Administrative Login
 *     description: Authenticates admin via email/password and Optional 2FA.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: admin@geosurepath.com }
 *               password: { type: string, example: P@ssw0rd123 }
 *               totpToken: { type: string, example: "123456" }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken: { type: string }
 *                 refreshToken: { type: string }
 *       401:
 *         description: Auth failed
 *       403:
 *         description: Account Locked (WF-011)
 */

// --- AUTH ENDPOINTS ---
/**
 * Production Login Flow
 * Supports timing-safe passwords and 2FA challenges.
 */
router.post('/admin/auth/login', asyncHandler(async (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required(),
        totpToken: Joi.string().length(6).optional()
    });

    const { error, value } = schema.validate(req.body);
    if (error) return next(new AppError('VALIDATION_ERROR', error.details[0].message, 400));

    const { email, password, totpToken } = value;
    const lockoutKey = `lockout:${email}`;
    const attemptsKey = `login_attempts:${email}`;

    // 1. Check if locked
    const isLocked = await redisClient.get(lockoutKey);
    if (isLocked) {
        return next(new AppError('ACCOUNT_LOCKED', 'Too many failed attempts. Account locked for 15 minutes.', 403));
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    // 2. Timing-safe verification
    if (email !== adminEmail) {
        await bcrypt.compare(password, '$2a$10$invalidhashplaceholderformistmatch');
        // Increment attempts even for wrong email to prevent user enumeration via timing
        await handleFailedAttempt(email); 
        return next(new AppError('AUTH_FAILED', 'Invalid credentials', 401));
    }

    const isValid = await bcrypt.compare(password, adminPasswordHash);
    if (!isValid) {
        await handleFailedAttempt(email);
        logAudit('LOGIN_FAILURE', 'admin', { email }, null, req.ip);
        return next(new AppError('AUTH_FAILED', 'Invalid credentials', 401));
    }

    // Reset attempts on success
    await redisClient.del(attemptsKey);

    // 2. 2FA Check (Isolated Metadata - Fix for BUG-010)
    const userRes = await pool.query(
        "SELECT totp_secret, totp_enabled FROM geosurepath_user_metadata WHERE user_id = (SELECT id FROM tc_users WHERE email = $1 LIMIT 1)",
        [email]
    );
    const user = userRes.rows[0];

    if (user && user.totp_enabled) {
        if (!totpToken) {
            return res.json({ requiresTOTP: true, email });
        }
        const validTOTP = verifyTOTPToken(user.totp_secret, totpToken);
        if (!validTOTP) {
            return next(new AppError('2FA_FAILED', 'Invalid 2FA code', 401));
        }
    }

    // 3. Token Generation & Session Persistence
    const tokens = generateTokens({ id: 0, email, role: 'admin' });
    const crypto = require('crypto');
    const tokenHash = crypto.createHash('sha256').update(tokens.accessToken).digest('hex');

    await pool.query(
        "INSERT INTO geosurepath_sessions (user_email, token_hash, ip_address, user_agent, expires_at) VALUES ($1, $2, $3, $4, NOW() + INTERVAL '15 minutes')",
        [email, tokenHash, req.ip, req.headers['user-agent']]
    );

    res.cookie('adminToken', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 900000 // 15 mins
    });

    logAudit('LOGIN_SUCCESS', 'admin', { email }, null, req.ip);
    res.json({ 
        accessToken: tokens.accessToken, 
        refreshToken: tokens.refreshToken,
        user: { email, role: 'admin' }
    });
}));

/**
 * @openapi
 * /api/admin/auth/logout:
 *   post:
 *     summary: Session Revocation
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Success
 */

router.post('/admin/auth/logout', authenticateJWT, asyncHandler(async (req, res) => {
    const token = req.cookies.adminToken || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    if (token) {
        await blacklistToken(token);
        const crypto = require('crypto');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        await pool.query("DELETE FROM geosurepath_sessions WHERE token_hash = $1", [tokenHash]);
    }
    res.clearCookie('adminToken');
    res.json({ success: true, message: 'Logged out successfully' });
}));

router.get('/admin/auth/recovery-codes', adminAuth, asyncHandler(async (req, res) => {
    const email = req.admin.email;
    const crypto = require('crypto');
    const codes = [];
    const hashes = [];
    
    for (let i = 0; i < 10; i++) {
        const code = crypto.randomBytes(4).toString('hex');
        codes.push(code);
        hashes.push(crypto.createHash('sha256').update(code).digest('hex'));
    }

    // Clear old ones
    await pool.query("DELETE FROM geosurepath_recovery_codes WHERE user_email = $1", [email]);
    
    // Insert new ones
    for (const hash of hashes) {
        await pool.query("INSERT INTO geosurepath_recovery_codes (user_email, code_hash) VALUES ($1, $2)", [email, hash]);
    }

    res.json({ codes });
}));

router.post('/admin/auth/verify-recovery', asyncHandler(async (req, res, next) => {
    const { email, code } = req.body;
    if (!email || !code) return next(new AppError('MISSING_FIELDS', 'Email and recovery code required', 400));

    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(code).digest('hex');
    
    const result = await pool.query(
        "SELECT id FROM geosurepath_recovery_codes WHERE user_email = $1 AND code_hash = $2 AND used = false",
        [email, hash]
    );

    if (result.rowCount > 0) {
        await pool.query("UPDATE geosurepath_recovery_codes SET used = true WHERE id = $1", [result.rows[0].id]);
        const finalToken = jwt.sign({ role: 'admin', email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        const tokenHash = crypto.createHash('sha256').update(finalToken).digest('hex');
        await pool.query(
            "INSERT INTO geosurepath_sessions (user_email, token_hash, ip_address, user_agent, expires_at) VALUES ($1, $2, $3, $4, NOW() + INTERVAL '1 hour')",
            [email, tokenHash, req.ip, req.headers['user-agent']]
        );

        res.cookie('adminToken', finalToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 3600000
        });
        res.json({ success: true, token: finalToken });
    } else {
        return next(new AppError('INVALID_RECOVERY', 'Invalid or already used recovery code', 400));
    }
}));

router.delete('/admin/auth/totp-secret', adminAuth, asyncHandler(async (req, res) => {
    const email = req.admin?.email || 'admin';
    await redisClient.del(`totp_secret:${email}`);
    logger.warn(`TOTP Secret cleared for ${email} by administrative request.`);
    logAudit('TOTP_RESET', 'admin', { email }, null, req.ip);
    res.json({ message: '2FA secret has been reset. You will need to setup 2FA again on next login.' });
}));

// --- CLIENT OTP AUTH ---
router.post('/auth/send-otp', asyncHandler(async (req, res, next) => {
    const { mobile } = req.body;
    if (!mobile) return next(new AppError('MISSING_FIELDS', 'Mobile number required', 400));

    const crypto = require('crypto');
    const code = crypto.randomInt(100000, 999999).toString();
    await redisClient.set(`otp:${mobile}`, code, { EX: 300 });
    const { sendSMS } = require('../services/sms');
    await sendSMS(mobile, `GeoSurePath Verification Code: ${code}. Valid for 5 minutes.`);
    res.json({ message: 'OTP sent successfully', mobile });
}));

router.post('/auth/verify-otp', asyncHandler(async (req, res, next) => {
    const schema = Joi.object({
        mobile: Joi.string().pattern(/^\+?[0-9]{10,15}$/).required(),
        code: Joi.string().length(6).required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) return next(new AppError('VALIDATION_ERROR', error.details[0].message, 400));

    const { mobile, code } = value;

    const storedCode = await redisClient.get(`otp:${mobile}`);
    if (!storedCode) return next(new AppError('OTP_EXPIRED', 'OTP expired or not found', 400));

    const crypto = require('crypto');
    const isMatch = crypto.timingSafeEqual(Buffer.from(storedCode), Buffer.from(code));

    if (isMatch) {
        await redisClient.del(`otp:${mobile}`);
        res.json({ success: true, message: 'OTP verified' });
    } else {
        return next(new AppError('INVALID_OTP', 'Invalid or expired OTP', 400));
    }
}));

const handleFailedAttempt = async (email) => {
    const attemptsKey = `login_attempts:${email}`;
    const lockoutKey = `lockout:${email}`;

    const attempts = await redisClient.incr(attemptsKey);
    if (attempts === 1) {
        await redisClient.expire(attemptsKey, 900); // 15 mins
    }

    if (attempts >= 5) {
        await redisClient.set(lockoutKey, '1', { EX: 900 }); // Lockout for 15 mins
        await redisClient.del(attemptsKey);
        logger.warn(`Account locked for ${email} due to 5 failed attempts.`);
    }
};

module.exports = router;
