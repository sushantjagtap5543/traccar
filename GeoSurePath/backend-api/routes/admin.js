const express = require('express');
const router = express.Router();
const { pool, logger } = require('../services/db');
const { asyncHandler } = require('../middleware/errorHandler');

const { authenticateToken, isAdmin } = require('../middleware/auth');

router.get('/stats', authenticateToken, isAdmin, asyncHandler(async (req, res) => {
    // 1. Client & User Counts
    const clientCount = await pool.query('SELECT COUNT(*) FROM clients');
    const userCount = await pool.query('SELECT COUNT(*) FROM users WHERE role = \'user\'');
    
    // 2. Vehicle Statistics
    const totalVehicles = await pool.query('SELECT COUNT(*) FROM vehicles');
    
    // Vehicles are "online" if telemetry received in the last 5 minutes
    const onlineVehicles = await pool.query(`
        SELECT COUNT(DISTINCT vehicle_id) 
        FROM telemetry 
        WHERE server_time > NOW() - INTERVAL '5 minutes'
    `);
    
    // 3. Alerts & Activity
    const alertsToday = await pool.query('SELECT COUNT(*) FROM alerts WHERE created_at > CURRENT_DATE');
    const activeSubs = await pool.query('SELECT COUNT(*) FROM subscriptions WHERE status = \'active\' AND end_date > NOW()');
    
    // 4. Financials
    const revenue = await pool.query('SELECT COUNT(*) * 1500 as total FROM subscriptions WHERE status = \'active\'');

    res.json({
        totalClients: parseInt(clientCount.rows[0].count),
        totalUsers: parseInt(userCount.rows[0].count),
        totalVehicles: parseInt(totalVehicles.rows[0].count),
        onlineVehicles: parseInt(onlineVehicles.rows[0].count),
        offlineVehicles: parseInt(totalVehicles.rows[0].count) - parseInt(onlineVehicles.rows[0].count),
        alertsToday: parseInt(alertsToday.rows[0].count),
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
