const { pool, logger } = require('../services/db');
const { AppError } = require('../utils/errors');

const checkDeviceLimit = async (req, res, next) => {
    const userId = req.user.id;
    
    // Fetch active subscription and device count
    const subRes = await pool.query(
        "SELECT s.device_limit, (SELECT count(*) FROM tc_user_device WHERE userid = s.user_id) as device_count FROM geosurepath_subscriptions s WHERE s.user_id = $1 AND s.status = 'active' LIMIT 1",
        [userId]
    );

    if (subRes.rowCount === 0) {
        // Auto-provision basic if missing (as per master prompt)
        await autoProvision(userId);
        return next();
    }

    const { device_limit, device_count } = subRes.rows[0];
    if (parseInt(device_count) >= parseInt(device_limit)) {
        return next(new AppError('SUBSCRIPTION_LIMIT_REACHED', `You have reached your device limit (${device_limit}). Please upgrade your plan.`, 403));
    }

    next();
};

const autoProvision = async (userId) => {
    logger.info(`Auto-provisioning standard 12-month subscription for user ${userId}`);
    await pool.query(
        "INSERT INTO geosurepath_subscriptions (user_id, plan_id, status, expiry_date, device_limit) VALUES ($1, $2, $3, NOW() + INTERVAL '1 year', $4)",
        [userId, '12month', 'active', 50]
    );
};

module.exports = { checkDeviceLimit, autoProvision };
