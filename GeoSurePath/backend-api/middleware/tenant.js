const { AppError } = require('../utils/errors');

const { pool } = require('../services/db');

const tenantIsolation = async (req, res, next) => {
    // If user is admin, allow all access
    if (req.user && req.user.role === 'admin') {
        return next();
    }

    const userId = req.user.id;
    const deviceId = req.params.deviceId || req.body.deviceId || req.query.deviceId;

    if (deviceId) {
        const ownership = await pool.query("SELECT id FROM vehicles WHERE id = $1 AND user_id = $2", [deviceId, userId]);
        if (ownership.rowCount === 0) {
            return next(new AppError('FORBIDDEN', 'Access to this device is restricted', 403));
        }
    }

    next();
};

module.exports = { tenantIsolation };
