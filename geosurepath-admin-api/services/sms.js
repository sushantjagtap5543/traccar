const { logger } = require('./db');
const axios = require('axios');

/**
 * SMS Service for GeoSurePath
 * This coordinates OTP dispatch via SMS gateways.
 * Mock implementation logs to console, but ready for Twilio/MSG91.
 */
const sendSMS = async (to, message) => {
    const { pool } = require('./db');
    const { decrypt } = require('../utils/crypto');

    logger.info(`[SMS-DISPATCH] To: ${to} | Msg: ${message}`);

    try {
        const sid = process.env.TWILIO_ACCOUNT_SID;
        const auth = process.env.TWILIO_AUTH_TOKEN;
        const from = process.env.TWILIO_PHONE_NUMBER;

        if (sid && auth && from) {
            const twilio = require('twilio');
            const client = twilio(sid, auth);
            const result = await client.messages.create({
                body: message,
                from: from,
                to: to
            });
            logger.info(`[SMS-SUCCESS] Twilio dispatched to ${to}: ${result.sid}`);
            return result.sid;
        }

        // Try DB fallback if env not set
        const res = await pool.query("SELECT key, value FROM geosurepath_settings WHERE key IN ('twilio_account_sid', 'twilio_auth_token', 'twilio_phone_number')");
        if (res.rowCount > 0) {
            const config = {};
            res.rows.forEach(r => config[r.key] = decrypt(r.value));
            const dbSid = config.twilio_account_sid;
            const dbAuth = config.twilio_auth_token;
            const dbFrom = config.twilio_phone_number;

            if (dbSid && dbAuth && dbFrom) {
                const twilio = require('twilio');
                const client = twilio(dbSid, dbAuth);
                const result = await client.messages.create({
                    body: message,
                    from: dbFrom,
                    to: to
                });
                logger.info(`[SMS-SUCCESS-DB] Twilio dispatched to ${to}: ${result.sid}`);
                return result.sid;
            }
        }
    } catch (err) {
        logger.error(`[SMS-FAILURE] Twilio Error: ${err.message}`);
    }

    logger.warn(`[SMS-MOCK] Twilio not configured. Message to ${to} not sent.`);
    return null;
};

module.exports = { sendSMS };
