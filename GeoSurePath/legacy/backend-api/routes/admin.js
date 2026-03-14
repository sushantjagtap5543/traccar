const express = require('express');
const router = express.Router();
const { pool, logger } = require('../services/db');
const { asyncHandler } = require('../middleware/errorHandler');

router.get('/stats', authenticateToken, isAdmin, asyncHandler(async (req, res) => {
    const userCount = await pool.query('SELECT COUNT(*) FROM users WHERE role = \'user\'');
    const vehicleCount = await pool.query('SELECT COUNT(*) FROM vehicles');
    const activeSubs = await pool.query('SELECT COUNT(*) FROM subscriptions WHERE status = \'active\' AND end_date > NOW()');
    
    // Simple revenue calculation (mocked as total sub count * average price for now or specific query)
    const revenue = await pool.query('SELECT COUNT(*) * 1500 as total FROM subscriptions WHERE status = \'active\'');

    res.json({
        totalUsers: parseInt(userCount.rows[0].count),
        totalVehicles: parseInt(vehicleCount.rows[0].count),
        activeSubscriptions: parseInt(activeSubs.rows[0].count),
        estimatedRevenue: parseInt(revenue.rows[0].total)
    });
}));

router.get('/health', authenticateToken, isAdmin, asyncHandler(async (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date() });
}));

router.get('/settings', asyncHandler(async (req, res) => {
    const result = await pool.query("SELECT * FROM geosurepath_settings");
    res.json(result.rows);
}));

module.exports = router;
