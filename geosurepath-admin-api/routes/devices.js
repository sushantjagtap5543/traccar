const express = require('express');
const router = express.Router();
const axios = require('axios');
const { checkDeviceLimit } = require('../middleware/subscription');
const { tenantIsolation } = require('../middleware/tenant');
const { logger } = require('../services/db');

const TRACCAR_URL = process.env.TRACCAR_INTERNAL_URL || 'http://traccar:8082';

/**
 * Shielded Device Management
 * Intercepts device creation to enforce subscription limits.
 */

const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

// 1. Create Device with Limit Check
router.post('/devices', tenantIsolation, checkDeviceLimit, validate(schemas.createDevice), async (req, res) => {
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
router.post('/devices/bulk-delete', tenantIsolation, validate(schemas.bulkAction), async (req, res) => {
    const { ids } = req.body;
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
router.post('/devices/bulk-update', tenantIsolation, validate(schemas.bulkAction), async (req, res) => {
    const { ids, updates } = req.body;
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
