const express = require('express');
const router = express.Router();
const axios = require('axios');
const { pool, logger } = require('../services/db');
const { authenticateJWT } = require('../middleware/auth');
const { checkDeviceLimit } = require('../middleware/subscription');
const { asyncHandler } = require('../middleware/errorHandler');

const TRACCAR_URL = process.env.TRACCAR_INTERNAL_URL || 'http://traccar:8082';

router.post('/devices', authenticateJWT, checkDeviceLimit, asyncHandler(async (req, res) => {
    const response = await axios.post(`${TRACCAR_URL}/api/devices`, req.body, {
        headers: { 'Cookie': req.headers.cookie }
    });
    res.json(response.data);
}));

const { provisionDefaultSubscription } = require('../services/subscriptionService');

router.post('/', authenticateJWT, asyncHandler(async (req, res) => { // Changed authenticateToken to authenticateJWT and added asyncHandler
    const { name, uniqueId } = req.body;
    
    // 1. Create in database
    const result = await pool.query(
        'INSERT INTO vehicles (name, imei, user_id) VALUES ($1, $2, $3) RETURNING *',
        [name, uniqueId, req.user.id]
    );
    
    // 2. Provision 12-month subscription automatically
    await provisionDefaultSubscription(uniqueId);
    
    res.status(201).json(result.rows[0]);
}));

router.get('/devices', authenticateJWT, asyncHandler(async (req, res) => {
    const response = await axios.get(`${TRACCAR_URL}/api/devices`, {
        headers: { 'Cookie': req.headers.cookie }
    });
    res.json(response.data);
}));

module.exports = router;
