const express = require('express');
const router = express.Router();
const axios = require('axios');
const { checkDeviceLimit } = require('../middleware/subscription');
const { tenantIsolation } = require('../middleware/tenant');
const { logger } = require('../services/db');

const TRACCAR_URL = process.env.TRACCAR_INTERNAL_URL || 'http://traccar:8082';

/**
 * @openapi
 * components:
 *   schemas:
 *     Device:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         name: { type: string }
 *         uniqueId: { type: string, description: "IMEI/Serial" }
 *         status: { type: string }
 */

/**
 * @openapi
 * /api/devices:
 *   post:
 *     summary: Create Device
 *     description: Registers a new device with subscription limit enforcement.
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Device' }
 *     responses:
 *       201:
 *         description: Created
 *       403:
 *         description: Limit Exceeded
 */

const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');
const { asyncHandler } = require('../middleware/errorHandler');
const { AppError } = require('../utils/errors');

// 1. Create Device with Limit Check
router.post('/devices', tenantIsolation, checkDeviceLimit, validate(schemas.createDevice), asyncHandler(async (req, res) => {
    logger.info(`Proxying device creation for user ${req.traccarUser?.id}`);

    try {
        const response = await axios.post(`${TRACCAR_URL}/api/devices`, req.body, {
            headers: {
                'Cookie': req.headers.cookie,
                'Content-Type': 'application/json'
            }
        });
        res.status(response.status).json(response.data);
    } catch (err) {
        const status = err.response?.status || 502;
        const data = err.response?.data || { error: 'Failed to communicate with tracking engine' };
        res.status(status).json(data);
    }
}));

// 2. Bulk Delete
router.post('/devices/bulk-delete', tenantIsolation, validate(schemas.bulkAction), asyncHandler(async (req, res) => {
    const { ids } = req.body;
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
}));

// 3. Bulk Update
router.post('/devices/bulk-update', tenantIsolation, validate(schemas.bulkAction), asyncHandler(async (req, res) => {
    const { ids, updates } = req.body;
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
}));

// 4. Bulk Import (WF-003)
router.post('/devices/bulk-import', tenantIsolation, checkDeviceLimit, asyncHandler(async (req, res, next) => {
    const { devices } = req.body; // Expects array of objects
    if (!Array.isArray(devices)) return next(new AppError('INVALID_INPUT', 'Expected an array of devices', 400));
    
    const results = { success: [], failed: [] };
    
    for (const dev of devices) {
        try {
            // Validate individual record
            const { error } = schemas.createDevice.validate(dev);
            if (error) {
                results.failed.push({ uniqueId: dev.uniqueId, error: error.details[0].message });
                continue;
            }

            const response = await axios.post(`${TRACCAR_URL}/api/devices`, dev, {
                headers: {
                    'Cookie': req.headers.cookie,
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });
            results.success.push({ id: response.data.id, uniqueId: dev.uniqueId });
        } catch (err) {
            results.failed.push({ uniqueId: dev.uniqueId, error: err.response?.data || err.message });
        }
    }

    logger.info(`Bulk import completed: ${results.success.length} success, ${results.failed.length} failed`);
    res.json(results);
}));

/**
 * @openapi
 * /api/devices/{id}/optimize:
 *   post:
 *     summary: GPS Frequency Optimization (WF-002)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mode: { type: string, enum: [economy, standard, ultra-fine] }
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/devices/:id/optimize', tenantIsolation, asyncHandler(async (req, res, next) => {
    const { mode } = req.body; // 'economy', 'standard', 'ultra-fine'
    
    let attributes = {};
    switch (mode) {
        case 'economy':
            attributes = { 'processing.copyAttributes': 'true', 'minInterval': 300 }; // 5 mins
            break;
        case 'standard':
            attributes = { 'processing.copyAttributes': 'true', 'minInterval': 60 }; // 1 min
            break;
        case 'ultra-fine':
            attributes = { 'processing.copyAttributes': 'true', 'minInterval': 5 }; // 5 secs
            break;
        default:
            return next(new AppError('INVALID_MODE', 'Invalid optimization mode', 400));
    }

    try {
        const response = await axios.put(`${TRACCAR_URL}/api/devices/${req.params.id}`, {
            id: req.params.id,
            attributes: { ...attributes }
        }, {
            headers: { 'Cookie': req.headers.cookie }
        });
        res.json({ success: true, mode, activeAttributes: response.data.attributes });
    } catch (err) {
        throw new AppError('OPTIMIZATION_FAILED', `Failed to apply optimization: ${err.message}`, 502);
    }
}));

module.exports = router;
