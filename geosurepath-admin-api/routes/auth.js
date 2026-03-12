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

// --- AUTH ENDPOINTS ---
router.post('/admin/auth/login', async (req, res) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email, password } = value;
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
        logger.error('ADMIN_EMAIL environment variable not set');
        return res.status(500).json({ error: 'Server authentication configuration missing' });
    }
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!adminPasswordHash || !process.env.JWT_SECRET) {
        logger.error('Authentication environment variables missing. Login rejected.');
        return res.status(500).json({ error: 'Server authentication configuration missing' });
    }

    if (email !== adminEmail) {
        logger.warn(`Email mismatch for admin login: ${email}`);
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, adminPasswordHash);
    if (!isValid) {
        logger.warn(`Invalid password for admin login: ${email}`);
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ role: 'admin', email }, process.env.JWT_SECRET, { expiresIn: '30m' });
    logAudit('LOGIN_ATTEMPT', 'admin', { email }, null, req.ip);
    res.json({ token });
});

router.get('/admin/auth/totp-setup', adminAuth, async (req, res) => {
    try {
        const secret = speakeasy.generateSecret({ name: 'GeoSurePath Admin', issuer: 'GeoSurePath' });
        await redisClient.set(`totp_secret:${req.admin?.email || 'admin'}`, secret.base32, { EX: 600 });
        const qrCode = await QRCode.toDataURL(secret.otpauth_url);
        logAudit('TOTP_SETUP_INIT', 'admin', { email: req.admin?.email }, null, req.ip);
        res.json({ qrCode, secret: secret.base32 });
    } catch (err) {
        logger.error('TOTP Setup failed:', err);
        res.status(500).json({ error: 'Failed to generate 2FA secret' });
    }
});

router.post('/admin/auth/verify-totp', async (req, res) => {
    const schema = Joi.object({
        token: Joi.string().length(6).required(),
        email: Joi.string().email().optional()
    });

    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { token: totpToken, email } = value;
    try {
        const secret = await redisClient.get(`totp_secret:${email || 'admin'}`);
        if (!secret) return res.status(400).json({ error: '2FA session expired or not initialized' });

        const verified = speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token: totpToken,
            window: 2
        });

        if (verified) {
            const finalToken = jwt.sign({ role: 'admin', email: email || 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
            
            // Session Management
            const crypto = require('crypto');
            const tokenHash = crypto.createHash('sha256').update(finalToken).digest('hex');
            await pool.query(
                "INSERT INTO geosurepath_sessions (user_email, token_hash, ip_address, user_agent, expires_at) VALUES ($1, $2, $3, $4, NOW() + INTERVAL '1 hour')",
                [email || 'admin', tokenHash, req.ip, req.headers['user-agent']]
            );

            res.cookie('adminToken', finalToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 3600000
            });
            res.json({ success: true, token: finalToken });
        } else {
            res.status(400).json({ error: 'Invalid or expired 2FA code' });
        }
    } catch (err) {
        logger.error('TOTP Verification failed:', err);
        res.status(500).json({ error: 'Verification error' });
    }
});

router.post('/admin/auth/logout', adminAuth, async (req, res) => {
    try {
        const token = req.cookies.adminToken || req.headers['x-admin-token'];
        if (token) {
            const crypto = require('crypto');
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
            await pool.query("DELETE FROM geosurepath_sessions WHERE token_hash = $1", [tokenHash]);
        }
        res.clearCookie('adminToken');
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
        logger.error('Logout failed:', err);
        res.status(500).json({ error: 'Logout failed' });
    }
});

router.get('/admin/auth/recovery-codes', adminAuth, async (req, res) => {
    try {
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
    } catch (err) {
        logger.error('Recovery codes generation failed:', err);
        res.status(500).json({ error: 'Failed to generate recovery codes' });
    }
});

router.post('/admin/auth/verify-recovery', async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Email and recovery code required' });

    try {
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
            res.status(400).json({ error: 'Invalid or already used recovery code' });
        }
    } catch (err) {
        logger.error('Recovery verification failed:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/admin/auth/totp-secret', adminAuth, async (req, res) => {
    try {
        const email = req.admin?.email || 'admin';
        await redisClient.del(`totp_secret:${email}`);
        logger.warn(`TOTP Secret cleared for ${email} by administrative request.`);
        logAudit('TOTP_RESET', 'admin', { email }, null, req.ip);
        res.json({ message: '2FA secret has been reset. You will need to setup 2FA again on next login.' });
    } catch (err) {
        logger.error('TOTP Reset failed:', err);
        res.status(500).json({ error: 'Failed to reset 2FA secret' });
    }
});

// --- CLIENT OTP AUTH ---
router.post('/auth/send-otp', async (req, res) => {
    const { mobile } = req.body;
    if (!mobile) return res.status(400).json({ error: 'Mobile number required' });

    const crypto = require('crypto');
    const code = crypto.randomInt(100000, 999999).toString();
    try {
        await redisClient.set(`otp:${mobile}`, code, { EX: 300 });
        const { sendSMS } = require('../services/sms');
        await sendSMS(mobile, `GeoSurePath Verification Code: ${code}. Valid for 5 minutes.`);
        res.json({ message: 'OTP sent successfully', mobile });
    } catch (err) {
        logger.error('Redis OTP Storage or SMS Dispatch Failed:', err);
        res.status(500).json({ error: 'Failed to generate or send OTP' });
    }
});

router.post('/auth/verify-otp', async (req, res) => {
    const schema = Joi.object({
        mobile: Joi.string().pattern(/^\+?[0-9]{10,15}$/).required(),
        code: Joi.string().length(6).required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { mobile, code } = value;

    try {
        const storedCode = await redisClient.get(`otp:${mobile}`);
        if (!storedCode) return res.status(400).json({ error: 'OTP expired or not found' });

        const crypto = require('crypto');
        const isMatch = crypto.timingSafeEqual(Buffer.from(storedCode), Buffer.from(code));

        if (isMatch) {
            await redisClient.del(`otp:${mobile}`);
            res.json({ success: true, message: 'OTP verified' });
        } else {
            res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
        }
    } catch (err) {
        logger.error('Redis OTP Retrieval Failed:', err);
        res.status(500).json({ error: 'Verification failed' });
    }
});

module.exports = router;
