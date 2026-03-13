/**
 * Telemetry Performance Optimization
 * Addresses BUG-103: Lack of database indexes on critical telemetry tables.
 * Improves performance for real-time tracking, history playback, and analytical reports.
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    // 1. tc_positions Optimization
    // Standard Traccar schema might have some, but we ensure the most critical ones for GSP
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_positions_deviceid_devicetime ON tc_positions (deviceid, devicetime DESC)');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_positions_fixtime ON tc_positions (fixtime)');
    
    // 2. tc_events Optimization
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_events_deviceid_eventtime ON tc_events (deviceid, eventtime DESC)');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_events_type ON tc_events (type)');

    // 3. tc_attributes Optimization (if it exists and is used for metadata)
    // Some Traccar installs use positions.attributes JSONB, indexing it requires specific logic
    // but for now we focus on the core B-Tree indexes.

    // 4. Audit Log Optimization
    await knex.schema.alterTable('geosurepath_audit_logs', (table) => {
        table.index(['action']);
        table.index(['created_at']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    await knex.raw('DROP INDEX IF EXISTS idx_positions_deviceid_devicetime');
    await knex.raw('DROP INDEX IF EXISTS idx_positions_fixtime');
    await knex.raw('DROP INDEX IF EXISTS idx_events_deviceid_eventtime');
    await knex.raw('DROP INDEX IF EXISTS idx_events_type');

    await knex.schema.alterTable('geosurepath_audit_logs', (table) => {
        table.dropIndex(['action']);
        table.dropIndex(['created_at']);
    });
};
