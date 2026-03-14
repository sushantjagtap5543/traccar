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

router.get('/devices', authenticateJWT, asyncHandler(async (req, res) => {
    const response = await axios.get(`${TRACCAR_URL}/api/devices`, {
        headers: { 'Cookie': req.headers.cookie }
    });
    res.json(response.data);
}));

module.exports = router;
