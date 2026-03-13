const express = require('express');
const router = express.Router();
const { pool, logger } = require('../services/db');
const { adminAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { AppError } = require('../utils/errors');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

/**
 * Enterprise Reporting API
 * Provides high-level fleet analytics for SaaS administrators.
 */

// 1. Trip Summary Report (Grouped by Device)
router.get('/trip-summary', adminAuth, validate(schemas.reportFilter, 'query'), asyncHandler(async (req, res, next) => {
    const { from, to, deviceId } = req.query;

    let query = `
        SELECT 
            deviceid,
            COUNT(*) as trip_count,
            SUM(distance) / 1000 as total_distance_km,
            SUM(duration) / 3600000 as total_duration_hours,
            MAX(maxspeed) * 1.852 as max_speed_kph,
            AVG(averagespeed) * 1.852 as avg_speed_kph
        FROM tc_reports_trips
        WHERE starttime >= $1 AND endtime <= $2
    `;
    const params = [from, to];

    if (deviceId) {
        query += " AND deviceid = $3";
        params.push(deviceId);
    }

    query += " GROUP BY deviceid";

    const result = await pool.query(query, params);
    
    // Enrich with device names
    const deviceRes = await pool.query("SELECT id, name FROM tc_devices");
    const deviceMap = new Map(deviceRes.rows.map(d => [d.id, d.name]));

    const enriched = result.rows.map(row => ({
        ...row,
        deviceName: deviceMap.get(row.deviceid) || `Device ${row.deviceid}`,
        total_distance_km: parseFloat(parseFloat(row.total_distance_km).toFixed(2)),
        total_duration_hours: parseFloat(parseFloat(row.total_duration_hours).toFixed(2)),
        max_speed_kph: parseFloat(parseFloat(row.max_speed_kph).toFixed(2)),
        avg_speed_kph: parseFloat(parseFloat(row.avg_speed_kph).toFixed(2))
    }));

    res.json(enriched);
}));

// 2. Idle Time Analysis
router.get('/idle-analysis', adminAuth, validate(schemas.reportFilter, 'query'), asyncHandler(async (req, res, next) => {
    const { from, to, deviceId } = req.query;

    let query = `
        SELECT 
            deviceid,
            COUNT(*) as idle_incidents,
            SUM(duration) / 60000 as total_idle_minutes,
            MAX(duration) / 60000 as longest_idle_minutes
        FROM tc_reports_stops
        WHERE starttime >= $1 AND endtime <= $2
    `;
    const params = [from, to];

    if (deviceId) {
        query += " AND deviceid = $3";
        params.push(deviceId);
    }

    query += " GROUP BY deviceid";

    const result = await pool.query(query, params);
    
    const deviceRes = await pool.query("SELECT id, name FROM tc_devices");
    const deviceMap = new Map(deviceRes.rows.map(d => [d.id, d.name]));

    const enriched = result.rows.map(row => ({
        ...row,
        deviceName: deviceMap.get(row.deviceid) || `Device ${row.deviceid}`,
        total_idle_minutes: Math.round(row.total_idle_minutes),
        longest_idle_minutes: Math.round(row.longest_idle_minutes)
    }));

    res.json(enriched);
}));

module.exports = router;
