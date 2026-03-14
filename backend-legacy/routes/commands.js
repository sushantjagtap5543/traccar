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

    // Verify ownership using our local vehicles table
    const ownership = await pool.query("SELECT id FROM vehicles WHERE id = $1 AND user_id = $2", [deviceId, userId]);
    if (ownership.rowCount === 0 && req.user.role !== 'admin') {
        return next(new AppError('FORBIDDEN', 'Device does not belong to user', 403));
    }

    try {
        const response = await axios.post(`${TRACCAR_URL}/api/commands/send`, {
            deviceId, type, attributes: attributes || {}
        }, { headers: { 'Cookie': req.headers.cookie } });

        await pool.query(
            "INSERT INTO command_logs (vehicle_id, type, status, result) VALUES ($1, $2, $3, $4)",
            [deviceId, type, 'sent', JSON.stringify(attributes || {})]
        );

        res.json(response.data);
    } catch (err) {
        res.status(err.response?.status || 502).json(err.response?.data || { error: 'Failed to send command' });
    }
}));

module.exports = router;
