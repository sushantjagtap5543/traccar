const si = require('systeminformation');
const axios = require('axios');
const { pool, logger } = require('./db');

let ALERT_WEBHOOK = process.env.ALERT_WEBHOOK || '';
const BACKGROUND_MONITOR_INTERVAL = 60000;

const sendAlert = async (title, message, severity = 'WARNING', deviceId = 'infra') => {
    const { redisClient } = require('./db');
    const alertKey = `alert_cooldown:${title}:${deviceId}`;

    // Cooldown: 15 minutes for the same alert type/device
    try {
        const onCooldown = await redisClient.get(alertKey);
        if (onCooldown) {
            logger.info(`Alert ${title} for ${deviceId} silenced (on cooldown).`);
            return;
        }
    } catch (err) {
        logger.error('Redis Cooldown check failed:', err.message);
    }

    logger.warn(`ALERT [${severity}]: ${title} - ${message}`);
    if (!ALERT_WEBHOOK) return;

    try {
        await axios.post(ALERT_WEBHOOK, {
            content: `🚨 **GS-INFRA ALERT [${severity}]**\n**${title}**: ${message}\nTime: ${new Date().toISOString()}`
        });
        // Set cooldown for 15 minutes
        await redisClient.set(alertKey, '1', { EX: 900 });
    } catch (err) {
        logger.error('Failed to dispatch alert webhook:', err.message);
    }
};

const syncWebhook = async () => {
    try {
        const res = await pool.query("SELECT value FROM geosurepath_settings WHERE key = 'alert_webhook' LIMIT 1");
        if (res.rowCount > 0 && res.rows[0].value) {
            ALERT_WEBHOOK = res.rows[0].value;
            logger.info('Alert Webhook synchronized from DB.');
        }
    } catch (err) {
        logger.error('Failed to sync ALERT_WEBHOOK from DB:', err.message);
    }
};

const startMonitor = () => {
    if (process.env.NODE_ENV === 'test') return;

    // Load webhook immediately on startup
    syncWebhook();

    setInterval(async () => {
        try {
            const cpu = await si.currentLoad();
            const mem = await si.mem();
            const ramPercent = (mem.active / mem.total) * 100;

            if (cpu.currentLoad > 90) {
                await sendAlert('CRITICAL_CPU', `CPU Load reached ${cpu.currentLoad.toFixed(2)}%`, 'CRITICAL');
            }

            if (ramPercent > 90) {
                await sendAlert('CRITICAL_RAM', `Memory usage reached ${ramPercent.toFixed(2)}%`, 'CRITICAL');
            }

            const disks = await si.fsSize();
            const rootDisk = disks.find(d => d.mount === '/') || disks[0];
            if (rootDisk && rootDisk.use > 85) {
                await sendAlert('CRITICAL_DISK', `Disk usage reached ${rootDisk.use.toFixed(2)}% on ${rootDisk.mount}`, 'CRITICAL');
            }

            // Sync ALERT_WEBHOOK from DB
            await syncWebhook();

            try {
                await pool.query('SELECT 1');
            } catch (err) {
                await sendAlert('DATABASE_OFFLINE', 'The SQL engine is unreachable. Disaster recovery required.', 'EMERGENCY');
            }
        } catch (err) {
            logger.error('Background Monitor Error:', err.message);
        }
    }, BACKGROUND_MONITOR_INTERVAL);
};

module.exports = { startMonitor, sendAlert };
