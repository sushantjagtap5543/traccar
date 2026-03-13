const si = require('systeminformation');
const axios = require('axios');
const { pool, logger } = require('./db');

let ALERT_WEBHOOK = process.env.ALERT_WEBHOOK || '';
const BACKGROUND_MONITOR_INTERVAL = 60000;

const sendAlert = async (title, message, severity = 'WARNING', deviceId = 'infra') => {
    const { redisClient } = require('./db');
    const { sendSMS } = require('./sms');
    const { sendEmail } = require('./email');

    const alertKey = `alert_cooldown:${title}:${deviceId}`;
    
    // 1. Determine Cooldown Duration (WF-001)
    let cooldown = 900; // Default 15 mins
    if (title.includes('SOS') || severity === 'EMERGENCY') cooldown = 300; // 5 mins
    if (title.includes('SPEED')) cooldown = 1800; // 30 mins
    if (title.includes('RENEWAL')) cooldown = 86400; // 24 hours

    // Atomic Check & Set (Fix for BUG-003 Race Condition)
    try {
        const canDispatch = await redisClient.set(alertKey, '1', {
            NX: true,
            EX: cooldown
        });

        if (!canDispatch) {
            logger.debug(`Alert suppressed by 15m atomic cooldown: ${title}`);
            return;
        }
    } catch (err) {
        logger.error('Deduplication check failed:', err.message);
        // Fail open or fail closed? We fail closed to prevent alert storms if Redis is fluttering.
        return; 
    }

    logger.warn(`ALERT [${severity}]: ${title} - ${message}`);

    // Multichannel Dispatch for HIGH severity
    const isCritical = ['CRITICAL', 'EMERGENCY', 'SOS'].includes(severity);
    
    // 1. Webhook (Primary)
    if (ALERT_WEBHOOK) {
        try {
            await axios.post(ALERT_WEBHOOK, {
                content: `🚨 **GS-INFRA ALERT [${severity}]**\n**${title}**: ${message}\nTime: ${new Date().toISOString()}`
            });
        } catch (err) {
            logger.error('Failed to dispatch alert webhook:', err.message);
            await queueForRetry({ type: 'webhook', title, message, severity, deviceId, error: err.message });
        }
    }

    // 2. Email & SMS (Emergency/Critical Only)
    if (isCritical) {
        try {
            const adminEmailRes = await pool.query("SELECT email FROM tc_users WHERE administrator = true LIMIT 1");
            if (adminEmailRes.rowCount > 0) {
                try {
                    await sendEmail(adminEmailRes.rows[0].email, `GeoSurePath EMERGENCY: ${title}`, `<h3>${title}</h3><p>${message}</p><p>Severity: ${severity}</p>`);
                } catch (emailErr) {
                    await queueForRetry({ type: 'email', email: adminEmailRes.rows[0].email, title, message, severity, deviceId });
                }
            }
            
            const adminPhoneRes = await pool.query("SELECT phone FROM tc_users WHERE administrator = true AND phone IS NOT NULL LIMIT 1");
            if (adminPhoneRes.rowCount > 0) {
                try {
                    await sendSMS(adminPhoneRes.rows[0].phone, `ALERT [${severity}]: ${title} - ${message}`);
                } catch (smsErr) {
                    await queueForRetry({ type: 'sms', phone: adminPhoneRes.rows[0].phone, title, message, severity, deviceId });
                }
            }
        } catch (dispatchErr) {
            logger.error('Emergency lookup failure:', dispatchErr.message);
        }
    }

    try {
        await pool.query(
            "INSERT INTO geosurepath_alerts (title, device_id, severity, message) VALUES ($1, $2, $3, $4)",
            [title, deviceId, severity, message]
        );
    } catch (err) {
        logger.error('Alert persistence error:', err.message);
    }
};

const queueForRetry = async (payload) => {
    const { redisClient } = require('./db');
    payload.retryCount = (payload.retryCount || 0) + 1;
    payload.nextRetry = Date.now() + (Math.pow(2, payload.retryCount) * 5000); // Exponential backoff
    
    if (payload.retryCount > 5) {
        logger.error(`Alert permanently failed after ${payload.retryCount} retries`, { payload });
        return;
    }

    try {
        await redisClient.lPush('geosurepath_alert_retries', JSON.stringify(payload));
        logger.info(`Alert queued for retry #${payload.retryCount}`);
    } catch (err) {
        logger.error('Failed to queue alert for retry:', err.message);
    }
};

const processRetries = async () => {
    const { redisClient } = require('./db');
    const { sendSMS } = require('./sms');
    const { sendEmail } = require('./email');

    try {
        const item = await redisClient.rPop('geosurepath_alert_retries');
        if (!item) return;

        const payload = JSON.parse(item);
        if (Date.now() < payload.nextRetry) {
            // Not time yet, push back
            await redisClient.lPush('geosurepath_alert_retries', item);
            return;
        }

        logger.info(`Processing alert retry #${payload.retryCount} for type ${payload.type}`);
        
        try {
            switch (payload.type) {
                case 'webhook':
                    if (ALERT_WEBHOOK) {
                        await axios.post(ALERT_WEBHOOK, {
                            content: `🚨 **GS-RETRY ALERT [${payload.severity}]**\n**${payload.title}**: ${payload.message}`
                        });
                    }
                    break;
                case 'email':
                    await sendEmail(payload.email, `RERUN: GeoSurePath EMERGENCY: ${payload.title}`, payload.message);
                    break;
                case 'sms':
                    await sendSMS(payload.phone, `RERUN ALERT: ${payload.title}`);
                    break;
            }
            logger.info('Retry successful.');
        } catch (err) {
            logger.warn(`Retry #${payload.retryCount} failed: ${err.message}`);
            await queueForRetry(payload);
        }
    } catch (err) {
        logger.error('Retry processor error:', err.message);
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
            const message = `Your GeoSurePath subscription for ${sub.user_name} (Plan: ${sub.plan_id}) expires in 3 days on ${new Date(sub.expiry_date).toLocaleDateString()}. Please renew at the billing portal.`;
            
            // Multichannel dispatch
            await sendAlert('RENEWAL_REMINDER', message, 'INFO', `user_${sub.user_actual_id}`);
            
            // Direct email/SMS for renewal (Bypassing cooldown if needed, but sendAlert handles it)
            // The 24h cooldown above ensures we don't spam them if this runs multiple times
        }

        // 2. Auto-deactivate Expired Subscriptions (After 3-day grace period)
        const deactivationRes = await pool.query(
            "UPDATE geosurepath_subscriptions SET status = 'expired' WHERE status = 'active' AND (expiry_date + INTERVAL '3 days') < NOW()"
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

    // Periodic Retry Processor
    setInterval(processRetries, 15000);

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

            // Periodic Log of Active Cooldowns (Monitoring)
            const { redisClient } = require('./db');
            const cooldownKeys = await redisClient.keys('alert_cooldown:*');
            if (cooldownKeys.length > 0) {
                logger.info(`Monitor: ${cooldownKeys.length} active alert cooldowns in Redis.`);
            }

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
