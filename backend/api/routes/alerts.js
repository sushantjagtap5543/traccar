const express = require('express');
const router = express.Router();
const { pool, logger } = require('../services/db');
const { asyncHandler } = require('../middleware/errorHandler');

router.get('/alerts', asyncHandler(async (req, res) => {
    const result = await pool.query("SELECT * FROM geosurepath_alerts ORDER BY created_at DESC LIMIT 100");
    res.json(result.rows);
}));

module.exports = router;
