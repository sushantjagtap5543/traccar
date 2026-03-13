const express = require('express');
const router = express.Router();
const { pool, logger } = require('../services/db');
const { adminAuth } = require('../middleware/auth');
const migrationService = require('../services/migrationService');
const { asyncHandler } = require('../middleware/errorHandler');
const { AppError } = require('../utils/errors');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

/**
 * @swagger
 * /api/admin/migrations:
 *   get:
 *     summary: List migration history
 */
router.get('/admin/migrations', adminAuth, asyncHandler(async (req, res) => {
    const result = await pool.query('SELECT * FROM geosurepath_migration_jobs ORDER BY created_at DESC');
    res.json(result.rows);
}));

/**
 * @swagger
 * /api/admin/migrations/run:
 *   post:
 *     summary: Start a new migration
 */
router.post('/admin/migrations/run', adminAuth, validate(schemas.cloudMigrate), asyncHandler(async (req, res, next) => {
    const { host, port, username, password, privateKey, targetDir } = req.body;
    
    const insertRes = await pool.query(
        'INSERT INTO geosurepath_migration_jobs (destination_ip, status) VALUES ($1, $2) RETURNING id',
        [host, 'pending']
    );
    const jobId = insertRes.rows[0].id;
    
    // Start async
    migrationService.initiateMigration(jobId, { host, port, username, password, privateKey, targetDir });
    
    res.json({ message: 'Migration sequence initiated', jobId });
}));

module.exports = router;
