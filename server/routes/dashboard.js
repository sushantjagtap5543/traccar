const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/kpi', async (req, res) => {
    try {
        const totalDevices = await db.query('SELECT COUNT(*) FROM devices');
        const activeDevices = await db.query("SELECT COUNT(*) FROM devices WHERE last_seen > NOW() - INTERVAL '5 MINUTES'");
        const tripsToday = await db.query("SELECT COUNT(*) FROM trips WHERE created_at::date = CURRENT_DATE");

        res.json({
            totalDevices: parseInt(totalDevices.rows[0].count),
            activeDevices: parseInt(activeDevices.rows[0].count),
            tripsToday: parseInt(tripsToday.rows[0].count)
        });
    } catch (err) {
        console.error('KPI Dashboard fetch error:', err);
        res.status(500).json({ message: 'Error fetching KPI data' });
    }
});

module.exports = router;
