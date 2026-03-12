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

    const TWILIO_SID = process.env.TWILIO_SID;
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    const TWILIO_NUMBER = process.env.TWILIO_NUMBER;

    if (TWILIO_SID && TWILIO_AUTH_TOKEN && TWILIO_NUMBER) {
        try {
            const twilio = require('twilio');
            const client = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);
            await client.messages.create({
                body: message,
                from: TWILIO_NUMBER,
                to: to
            });
            logger.info(`[SMS-SUCCESS] Twilio dispatched to ${to}`);
            return true;
        } catch (err) {
            logger.error(`[SMS-FAILURE] Twilio Error: ${err.message}`);
            return false;
        }
    }

    // Default: Mock success
    return true;
};

module.exports = { sendSMS };
