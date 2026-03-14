const express = require('express');
const router = express.Router();
const axios = require('axios');
const { pool, logger } = require('../services/db');
const { authenticateJWT } = require('../middleware/auth');
const { tenantIsolation } = require('../middleware/tenant');
const { asyncHandler } = require('../middleware/errorHandler');
const { AppError } = require('../utils/errors');

const TRACCAR_URL = process.env.TRACCAR_INTERNAL_URL || 'http://traccar:8082';

router.post('/commands/send', authenticateJWT, tenantIsolation, asyncHandler(async (req, res, next) => {
    const { deviceId, type, attributes } = req.body;
    const userId = req.user.id;

    // Verify ownership
    const ownership = await pool.query("SELECT 1 FROM tc_user_device WHERE userid = $1 AND deviceid = $2", [userId, deviceId]);
    if (ownership.rowCount === 0 && req.user.role !== 'admin') {
        return next(new AppError('FORBIDDEN', 'Device does not belong to user', 403));
    }

    try {
        const response = await axios.post(`${TRACCAR_URL}/api/commands/send`, {
            deviceId, type, attributes: attributes || {}
        }, { headers: { 'Cookie': req.headers.cookie } });

        await pool.query(
            "INSERT INTO geosurepath_commands (user_id, device_id, type, attributes, status) VALUES ($1, $2, $3, $4, $5)",
            [userId, deviceId, type, JSON.stringify(attributes || {}), 'sent']
        );

        res.json(response.data);
    } catch (err) {
        res.status(err.response?.status || 502).json(err.response?.data || { error: 'Failed to send command' });
    }
}));

module.exports = router;
