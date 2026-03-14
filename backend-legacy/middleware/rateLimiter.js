const { redisClient, logger } = require('../services/db');
const { AppError } = require('../utils/errors');

/**
 * Basic Brute Force Protection using Redis
 * @param {string} prefix Key prefix for Redis
 * @param {number} limit Max attempts
 * @param {number} window Seconds to track
 */
const bruteForceProtection = (prefix = 'bf', limit = 5, window = 600) => {
    return async (req, res, next) => {
        const identifier = req.ip || req.body.email || req.body.mobile;
        const key = `${prefix}:${identifier}`;

        try {
            const attempts = await redisClient.incr(key);
            
            if (attempts === 1) {
                await redisClient.expire(key, window);
            }

            if (attempts > limit) {
                logger.warn(`Brute force attempt detected from ${identifier} on ${req.originalUrl}`);
                return next(new AppError('TOO_MANY_REQUESTS', 'Too many attempts. Please try again later.', 429));
            }

            next();
        } catch (err) {
            logger.error('Rate limit error:', err.message);
            next(); // Proceed regardless of Redis error to avoid blocking legit users
        }
    };
};

module.exports = { bruteForceProtection };
