const express = require('express');
const router = express.Router();
const { pool, logger } = require('../services/db');
const { adminAuth } = require('../middleware/auth');
const migrationService = require('../services/migrationService');

/**
 * @swagger
 * /api/admin/migrations:
 *   get:
 *     summary: List migration history
 */
router.get('/admin/migrations', adminAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM geosurepath_migration_jobs ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch migrations' });
    }
});

/**
 * @swagger
 * /api/admin/migrations/run:
 *   post:
 *     summary: Start a new migration
 */
router.post('/admin/migrations/run', adminAuth, async (req, res) => {
    const { host, port, username, password, privateKey, targetDir } = req.body;
    
    if (!host || !username || !targetDir) {
        return res.status(400).json({ error: 'Missing mandatory server details' });
    }

    try {
        const insertRes = await pool.query(
            'INSERT INTO geosurepath_migration_jobs (destination_ip, status) VALUES ($1, $2) RETURNING id',
            [host, 'pending']
        );
        const jobId = insertRes.rows[0].id;
        
        // Start async
        migrationService.initiateMigration(jobId, { host, port, username, password, privateKey, targetDir });
        
        res.json({ message: 'Migration sequence initiated', jobId });
    } catch (err) {
        res.status(500).json({ error: 'Failed to start migration: ' + err.message });
    }
});

module.exports = router;
