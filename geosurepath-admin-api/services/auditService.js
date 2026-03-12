const { pool, logger } = require('./db');

const logAudit = async (action, resource, payload, userId = null, ip = null) => {
    try {
        await pool.query(
            "INSERT INTO geosurepath_audit_logs (action, resource, payload, user_id, ip_address) VALUES ($1, $2, $3, $4, $5)",
            [action, resource, JSON.stringify(payload), userId, ip]
        );
    } catch (err) {
        logger.error(`Audit Log Failure: ${err.message}`, { action, resource });
    }
};

module.exports = { logAudit };
