const jwt = require('jsonwebtoken');
const { logger, pool } = require('../services/db');

const expectedKey = process.env.ADMIN_API_KEY;

const verifyAdminToken = (req, res, next) => {
    const token = req.cookies.adminToken || req.headers['x-admin-token'];
    if (!token) {
        logger.warn(`Auth failure: No token from ${req.ip}`);
        return res.status(403).json({ error: 'No token provided' });
    }

    if (!process.env.JWT_SECRET) {
        logger.error('FATAL: JWT_SECRET environment variable not configured');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    jwt.verify(token, process.env.JWT_SECRET, { clockTolerance: 30 }, async (err, decoded) => {
        if (err) {
            logger.warn(`JWT Verification error from ${req.ip}: ${err.message}`);
            return res.status(401).json({ error: 'Invalid or expired token', code: 'TOKEN_EXPIRED' });
        }

        if (decoded.role !== 'admin') {
            logger.warn(`Unauthorized role ${decoded.role} from ${req.ip}`);
            return res.status(403).json({ error: 'Unauthorized role assignment' });
        }

        // Verify session in DB
        try {
            const crypto = require('crypto');
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
            const sessionRes = await pool.query(
                "SELECT id FROM geosurepath_sessions WHERE token_hash = $1 AND expires_at > NOW()",
                [tokenHash]
            );
            if (sessionRes.rowCount === 0) {
                logger.warn(`Session revoked or expired for ${decoded.email} from ${req.ip}`);
                return res.status(401).json({ error: 'Session expired or revoked', code: 'SESSION_REVOKED' });
            }
        } catch (dbErr) {
            logger.error('Session verification DB error:', dbErr);
            return res.status(500).json({ error: 'Internal auth security error' });
        }

        req.admin = decoded;
        next();
    });
};

const adminAuth = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || (req.headers['authorization']?.startsWith('ApiKey ') ? req.headers['authorization'].split(' ')[1] : null);
    if (apiKey && apiKey === expectedKey) return next();
    return verifyAdminToken(req, res, next);
};

module.exports = { adminAuth, expectedKey, verifyAdminToken };
