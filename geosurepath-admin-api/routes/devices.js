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

// 2. Bulk Delete
router.post('/devices/bulk-delete', async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'IDs array required' });

    try {
        const results = [];
        for (const id of ids) {
            try {
                await axios.delete(`${TRACCAR_URL}/api/devices/${id}`, {
                    headers: { 'Cookie': req.headers.cookie }
                });
                results.push({ id, status: 'deleted' });
            } catch (err) {
                results.push({ id, status: 'failed', error: err.message });
            }
        }
        res.json({ results });
    } catch (err) {
        res.status(500).json({ error: 'Bulk delete failed' });
    }
});

// 3. Bulk Update
router.post('/devices/bulk-update', async (req, res) => {
    const { ids, updates } = req.body;
    if (!Array.isArray(ids) || !updates) return res.status(400).json({ error: 'IDs array and updates object required' });

    try {
        const results = [];
        for (const id of ids) {
            try {
                await axios.put(`${TRACCAR_URL}/api/devices/${id}`, { ...updates, id }, {
                    headers: { 'Cookie': req.headers.cookie }
                });
                results.push({ id, status: 'updated' });
            } catch (err) {
                results.push({ id, status: 'failed', error: err.message });
            }
        }
        res.json({ results });
    } catch (err) {
        res.status(500).json({ error: 'Bulk update failed' });
    }
});

module.exports = router;
