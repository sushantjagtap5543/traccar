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

const Joi = require('joi');

// 1. Create Device with Limit Check
router.post('/devices', checkDeviceLimit, async (req, res) => {
    const schema = Joi.object({
        name: Joi.string().required(),
        uniqueId: Joi.string().required(),
        phone: Joi.string().allow('', null).optional(),
        model: Joi.string().allow('', null).optional(),
        contact: Joi.string().allow('', null).optional(),
        category: Joi.string().allow('', null).optional(),
        disabled: Joi.boolean().optional(),
        attributes: Joi.object().optional()
    }).unknown(true);

    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

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
