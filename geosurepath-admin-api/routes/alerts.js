const express = require('express');
const router = express.Router();
const { pool, redisClient } = require('../services/db');
const { authenticateJWT } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { AppError } = require('../utils/errors');

/**
 * Handle Client Alert Configuration
 * Bypasses Traccar's admin-only restriction (C-007)
 */
router.get('/client-config', authenticateJWT, asyncHandler(async (req, res) => {
    const userId = req.user.id || req.user.userId;
    
    // Check for user-specific config
    const userRes = await pool.query(
        "SELECT value FROM geosurepath_settings WHERE key = $1 AND user_id = $2",
        ['alert_config', userId]
    );

    if (userRes.rowCount > 0) {
        return res.json(JSON.parse(userRes.rows[0].value));
    }

    // Fallback to global config
    const globalRes = await pool.query(
        "SELECT value FROM geosurepath_settings WHERE key = 'global_alert_config'"
    );
    
    const config = globalRes.rowCount > 0 ? JSON.parse(globalRes.rows[0].value) : {};
    res.json(config);
}));

router.post('/client-config', authenticateJWT, asyncHandler(async (req, res) => {
    const userId = req.user.id || req.user.userId;
    const config = req.body;

    await pool.query(
        `INSERT INTO geosurepath_settings (key, value, user_id, updated_at) 
         VALUES ('alert_config', $1, $2, NOW())
         ON CONFLICT (key, user_id) DO UPDATE SET value = $1, updated_at = NOW()`,
        [JSON.stringify(config), userId]
    );

    // Invalidate Redis cache if used (BUG-019 compatibility)
    await redisClient.del(`alert_config:${userId}`);

    res.json({ success: true, message: 'Alert configuration saved' });
}));

module.exports = router;
