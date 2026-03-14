const { pool, logger } = require('./db');
const { v4: uuidv4 } = require('uuid');

/**
 * Provisions a 12-month subscription for a new device IMEI.
 * @param {string} imei 
 * @returns {Promise<object>}
 */
const provisionDefaultSubscription = async (imei) => {
    try {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setFullYear(startDate.getFullYear() + 1); // 12 months later

        const result = await pool.query(
            'INSERT INTO subscriptions (imei, start_date, end_date, status) VALUES ($1, $2, $3, $4) RETURNING *',
            [imei, startDate, endDate, 'active']
        );

        logger.info(`Provisioned 12-month subscription for IMEI: ${imei}`);
        return result.rows[0];
    } catch (err) {
        logger.error(`Error provisioning subscription for ${imei}:`, err.message);
        throw err;
    }
};

/**
 * Checks if a device has an active subscription.
 * @param {string} imei 
 * @returns {Promise<boolean>}
 */
const hasActiveSubscription = async (imei) => {
    const result = await pool.query(
        'SELECT * FROM subscriptions WHERE imei = $1 AND status = \'active\' AND end_date > NOW()',
        [imei]
    );
    return result.rows.length > 0;
};

module.exports = {
    provisionDefaultSubscription,
    hasActiveSubscription
};
