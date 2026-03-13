const { pool, logger } = require('../services/db');
const axios = require('axios');

const TRACCAR_URL = process.env.TRACCAR_INTERNAL_URL || 'http://traccar:8082';

/**
 * Tenant Isolation Middleware
 * Ensures that the request is strictly bound to the user's client_id.
 * Attaches client_id to the request object.
 */
const tenantIsolation = async (req, res, next) => {
    try {
        // 1. Check if user is already identified (e.g., from checkDeviceLimit)
        if (req.traccarUser) {
            req.clientId = req.traccarUser.clientId || null;
            if (req.clientId) return next();
        }

        // 2. Identify User from session cookie if not already identified
        const cookie = req.headers.cookie;
        if (!cookie) {
            // Check if it's an admin bypass (optional, if we want admins to see everything)
            if (req.admin) return next();
            return res.status(401).json({ error: 'Authentication required' });
        }

        const sessionRes = await axios.get(`${TRACCAR_URL}/api/session`, {
            headers: { Cookie: cookie }
        });
        const user = sessionRes.data;
        if (!user || !user.id) return res.status(401).json({ error: 'Invalid session' });

        // 3. Fetch Client ID from isolated metadata (Fix for BUG-010)
        const userRes = await pool.query(
            "SELECT client_id FROM geosurepath_user_metadata WHERE user_id = $1",
            [user.id]
        );

        if (userRes.rowCount > 0 && userRes.rows[0].client_id) {
            req.clientId = userRes.rows[0].client_id;
        } else {
            // Default: User ID is their own client_id if not explicitly grouped
            // This ensures every user is isolated even if they don't have a specific client_id
            req.clientId = user.id; 
        }

        req.traccarUser = user;
        next();
    } catch (err) {
        logger.error('Tenant Isolation Error:', err.message);
        res.status(500).json({ error: 'Security verification failed' });
    }
};

module.exports = { tenantIsolation };
