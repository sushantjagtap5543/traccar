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
        let limit = subRes.rowCount > 0 ? subRes.rows[0].device_limit : 2;

        // Count Current Devices
        const countRes = await pool.query(
            "SELECT COUNT(*) as count FROM tc_user_device WHERE userid = $1",
            [user.id]
        );
        const currentCount = parseInt(countRes.rows[0].count);

        // 4. Auto-Provision Lite Subscription (Fix for BUG-016: Restricted to 2 devices)
        if (subRes.rowCount === 0 && currentCount === 0) {
            logger.info(`Provisioning light 1-year inbuilt subscription for new user ${user.id}`);
            const expiryDate = new Date();
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);

            const starterLimit = 2; // BUG-016: Only give 2 for free

            await pool.query(
                `INSERT INTO geosurepath_subscriptions 
                (user_id, plan_id, status, device_limit, amount_paid, razorpay_payment_id, expiry_date) 
                VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [user.id, 'starter', 'active', starterLimit, 0, 'INBUILT_LITE', expiryDate]
            );
            limit = starterLimit;
        }

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
