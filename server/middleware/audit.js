const db = require('../db');

async function logAction(userId, action, targetType, targetId, ip) {
    try {
        await db.query(
            'INSERT INTO audit_log(user_id, action, target_type, target_id, ip_address) VALUES ($1,$2,$3,$4,$5)',
            [userId, action, targetType, targetId, ip]
        );
    } catch (err) {
        console.error('Failed to log action to audit_log:', err);
    }
}

module.exports = { logAction };
