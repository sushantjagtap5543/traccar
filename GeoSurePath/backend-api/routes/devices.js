const express = require('express');
const router = express.Router();
const axios = require('axios');
const { pool, logger } = require('../services/db');
const { authenticateJWT } = require('../middleware/auth');
const { checkDeviceLimit } = require('../middleware/subscription');
const { asyncHandler } = require('../middleware/errorHandler');

const TRACCAR_URL = process.env.TRACCAR_INTERNAL_URL || 'http://traccar:8082';

const { provisionDefaultSubscription } = require('../services/subscriptionService');

router.post('/', authenticateJWT, checkDeviceLimit, asyncHandler(async (req, res) => {
    const { name, uniqueId, model, phone, category } = req.body;

    // 1. Create in Traccar Server
    const traccarResponse = await axios.post(`${TRACCAR_URL}/api/devices`, {
        name, uniqueId, phone, model, category
    }, { headers: { 'Cookie': req.headers.cookie } });

    const traccarDevice = traccarResponse.data;

    // 2. Create in GeoSurePath Database
    const result = await pool.query(
        'INSERT INTO vehicles (name, imei, user_id, traccar_device_id, model, client_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [name, uniqueId, req.user.id, traccarDevice.id, model || 'unknown', req.user.client_id]
    );

    // 3. Provision 12-month subscription automatically
    await provisionDefaultSubscription(uniqueId);

    logger.info(`Device bound: ${name} (${uniqueId}) to User: ${req.user.id}`);

    res.status(201).json({
        success: true,
        device: result.rows[0],
        traccar: traccarDevice
    });
}));

router.post('/devices', (req, res) => res.redirect(307, '/api/devices')); // Backward compatibility

router.get('/', authenticateJWT, asyncHandler(async (req, res) => {
    // Return vehicles belonging to the authenticated client/tenant
    const result = await pool.query(
        'SELECT * FROM vehicles WHERE client_id = $1 ORDER BY created_at DESC',
        [req.user.client_id]
    );
    res.json(result.rows);
}));

router.get('/traccar', authenticateJWT, asyncHandler(async (req, res) => {
    // Fetch directly from Traccar (raw view)
    const response = await axios.get(`${TRACCAR_URL}/api/devices`, {
        headers: { 'Cookie': req.headers.cookie }
    });
    res.json(response.data);
}));

module.exports = router;
