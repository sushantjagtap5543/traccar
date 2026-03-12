const express = require('express');
const router = express.Router();
const si = require('systeminformation');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const Joi = require('joi');
const { pool, redisClient, logger } = require('../services/db');
const { adminAuth } = require('../middleware/auth');

const restartSchema = Joi.object({
    service: Joi.string().valid('traccar', 'database', 'backend', 'cache').required()
});

let ALERT_WEBHOOK = process.env.ALERT_WEBHOOK || '';

// --- ADMIN DASHBOARD DATA ---
router.get('/admin/health', adminAuth, async (req, res) => {
    try {
        const cpu = await si.currentLoad();
        const mem = await si.mem();
        const disk = await si.fsSize();
        const network = await si.networkStats();

        const start = Date.now();
        let dbStatus = 'OFFLINE';
        let dbLatency = 0;
        let dbSize = 'Unknown';
        try {
            const dbRes = await pool.query('SELECT pg_size_pretty(pg_database_size(current_database())) as size');
            if (dbRes.rowCount === 1) {
                dbStatus = 'ONLINE';
                dbLatency = Date.now() - start;
                dbSize = dbRes.rows[0].size;
            }
        } catch (err) {
            logger.error('Database Health Check Failed:', err);
        }

        let redisStatus = 'OFFLINE';
        try {
            const ping = await redisClient.ping();
            if (ping === 'PONG') redisStatus = 'ONLINE';
        } catch (err) {
            logger.error('Redis Health Check Failed:', err);
        }

        res.json({
            cpu: cpu.currentLoad.toFixed(2),
            ram: {
                total: mem.total,
                used: mem.active,
                percent: ((mem.active / mem.total) * 100).toFixed(2)
            },
            disk: disk.map(d => ({
                fs: d.fs,
                size: d.size,
                used: d.used,
                percent: d.use,
                mount: d.mount
            })),
            network: network.length > 0 ? {
                rx: (network[0].rx_sec / 1024).toFixed(2),
                tx: (network[0].tx_sec / 1024).toFixed(2)
            } : { rx: 0, tx: 0 },
            database: { status: dbStatus, latency: dbLatency, storage: dbSize },
            cache: { status: redisStatus },
            uptime: { process: Math.floor(process.uptime()), system: si.time().uptime },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('System Info Error:', error);
        res.status(500).json({ error: 'Failed to retrieve system health' });
    }
});

router.get('/admin/logs', adminAuth, (req, res) => {
    const logDir = process.env.LOG_DIR || path.join(__dirname, '../logs');
    const logPath = path.join(logDir, 'combined.log'); // Or use the rotated log correctly

    // For this simplified refactor, we'll try combined first, or fallback to the latest application file
    if (!fs.existsSync(logPath)) {
        // Find latest rotated log? For now, we'll just check if application log exists
        const files = fs.readdirSync(logDir).filter(f => f.startsWith('application-')).sort().reverse();
        if (files.length === 0) return res.json({ logs: ['No logs found.'] });
        const content = fs.readFileSync(path.join(logDir, files[0]), 'utf8');
        const lines = content.split('\n').filter(Boolean).slice(-100);
        return res.json({ logs: lines.reverse() });
    }

    const logs = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean).slice(-100);
    res.json({ logs: logs.reverse() });
});

router.get('/admin/db/tables', adminAuth, async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT table_name, 
      (xpath('/row/cnt/text()', xml_count))[1]::text::int as row_count
      FROM (
        SELECT table_name, query_to_xml(format('select count(*) as cnt from %I', table_name), false, true, '') as xml_count
        FROM information_schema.tables
        WHERE table_schema = 'public'
      ) t
    `);
        res.json({ tables: result.rows });
    } catch (err) {
        logger.error('DB Tables Error:', err);
        res.status(500).json({ error: 'Failed to fetch table stats' });
    }
});

router.get('/admin/redis/info', adminAuth, async (req, res) => {
    try {
        const info = await redisClient.info();
        res.json({ info });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch Redis info' });
    }
});

router.get('/admin/uptime', adminAuth, (req, res) => {
    const processUptime = Math.floor(process.uptime());
    const systemUptime = si.time().uptime;

    const format = (seconds) => {
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor(seconds % (3600 * 24) / 3600);
        const m = Math.floor(seconds % 3600 / 60);
        const s = Math.floor(seconds % 60);
        return `${d}d ${h}h ${m}m ${s}s`;
    };

    res.json({
        process: { uptime: processUptime, formatted: format(processUptime) },
        system: { uptime: systemUptime, formatted: format(systemUptime) }
    });
});

router.post('/admin/backup', adminAuth, (req, res) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql`;
    const backupDir = process.env.BACKUP_DIR || path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    const filePath = path.join(backupDir, filename);

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return res.status(500).json({ error: 'DATABASE_URL not configured' });

    // Retention: Delete files older than 30 days
    const retentionDays = 30;
    const now = Date.now();
    try {
        const files = fs.readdirSync(backupDir);
        files.forEach(file => {
            if (file.startsWith('backup-') && file.endsWith('.sql')) {
                const fullPath = path.join(backupDir, file);
                const stats = fs.statSync(fullPath);
                const ageDays = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);
                if (ageDays > retentionDays) {
                    fs.unlinkSync(fullPath);
                    logger.info(`Retention: Deleted old backup ${file}`);
                }
            }
        });
    } catch (err) {
        logger.error(`Backup retention error: ${err.message}`);
    }

    const cmd = `pg_dump "${dbUrl}" -f "${filePath}"`;
    logger.info(`Starting DB backup: ${filename}`);

    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            logger.error(`Backup failed: ${error.message}`);
            return res.status(500).json({ error: 'Backup failed', details: stderr });
        }
        logger.info(`Backup completed: ${filename}`);
        res.json({ message: 'Backup completed successfully', filename });
    });
});

