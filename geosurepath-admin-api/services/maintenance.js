const { pool, logger } = require('./db');

/**
 * Database Maintenance Service
 * Orchestrates data retention policies and indexing health.
 */

const purgeOldData = async () => {
    logger.info('Maintenance: Starting data retention purge...');
    try {
        // Fetch retention setting
        const res = await pool.query("SELECT value FROM geosurepath_settings WHERE key = 'data_retention_days' LIMIT 1");
        const days = parseInt(res.rows[0]?.value || '30');
        
        // 1. Purge Old Positions (The largest table)
        const posPurge = await pool.query(
            "DELETE FROM tc_positions WHERE servertime < NOW() - INTERVAL '1 day' * $1",
            [days]
        );
        if (posPurge.rowCount > 0) {
            logger.info(`Maintenance: Purged ${posPurge.rowCount} stale positions older than ${days} days.`);
        }

        // 2. Purge Old Events
        const eventPurge = await pool.query(
            "DELETE FROM tc_events WHERE eventtime < NOW() - INTERVAL '1 day' * $1",
            [days]
        );
        if (eventPurge.rowCount > 0) {
            logger.info(`Maintenance: Purged ${eventPurge.rowCount} stale events older than ${days} days.`);
        }

        // 3. Purge Alert History
        const alertPurge = await pool.query(
            "DELETE FROM geosurepath_alerts WHERE created_at < NOW() - INTERVAL '1 day' * $1",
            [days]
        );
        if (alertPurge.rowCount > 0) {
            logger.info(`Maintenance: Purged ${alertPurge.rowCount} stale alert records.`);
        }

        // Vacuum to reclaim space (Postgres Specific)
        // Note: VACUUM ANALYSE cannot run inside a transaction/pool easily without specific settings
        // but for a SaaS platform, standard autovacuum handles most cases. 
        // We'll just run a re-index check.
        
    } catch (err) {
        logger.error('Maintenance: Purge failed', err.message);
    }
};

/**
 * Ensures all users with active devices have at least the inbuilt 1-year subscription.
 * Implements "When device start automatically start one year subscription" requirement.
 */
const reconcileSubscriptions = async () => {
    logger.info('Maintenance: Reconciling inbuilt subscriptions...');
    try {
        // Find users with devices but NO entry in geosurepath_subscriptions
        const result = await pool.query(`
            SELECT DISTINCT u.id, u.email 
            FROM tc_users u
            JOIN tc_user_device ud ON u.id = ud.userid
            LEFT JOIN geosurepath_subscriptions s ON u.id = s.user_id
            WHERE s.id IS NULL
        `);

        if (result.rowCount === 0) return;

        logger.info(`Maintenance: Found ${result.rowCount} users with devices missing subscriptions. Provisioning...`);

        // Fetch enterprise limit
        const limitRes = await pool.query("SELECT value FROM geosurepath_settings WHERE key = 'plan_limit_enterprise' LIMIT 1");
        const enterpriseLimit = limitRes.rowCount > 0 ? parseInt(limitRes.rows[0].value) : 50;
        
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);

        for (const user of result.rows) {
            await pool.query(
                `INSERT INTO geosurepath_subscriptions 
                (user_id, plan_id, status, device_limit, amount_paid, razorpay_payment_id, expiry_date) 
                VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [user.id, 'enterprise', 'active', enterpriseLimit, 0, 'INBUILT_PROVISION', expiryDate]
            );
            logger.info(`Maintenance: Provisioned 1-year sub for user ${user.id} (${user.email})`);
        }
    } catch (err) {
        logger.error('Maintenance: Subscription reconciliation failed', err.message);
    }
};

const ensureIndexes = async () => {
    logger.info('Maintenance: Verifying database indexes...');
    try {
        // Optimize position lookups (Critical for map performance)
        await pool.query('CREATE INDEX IF NOT EXISTS idx_positions_deviceid_time ON tc_positions (deviceid, servertime DESC)');
        
        // Optimize event lookups
        await pool.query('CREATE INDEX IF NOT EXISTS idx_events_deviceid_time ON tc_events (deviceid, eventtime DESC)');
        
        logger.info('Maintenance: Indexes verified and optimized.');
    } catch (err) {
        logger.error('Maintenance: Indexing failed', err.message);
    }
};

const startMaintenanceTasks = () => {
    // Run indexing on startup
    ensureIndexes();

    // Schedule purge daily at 02:00 AM
    const scheduleDaily = () => {
        const now = new Date();
        const night = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1, // tomorrow
            2, 0, 0 // 02:00:00
        );
        const msTillNight = night.getTime() - now.getTime();
        
        setTimeout(() => {
            purgeOldData();
            reconcileSubscriptions(); // Also run on schedule
            setInterval(purgeOldData, 24 * 60 * 60 * 1000); // Repeat every 24h
        }, msTillNight);
    };

    scheduleDaily();
};

module.exports = { startMaintenanceTasks, purgeOldData };
