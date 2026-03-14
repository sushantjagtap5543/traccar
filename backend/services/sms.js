const { logger } = require('./db');

const sendSMS = async (to, message) => {
    logger.info(`[SMS-MOCK] To: ${to} | Msg: ${message}`);
    // Real implementation would use Twilio/MSG91
    return 'mock-sid';
};

module.exports = { sendSMS };
