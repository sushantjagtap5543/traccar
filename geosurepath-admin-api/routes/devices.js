const express = require('express');
const router = express.Router();
const axios = require('axios');
const { checkDeviceLimit } = require('../middleware/subscription');
const { logger } = require('../services/db');

const TRACCAR_URL = process.env.TRACCAR_INTERNAL_URL || 'http://traccar:8082';

/**
 * Shielded Device Management
 * Intercepts device creation to enforce subscription limits.
 */

// 1. Create Device with Limit Check
router.post('/devices', checkDeviceLimit, async (req, res) => {
    try {
        logger.info(`Proxying device creation for user ${req.traccarUser?.id}`);

        const response = await axios.post(`${TRACCAR_URL}/api/devices`, req.body, {
            headers: {
                'Cookie': req.headers.cookie,
                'Content-Type': 'application/json'
            }
        });

        res.status(response.status).json(response.data);
    } catch (err) {
        logger.error('Proxy Device Creation Error:', err.message);
        const status = err.response?.status || 500;
        const data = err.response?.data || { error: 'Failed to communicate with tracking engine' };
        res.status(status).json(data);
    }
});

// 2. Pass-through for other methods if needed, or just let Nginx handle them
// For now, we only need to secure POST /devices

module.exports = router;
