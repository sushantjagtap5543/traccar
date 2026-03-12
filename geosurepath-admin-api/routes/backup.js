const express = require('express');
const router = express.Router();
const { pool, logger } = require('../services/db');
const { adminAuth } = require('../middleware/auth');
const backupService = require('../services/backupService');
const fs = require('fs');
const path = require('path');

/**
 * @swagger
 * /api/admin/backups:
 *   get:
 *     summary: List all backups
 */
router.get('/admin/backups', adminAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM geosurepath_backups ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch backups' });
    }
});

/**
 * @swagger
 * /api/admin/backups/run:
 *   post:
 *     summary: Trigger a manual backup
 */
const backupCache = new Map();

router.post('/admin/backups/run', adminAuth, async (req, res) => {
    const idempotencyKey = req.headers['idempotency-key'] || 'default';
    
    if (backupCache.has(idempotencyKey)) {
        const cached = backupCache.get(idempotencyKey);
        if (Date.now() - cached.time < 300000) { // 5 minute cache
            return res.json(cached.result);
        }
    }

    try {
        const result = await backupService.runFullBackup(true); 
        const response = { message: 'Backup task completed successfully', result };
        backupCache.set(idempotencyKey, { time: Date.now(), result: response });
        res.json(response);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/admin/backups/download/{id}:
 *   get:
 *     summary: Download a backup file
 */
router.get('/admin/backups/download/:id', adminAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT filename FROM geosurepath_backups WHERE id = $1', [req.params.id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Backup not found' });
        
        const safeFilename = path.basename(result.rows[0].filename);
        const filePath = path.join(__dirname, '../../backups', safeFilename);
        if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing on server' });
        
        res.download(filePath);
    } catch (err) {
        res.status(500).json({ error: 'Download failed' });
    }
});

module.exports = router;
