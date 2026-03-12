const { pool, logger } = require('../services/db');
const axios = require('axios');

// We use the internal Docker service name by default
const TRACCAR_URL = process.env.TRACCAR_INTERNAL_URL || 'http://traccar:8082';

/**
 * Subscription Enforcement Middleware
 * Verifies that a user has not exceeded their plan-based device limit.
 */
const checkDeviceLimit = async (req, res, next) => {
    try {
        // 1. Identify User from session cookie
        const cookie = req.headers.cookie;
        if (!cookie) return res.status(401).json({ error: 'Authentication required' });

        // Validate session with Traccar
        const sessionRes = await axios.get(`${TRACCAR_URL}/api/session`, {
            headers: { Cookie: cookie }
        });
        const user = sessionRes.data;
        if (!user || !user.id) return res.status(401).json({ error: 'Invalid Traccar session' });

        // 2. Fetch Subscription & Limit
        const subRes = await pool.query(
            "SELECT device_limit FROM geosurepath_subscriptions WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1",
            [user.id]
        );

        // Default to a low limit (e.g., 2) if no active subscription found
        const limit = subRes.rowCount > 0 ? subRes.rows[0].device_limit : 2;

        // 3. Count Current Devices
        // We count assignments to this specific user
        const countRes = await pool.query(
            "SELECT COUNT(*) as count FROM tc_user_device WHERE userid = $1",
            [user.id]
        );
        const currentCount = parseInt(countRes.rows[0].count);

        if (currentCount >= limit) {
            logger.warn(`User ${user.id} reached device limit (${currentCount}/${limit})`);
            return res.status(403).json({
                error: 'Device limit reached',
                message: `Your current plan allows for a maximum of ${limit} devices. Please upgrade your subscription to add more vehicles.`
            });
        }

        // Attach user info for downstream use if needed
        req.traccarUser = user;
        next();
    } catch (err) {
        logger.error('Device Limit Check Error:', err.message);
        // If Traccar is down during registration/addition, we should probably fail safe or error
        res.status(500).json({ error: 'Could not verify subscription limits' });
    }
};

module.exports = { checkDeviceLimit };
