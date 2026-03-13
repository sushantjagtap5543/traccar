const express = require('express');
const router = express.Router();
const si = require('systeminformation');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const Joi = require('joi');
const crypto = require('crypto');
const { pool, redisClient, logger } = require('../services/db');
const { adminAuth } = require('../middleware/auth');

const { encrypt } = require('../utils/crypto');
const { logAudit } = require('../services/auditService');
const { asyncHandler } = require('../middleware/errorHandler');
const { AppError } = require('../utils/errors');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

const restartSchema = Joi.object({
    service: Joi.string().valid('traccar', 'database', 'backend', 'cache').required()
});

let ALERT_WEBHOOK = process.env.ALERT_WEBHOOK || '';

// --- ADMIN DASHBOARD DATA ---
router.get('/admin/health', adminAuth, asyncHandler(async (req, res) => {
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
        uptime: { 
            process: Math.floor(process.uptime()),
            formatted: new Date(process.uptime() * 1000).toISOString().substr(11, 8),
            system: si.time().uptime 
        },
        timestamp: new Date().toISOString()
    });
}));

router.get('/admin/logs', adminAuth, asyncHandler(async (req, res, next) => {
    const logDir = process.env.LOG_DIR || path.join(__dirname, '../logs');
    
    if (!fs.existsSync(logDir)) {
        return res.json({ logs: ['Log directory not found.'] });
    }

    const files = fs.readdirSync(logDir)
        .filter(f => f.startsWith('application-'))
        .sort()
        .reverse();

    if (files.length === 0) {
        return res.json({ logs: ['No logs found.'] });
    }

    const content = fs.readFileSync(path.join(logDir, files[0]), 'utf8');
    const lines = content.split('\n').filter(Boolean).slice(-100);
    res.json({ logs: lines.reverse() });
}));

router.get('/admin/db/tables', adminAuth, asyncHandler(async (req, res) => {
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
}));

router.get('/admin/redis/info', adminAuth, asyncHandler(async (req, res) => {
    const info = await redisClient.info();
    res.json({ info });
}));

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

router.post('/admin/backup', adminAuth, asyncHandler(async (req, res) => {
    const backupService = require('../services/backupService');
    const result = await backupService.runFullBackup(true); 
    res.json({ success: true, message: 'Backup completed successfully', result });
}));

// --- MAINTENANCE & DIAGNOSTICS ---

/**
 * Sentry Diagnostics Endpoint (TM-004)
 */
router.get('/admin/debug-sentry', adminAuth, asyncHandler(async (req, res) => {
    logger.info('Sentry diagnostics triggered by administrator');
    // Throw a controlled error so Sentry captures it; asyncHandler routes it to errorHandler gracefully
    throw new Error('GeoSurePath Sentry Diagnostic: Protocol Verification Successful');
}));

/**
 * Health Check (Internal detailed)
 */
router.get('/admin/health/traccar', adminAuth, asyncHandler(async (req, res) => {
    const TRACCAR_URL = process.env.TRACCAR_INTERNAL_URL || 'http://localhost:8082';
    try {
        const response = await axios.get(`${TRACCAR_URL}/api/server`);
        res.json({ status: 'UP', version: response.data.version });
    } catch (err) {
        res.status(503).json({ status: 'DOWN', error: err.message });
    }
}));

router.get('/admin/traccar/status', adminAuth, async (req, res) => {
    try {
        const traccarUrl = process.env.TRACCAR_INTERNAL_URL || 'http://traccar:8082';
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
        case 'traccar': command = process.platform === 'win32' ? 'net stop traccar && net start traccar' : 'echo "Service manager required for containerized Traccar"'; break;
        case 'database': command = process.platform === 'win32' ? 'net stop postgresql-x64-15 && net start postgresql-x64-15' : 'echo "Service manager required for containerized Database"'; break;
        case 'backend': command = 'pm2 restart geosurepath-admin-api'; break;
        case 'cache': command = 'redis-cli flushdb'; break; // Fix for A-008 (NEW-001)
    }

    logger.info(`Restarting service: ${service} by request of ${req.ip}`);
    logAudit('RESTART_SERVICE', service, { success: true }, null, req.ip);
    exec(command, (error, stdout, stderr) => {
        if (error) {
            logger.error(`Exec Error for ${service}: ${error}`);
            return res.status(500).json({ error: `Failed to restart ${service}` });
        }
        res.json({ message: `Successfully restarted ${service}` });
    });
});

router.get('/admin/billing/overview', adminAuth, asyncHandler(async (req, res) => {
    const result = await pool.query(`
        SELECT s.*, u.name as user_name, u.email as user_email 
        FROM geosurepath_subscriptions s 
        LEFT JOIN tc_users u ON s.user_id = u.id 
        ORDER BY s.created_at DESC
    `);
    res.json({ success: true, data: result.rows });
}));

