const jwt = require('jsonwebtoken');
const { pool, logger } = require('../services/db');
const { AppError } = require('../utils/errors');

const JWT_SECRET = process.env.JWT_SECRET;

const authenticateJWT = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, JWT_SECRET, async (err, user) => {
            if (err) {
                return next(new AppError('UNAUTHORIZED', 'Invalid or expired token', 401));
            }

            req.user = user;
            
            // Fetch traccar user id from metadata if available
            const metadata = await pool.query("SELECT client_id FROM geosurepath_user_metadata WHERE user_id = $1", [user.id]);
            if (metadata.rowCount > 0) {
                req.traccarUser = { id: metadata.rows[0].client_id };
            }

            next();
        });
    } else {
        next(new AppError('UNAUTHORIZED', 'Authentication token required', 401));
    }
};

const adminAuth = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        next(new AppError('FORBIDDEN', 'Administrator access required', 403));
    }
};

module.exports = { authenticateJWT, adminAuth };
