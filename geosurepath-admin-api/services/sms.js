const { logger } = require('./db');
const axios = require('axios');

/**
 * SMS Service for GeoSurePath
 * This coordinates OTP dispatch via SMS gateways.
 * Mock implementation logs to console, but ready for Twilio/MSG91.
 */
const sendSMS = async (to, message) => {
    logger.info(`[SMS-DISPATCH] To: ${to} | Msg: ${message}`);

    // INTEGRATION POINT:
    // To enable real SMS, uncomment and configure a provider below:

    // 0. Fetch credentials from DB settings (to support Central Config Panel)
    const { pool } = require('./db');
    const { decrypt } = require('../utils/crypto');

    try {
        const res = await pool.query("SELECT key, value FROM geosurepath_settings WHERE key IN ('twilio_sid', 'twilio_auth_token', 'twilio_number')");
        const config = {};
        res.rows.forEach(r => config[r.key] = decrypt(r.value));

        const sid = config.twilio_sid || process.env.TWILIO_SID;
        const auth = config.twilio_auth_token || process.env.TWILIO_AUTH_TOKEN;
        const from = config.twilio_number || process.env.TWILIO_NUMBER;

        if (sid && auth && from) {
            const twilio = require('twilio');
            const client = twilio(sid, auth);
            await client.messages.create({
                body: message,
                from: from,
                to: to
            });
            logger.info(`[SMS-SUCCESS] Twilio dispatched to ${to}`);
            return true;
        }
    } catch (err) {
        logger.error(`[SMS-FAILURE] DB/Twilio Error: ${err.message}`);
        // Fallback to mock if not configured
    }

    // Default: Mock success
    return true;
};

module.exports = { sendSMS };
