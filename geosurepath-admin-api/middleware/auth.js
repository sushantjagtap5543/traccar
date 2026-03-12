const jwt = require('jsonwebtoken');
const { logger } = require('../services/db');

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

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err || decoded.role !== 'admin') {
            logger.warn(`Invalid JWT attempt from ${req.ip}`);
            return res.status(403).json({ error: 'Unauthorized session' });
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
