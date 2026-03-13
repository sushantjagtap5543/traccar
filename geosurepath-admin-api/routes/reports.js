const express = require('express');
const router = express.Router();
const { pool, logger } = require('../services/db');
const { adminAuth } = require('../middleware/auth');
const { tenantIsolation } = require('../middleware/tenant');
const { asyncHandler } = require('../middleware/errorHandler');
const { AppError } = require('../utils/errors');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

/**
 * Enterprise & Client Reporting API (C-012)
 * Provides high-level fleet analytics with Role-Based Access Control.
 */

// Global middleware to handle both role types
const authProxy = (req, res, next) => {
    // If adminToken exists, use adminAuth, else use tenantIsolation
    if (req.cookies.adminToken || req.headers['x-api-key']) {
        return adminAuth(req, res, next);
    }
    return tenantIsolation(req, res, next);
};

// 1. Trip Summary Report
router.get('/trip-summary', authProxy, validate(schemas.reportFilter, 'query'), asyncHandler(async (req, res, next) => {
    const { from, to, deviceId } = req.query;
    const userId = req.traccarUser?.id;
    const isAdmin = !!req.admin;

    // Security Verification: If not admin, ensure requested device belongs to user
    if (!isAdmin && deviceId) {
        const ownership = await pool.query("SELECT 1 FROM tc_user_device WHERE userid = $1 AND deviceid = $2", [userId, deviceId]);
        if (ownership.rowCount === 0) return next(new AppError('UNAUTHORIZED', 'Unauthorized device access', 403));
    }

    let query = `
        SELECT 
            r.deviceid,
            COUNT(*) as trip_count,
            SUM(r.distance) / 1000 as total_distance_km,
            SUM(r.duration) / 3600000 as total_duration_hours,
            MAX(r.maxspeed) * 1.852 as max_speed_kph,
            AVG(r.averagespeed) * 1.852 as avg_speed_kph
        FROM tc_reports_trips r
    `;

    const params = [from, to];

    // Join with tc_user_device if not admin to enforce isolation
    if (!isAdmin) {
        query += " JOIN tc_user_device ud ON r.deviceid = ud.deviceid AND ud.userid = $3";
        params.push(userId);
    }

    query += " WHERE r.starttime >= $1 AND r.endtime <= $2";
    
    if (deviceId) {
        query += ` AND r.deviceid = $${params.length + 1}`;
        params.push(deviceId);
    }

    query += " GROUP BY r.deviceid";

    const result = await pool.query(query, params);
    
    // Fetch relevant names
    let deviceNamesQuery = isAdmin ? "SELECT id, name FROM tc_devices" : "SELECT d.id, d.name FROM tc_devices d JOIN tc_user_device ud ON d.id = ud.deviceid WHERE ud.userid = $1";
    const deviceRes = await pool.query(deviceNamesQuery, isAdmin ? [] : [userId]);
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
router.get('/idle-analysis', authProxy, validate(schemas.reportFilter, 'query'), asyncHandler(async (req, res, next) => {
    const { from, to, deviceId } = req.query;
    const userId = req.traccarUser?.id;
    const isAdmin = !!req.admin;

    if (!isAdmin && deviceId) {
        const ownership = await pool.query("SELECT 1 FROM tc_user_device WHERE userid = $1 AND deviceid = $2", [userId, deviceId]);
        if (ownership.rowCount === 0) return next(new AppError('UNAUTHORIZED', 'Unauthorized device access', 403));
    }

    let query = `
        SELECT 
            r.deviceid,
            COUNT(*) as idle_incidents,
            SUM(r.duration) / 60000 as total_idle_minutes,
            MAX(r.duration) / 60000 as longest_idle_minutes
        FROM tc_reports_stops r
    `;
    const params = [from, to];

    if (!isAdmin) {
        query += " JOIN tc_user_device ud ON r.deviceid = ud.deviceid AND ud.userid = $3";
        params.push(userId);
    }

    query += " WHERE r.starttime >= $1 AND r.endtime <= $2";

    if (deviceId) {
        query += ` AND r.deviceid = $${params.length + 1}`;
        params.push(deviceId);
    }

    query += " GROUP BY r.deviceid";

    const result = await pool.query(query, params);
    
    let deviceNamesQuery = isAdmin ? "SELECT id, name FROM tc_devices" : "SELECT d.id, d.name FROM tc_devices d JOIN tc_user_device ud ON d.id = ud.deviceid WHERE ud.userid = $1";
    const deviceRes = await pool.query(deviceNamesQuery, isAdmin ? [] : [userId]);
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
