const express = require('express');
const router = express.Router();
const { pool, logger } = require('../services/db');
const { asyncHandler } = require('../middleware/errorHandler');

router.get('/health', asyncHandler(async (req, res) => {
    res.json({ status: 'UP', services: { db: 'UP', redis: 'UP' } });
}));

router.get('/settings', asyncHandler(async (req, res) => {
    const result = await pool.query("SELECT * FROM geosurepath_settings");
    res.json(result.rows);
}));

module.exports = router;
