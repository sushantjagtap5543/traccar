const express = require('express');
const router = express.Router();
const { pool, logger } = require('../services/db');
const { asyncHandler } = require('../middleware/errorHandler');

const { authenticateToken } = require('../middleware/auth');
const { tenantIsolation } = require('../middleware/tenant');

router.get('/alerts', authenticateToken, tenantIsolation, asyncHandler(async (req, res) => {
    // Only fetch alerts for vehicles belonging to this tenant/client
    const result = await pool.query(`
        SELECT a.* FROM alerts a
        JOIN vehicles v ON a.vehicle_id = v.id
        WHERE v.client_id = $1
        ORDER BY a.created_at DESC LIMIT 100
    `, [req.user.client_id]);
    res.json(result.rows);
}));

module.exports = router;
