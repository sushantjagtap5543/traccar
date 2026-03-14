const nodemailer = require('nodemailer');
const { logger } = require('./db');

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
    if (!process.env.SMTP_HOST) {
        logger.warn(`[EMAIL-MOCK] To: ${to} | Subject: ${subject}`);
        return { messageId: 'mock-id' };
    }
    return transporter.sendMail({
        from: process.env.SMTP_FROM || '"GeoSurePath" <noreply@geosurepath.com>',
        to, subject, html
    });
};

module.exports = { sendEmail };
