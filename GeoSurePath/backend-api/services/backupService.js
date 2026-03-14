const { logger } = require('./db');

const startCron = () => {
    logger.info('Starting automated backup cron job...');
};

const stopCron = () => {
    logger.info('Stopping backup cron job.');
};

module.exports = { startCron, stopCron };
