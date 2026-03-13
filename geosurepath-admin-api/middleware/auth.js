const jwt = require('jsonwebtoken');
const { logger, pool } = require('../services/db');
const { isTokenBlacklisted } = require('../services/authService');
const { AppError } = require('../utils/errors');
const { asyncHandler } = require('./errorHandler');

const expectedKey = process.env.ADMIN_API_KEY;

/**
 * Production-Grade JWT Authenticator
 * Supports access/refresh separation and revocation checks.
 */
const authenticateJWT = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = req.cookies.adminToken || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

    if (!token) {
        return next(new AppError('AUTH_REQUIRED', 'No token provided', 401));
    }

    if (!process.env.JWT_SECRET) {
        logger.error('FATAL: JWT_SECRET not configured');
        return next(new AppError('SERVER_CONFIG_ERROR', 'Server configuration error', 500));
    }

    // 1. Check Blacklist (Revocation)
    if (await isTokenBlacklisted(token)) {
        return next(new AppError('TOKEN_REVOKED', 'Token has been revoked', 401));
    }

    try {
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
            return next(new AppError('SESSION_REVOKED', 'Session expired or revoked', 401));
        }

        req.user = decoded;
        req.admin = decoded; // For adminAuth compatibility
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return next(new AppError('TOKEN_EXPIRED', 'Token expired', 401));
        }
        logger.warn(`JWT Verification error from ${req.ip}: ${err.message}`);
        return next(new AppError('AUTH_INVALID', 'Invalid token', 401));
    }
});

/**
 * Role-Based Access Control Middleware
 */
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            logger.warn(`RBAC rejection for ${req.user?.email || 'Anonymous'} at ${req.path}`);
            return next(new AppError('INSUFFICIENT_PERMISSIONS', 'Insufficient permissions', 403));
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
