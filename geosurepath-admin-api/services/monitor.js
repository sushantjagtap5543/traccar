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

const DAILY_TASKS_INTERVAL = 24 * 60 * 60 * 1000; // Once a day

const runDailyTasks = async () => {
    logger.info('Running GS-ADMIN Daily Maintenance Tasks...');
    try {
        // 1. Subscription Renewal Reminders (Expiring in 3 days)
        const expiringSubRes = await pool.query(
            "SELECT s.*, u.id as user_actual_id, u.name as user_name FROM geosurepath_subscriptions s JOIN tc_users u ON s.user_id = u.id WHERE s.status = 'active' AND s.expiry_date BETWEEN NOW() AND NOW() + INTERVAL '3 days'"
        );

        for (const sub of expiringSubRes.rows) {
            logger.info(`Sending renewal reminder to ${sub.user_name} (User ${sub.user_actual_id})`);
            // In a real system, send SMS/Email here
            await sendAlert('RENEWAL_REMINDER', `Subscription for ${sub.user_name} expires in 3 days (Plan: ${sub.plan_id}). Renewal required.`, 'INFO', `user_${sub.user_actual_id}`);
        }

        // 2. Auto-deactivate Expired Subscriptions
        const deactivationRes = await pool.query(
            "UPDATE geosurepath_subscriptions SET status = 'expired' WHERE status = 'active' AND expiry_date < NOW()"
        );
        if (deactivationRes.rowCount > 0) {
            logger.info(`Deactivated ${deactivationRes.rowCount} expired subscriptions.`);
        }

        // 3. Clean up old sessions or logs if needed...

    } catch (err) {
        logger.error('Daily tasks failed:', err.message);
    }
};

const startMonitor = () => {
    if (process.env.NODE_ENV === 'test') return;

    // Load webhook immediately on startup
    syncWebhook();

    // Schedule Daily Tasks
    setInterval(runDailyTasks, DAILY_TASKS_INTERVAL);
    // Also run once 1 minute after startup
    setTimeout(runDailyTasks, 60000);

    setInterval(async () => {
        try {
            const cpu = await si.currentLoad();
            const mem = await si.mem();
            const ramPercent = (mem.active / mem.total) * 100;

            // Fetch dynamic thresholds
            const threshRes = await pool.query("SELECT key, value FROM geosurepath_settings WHERE key IN ('alert_threshold_cpu', 'alert_threshold_ram')");
            const thresholds = {};
            threshRes.rows.forEach(r => thresholds[r.key] = parseInt(r.value));
            
            const cpuLimit = thresholds.alert_threshold_cpu || 90;
            const ramLimit = thresholds.alert_threshold_ram || 90;

            if (cpu.currentLoad > cpuLimit) {
                await sendAlert('CRITICAL_CPU', `CPU Load reached ${cpu.currentLoad.toFixed(2)}% (Limit: ${cpuLimit}%)`, 'CRITICAL');
            }

            if (ramPercent > ramLimit) {
                await sendAlert('CRITICAL_RAM', `Memory usage reached ${ramPercent.toFixed(2)}% (Limit: ${ramLimit}%)`, 'CRITICAL');
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