router.get('/admin/traccar/status', adminAuth, async (req, res) => {
    try {
        const traccarUrl = process.env.TRACCAR_URL || 'http://localhost:8082';
        const response = await axios.get(`${traccarUrl}/api/server`, { timeout: 3000 });
        res.json({ status: 'REACHABLE', version: response.data.version || 'Unknown' });
    } catch (err) {
        res.json({ status: 'UNREACHABLE', error: err.message });
    }
});

router.post('/admin/restart/:service', adminAuth, (req, res) => {
    const { error } = restartSchema.validate(req.params);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { service } = req.params;
    let command = '';
    switch (service) {
        case 'traccar': command = process.platform === 'win32' ? 'net stop traccar && net start traccar' : 'sudo systemctl restart traccar'; break;
        case 'database': command = process.platform === 'win32' ? 'net stop postgresql-x64-15 && net start postgresql-x64-15' : 'sudo systemctl restart postgresql'; break;
        case 'backend': command = 'pm2 restart geosurepath-admin-api'; break;
        case 'cache': command = 'redis-cli flushall'; break;
    }

    logger.info(`Restarting service: ${service} by request of ${req.ip}`);
    exec(command, (error, stdout, stderr) => {
        if (error) {
            logger.error(`Exec Error for ${service}: ${error}`);
            return res.status(500).json({ error: `Failed to restart ${service}` });
        }
        res.json({ message: `Successfully restarted ${service}` });
    });
});

router.post('/admin/alerts/config', adminAuth, (req, res) => {
    const { webhookUrl } = req.body;
    if (!webhookUrl || !webhookUrl.startsWith('http')) {
        return res.status(400).json({ error: 'Invalid webhook URL' });
    }
    ALERT_WEBHOOK = webhookUrl;
    logger.info(`Emergency webhook configured: ${webhookUrl}`);
    res.json({ message: 'Alerting system updated.', url: ALERT_WEBHOOK });
});

module.exports = router;
