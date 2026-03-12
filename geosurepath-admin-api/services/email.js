const nodemailer = require('nodemailer');
const { logger } = require('./db');

/**
 * Email Service for GeoSurePath
 * Handles system notifications, alerts, and billing receipts.
 */

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

const sendEmail = async (to, subject, html) => {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
        logger.warn(`[EMAIL-MOCK] To: ${to} | Subject: ${subject} (SMTP not configured)`);
        return { messageId: 'mock-id' };
    }

    try {
        const result = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"GeoSurePath" <noreply@geosurepath.com>',
            to,
            subject,
            html
        });
        logger.info(`[EMAIL-SUCCESS] Sent to ${to}: ${result.messageId}`);
        return result;
    } catch (err) {
        logger.error(`[EMAIL-FAILURE] Error sending to ${to}: ${err.message}`);
        throw err;
    }
};

module.exports = { sendEmail };
