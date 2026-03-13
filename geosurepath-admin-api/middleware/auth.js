const jwt = require('jsonwebtoken');
const { logger, pool } = require('../services/db');
const { isTokenBlacklisted } = require('../services/authService');

const expectedKey = process.env.ADMIN_API_KEY;

/**
 * Production-Grade JWT Authenticator
 * Supports access/refresh separation and revocation checks.
 */
const authenticateJWT = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = req.cookies.adminToken || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    if (!process.env.JWT_SECRET) {
        logger.error('FATAL: JWT_SECRET not configured');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        // 1. Check Blacklist (Revocation)
        if (await isTokenBlacklisted(token)) {
            return res.status(401).json({ error: 'Token has been revoked', code: 'TOKEN_REVOKED' });
        }

        // 2. Verify JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. Verify Session in DB (Double-check for sensitivity)
        const crypto = require('crypto');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const sessionRes = await pool.query(
            "SELECT id FROM geosurepath_sessions WHERE token_hash = $1 AND expires_at > NOW()",
            [tokenHash]
        );

        if (sessionRes.rowCount === 0) {
            return res.status(401).json({ error: 'Session expired or revoked', code: 'SESSION_REVOKED' });
        }

        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
        }
        logger.warn(`JWT Verification error from ${req.ip}: ${err.message}`);
        return res.status(401).json({ error: 'Invalid token' });
    }
};

/**
 * Role-Based Access Control Middleware
 */
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            logger.warn(`RBAC rejection for ${req.user?.email || 'Anonymous'} at ${req.path}`);
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};

const adminAuth = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || (req.headers['authorization']?.startsWith('ApiKey ') ? req.headers['authorization'].split(' ')[1] : null);
    if (apiKey && apiKey === expectedKey) return next();
    return authenticateJWT(req, res, next);
};

module.exports = { 
    authenticateJWT, 
    requireRole, 
    adminAuth, 
    expectedKey,
    verifyAdminToken: authenticateJWT // Alias for backward compatibility during transition
};