// Record Manual Payment (Admin Only)
router.post('/admin/billing/record-manual', adminAuth, asyncHandler(async (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        planId: Joi.string().required(),
        amount: Joi.number().positive().required(),
        transactionId: Joi.string().optional(),
        months: Joi.number().integer().positive().optional()
    });

    const { error, value } = schema.validate(req.body);
    if (error) return next(new AppError('VALIDATION_ERROR', error.details[0].message, 400));

    const { email, planId, amount, transactionId, months } = value;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Find user by email
        const userRes = await client.query('SELECT id FROM tc_users WHERE email = $1', [email]);
        if (userRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return next(new AppError('NOT_FOUND', 'User not found', 404));
        }
        const userId = userRes.rows[0].id;

        // 2. Determine limits
        const limitRes = await client.query('SELECT value FROM geosurepath_settings WHERE key = $1', [`plan_limit_${planId}`]);
        const deviceLimit = limitRes.rowCount > 0 ? parseInt(limitRes.rows[0].value) : 10;

        // 3. Calculate expiry
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + (parseInt(months) || 12));

        // 4. Insert subscription
        await client.query(
            `INSERT INTO geosurepath_subscriptions 
            (user_id, plan_id, status, device_limit, amount_paid, razorpay_payment_id, expiry_date) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [userId, planId, 'active', deviceLimit, amount, transactionId || 'MANUAL_PAY', expiryDate]
        );

        await client.query('COMMIT');
        logger.info(`Admin recorded manual payment for user ${userId} (${email})`);
        res.json({ message: 'Subscription record successfully updated.' });
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}));

// --- SETTINGS MANAGEMENT ---
router.post('/admin/settings/maintenance', adminAuth, validate(schemas.settingsMaintenance), asyncHandler(async (req, res) => {
    const { enabled } = req.body;
    const val = enabled ? 'true' : 'false';
    await pool.query(
        "INSERT INTO geosurepath_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
        ['maintenance_mode', val]
    );
    await redisClient.set('maintenance_mode', val);
    
    logAudit('TOGGLE_MAINTENANCE', 'system', { enabled }, null, req.ip);
    res.json({ message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`, status: enabled });
}));

router.post('/admin/alerts/rules', adminAuth, validate(schemas.alertRules), asyncHandler(async (req, res) => {
    const { config } = req.body;
    const configJson = JSON.stringify(config);
    await pool.query(
        "INSERT INTO geosurepath_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
        ['alert_rules_config', configJson]
    );
    
    logAudit('UPDATE_ALERT_RULES', 'geosurepath_settings', config, null, req.ip);
    res.json({ message: 'Alert rules updated successfully' });
}));

router.post('/admin/alerts/config', adminAuth, validate(schemas.alertConfig), asyncHandler(async (req, res) => {
    const { webhookUrl } = req.body;
    await pool.query(
        'INSERT INTO geosurepath_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
        ['alert_webhook', webhookUrl]
    );
    ALERT_WEBHOOK = webhookUrl;
    logger.info(`Emergency webhook configured and persisted: ${webhookUrl}`);
    res.json({ message: 'Alerting system updated and saved.', url: ALERT_WEBHOOK });
}));

// --- PLATFORM CONFIGURATION (CENTRAL PANEL) ---
const SENSITIVE_KEYS = [
    'razorpay_secret', 'twilio_auth_token', 'jwt_secret', 'admin_api_key', 
    'traccar_admin_password', 'razorpay_webhook_secret', 'twilio_sid', 'twilio_number',
    'google_drive_client_secret', 'google_drive_refresh_token', 'smtp_password',
    'encryption_key', 'database_url', 'backup_encryption_key'
];

router.get('/admin/config', adminAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT key, value FROM geosurepath_settings');
        const config = {};
        result.rows.forEach(row => {
            if (SENSITIVE_KEYS.includes(row.key)) {
                config[row.key] = '••••••••••••';
            } else {
                config[row.key] = row.value;
            }
        });
        res.json(config);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch platform config' });
    }
});

router.post('/admin/config', adminAuth, async (req, res) => {
    const updates = req.body;
    try {
        for (const [key, value] of Object.entries(updates)) {
            if (SENSITIVE_KEYS.includes(key) && value === '••••••••••••') {
                continue;
            }

            let finalValue = String(value);
            if (SENSITIVE_KEYS.includes(key)) {
                finalValue = encrypt(finalValue);
            }

            await pool.query(
                'INSERT INTO geosurepath_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
                [key, finalValue]
            );
        }
        logger.info('Platform configuration updated securely (encrypted).');
        logAudit('UPDATE_CONFIG', 'geosurepath_settings', updates, null, req.ip);
        res.json({ message: 'Configuration synchronized. Note: Security changes require a server restart.' });
    } catch (err) {
        logger.error('Bulk config error:', err);
        res.status(500).json({ error: 'Failed to update configuration' });
    }
});

module.exports = router;
