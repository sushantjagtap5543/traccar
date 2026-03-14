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
    
    // Determine Cooldown
    let cooldown = 900; 
    if (title.includes('SOS') || severity === 'EMERGENCY') cooldown = 300;
    if (title.includes('SPEED') || title.includes('VIBRATION')) cooldown = 1800;
    if (title.includes('BATTERY') || title.includes('IDLE')) cooldown = 3600;
    if (title.includes('RENEWAL')) cooldown = 86400;

    try {
        const canDispatch = await redisClient.set(alertKey, '1', { NX: true, EX: cooldown });
        if (!canDispatch) return;
    } catch (err) {
        logger.error('Deduplication check failed:', err.message);
        return; 
    }

    logger.warn(`ALERT [${severity}]: ${title} - ${message}`);

    const isCritical = ['CRITICAL', 'EMERGENCY', 'SOS'].includes(severity);
    
    // 1. Webhook
    if (ALERT_WEBHOOK) {
        try {
            await axios.post(ALERT_WEBHOOK, {
                content: `🚨 **GeoSurePath ALERT [${severity}]**\n**${title}**: ${message}\nTime: ${new Date().toISOString()}`
            });
        } catch (err) {
            logger.error('Failed to dispatch alert webhook:', err.message);
        }
    }

    // 2. Email & SMS (User & Emergency)
    try {
        let recipientEmail = null;
        let recipientPhone = null;

        if (deviceId && deviceId !== 'infra') {
            const ownerRes = await pool.query(
                "SELECT u.email, u.phone FROM tc_users u JOIN tc_user_device ud ON u.id = ud.userid WHERE ud.deviceid = $1 LIMIT 1",
                [typeof deviceId === 'string' && deviceId.includes('_') ? deviceId.split('_')[1] : deviceId]
            );
            if (ownerRes.rowCount > 0) {
                recipientEmail = ownerRes.rows[0].email;
                recipientPhone = ownerRes.rows[0].phone;
            }
        }

        if (!recipientEmail && isCritical) {
            const adminRes = await pool.query("SELECT email, phone FROM tc_users WHERE administrator = true LIMIT 1");
            if (adminRes.rowCount > 0) {
                recipientEmail = adminRes.rows[0].email;
                recipientPhone = adminRes.rows[0].phone;
            }
        }

        if (recipientEmail) {
            try {
                await sendEmail(recipientEmail, `GeoSurePath Alert: ${title}`, `<h3>${title}</h3><p>${message}</p><p>Severity: ${severity}</p><hr><p>Device: ${deviceId}</p>`);
            } catch (err) { logger.error('Email failed'); }
        }

        if (recipientPhone && (isCritical || severity === 'WARNING')) {
            try {
                await sendSMS(recipientPhone, `GSP [${severity}]: ${title} - ${message}`);
            } catch (err) { logger.error('SMS failed'); }
        }
    } catch (dispatchErr) {
        logger.error('Alert dispatch lookup failure:', dispatchErr.message);
    }

    try {
        const dbDeviceId = (typeof deviceId === 'string' && deviceId.includes('_')) ? parseInt(deviceId.split('_')[1]) : (isNaN(deviceId) ? 0 : parseInt(deviceId));
        await pool.query(
            "INSERT INTO geosurepath_alerts (title, device_id, severity, message) VALUES ($1, $2, $3, $4)",
            [title, dbDeviceId, severity, message]
        );
    } catch (err) {
        logger.error('Alert persistence error:', err.message);
    }
};

const startMonitor = () => {
    if (process.env.NODE_ENV === 'test') return;
    setInterval(async () => {
        try {
            const cpu = await si.currentLoad();
            const mem = await si.mem();
            const ramPercent = (mem.active / mem.total) * 100;
            if (cpu.currentLoad > 90) await sendAlert('CRITICAL_CPU', `CPU Load at ${cpu.currentLoad.toFixed(2)}%`, 'CRITICAL');
            if (ramPercent > 90) await sendAlert('CRITICAL_RAM', `Memory at ${ramPercent.toFixed(2)}%`, 'CRITICAL');
        } catch (err) {
            logger.error('Monitor Error:', err.message);
        }
    }, BACKGROUND_MONITOR_INTERVAL);
};

module.exports = { startMonitor, sendAlert };
