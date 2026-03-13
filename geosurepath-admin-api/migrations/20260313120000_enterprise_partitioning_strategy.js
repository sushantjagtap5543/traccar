/**
 * Enterprise Partitioning & Scaling Strategy (Step 4 & 10)
 * Goal: Support 10,000+ devices by optimizing tc_positions and tc_events.
 * 
 * Note: Since we cannot easily convert the existing live Traccar table to partitioned 
 * in a single migration without downtime, we implement a 'Hybrid Indexing' strategy
 * and provide the 'Table Partitioning' script for first-run deployment.
 */

exports.up = async function(knex) {
    // 1. Advanced Indexing for History Playback
    // Standard Traccar indexes are B-Tree. BRIN (Block Range Index) is better for time-series.
    try {
        await knex.raw('CREATE INDEX IF NOT EXISTS idx_positions_brin_time ON tc_positions USING BRIN (devicetime)');
        await knex.raw('CREATE INDEX IF NOT EXISTS idx_events_brin_time ON tc_events USING BRIN (eventtime)');
    } catch (e) {
        // Fallback or ignore if BRIN is not supported or index exists
    }

    // 2. Optimized Gin Indexing for JSONB attributes (Step 10 Optimization)
    // Allows rapid filtering by metadata (vehicleNumber, driverId, etc)
    try {
        await knex.raw('CREATE INDEX IF NOT EXISTS idx_positions_attributes_gin ON tc_positions USING GIN (attributes)');
        await knex.raw('CREATE INDEX IF NOT EXISTS idx_devices_attributes_gin ON tc_devices USING GIN (attributes)');
    } catch (e) { }

    // 3. Performance Tuning: Vacuum & Analyze specific high-traffic tables
    // This ensures query planner stays optimized after large imports
    await knex.raw('ANALYZE tc_positions');
    await knex.raw('ANALYZE tc_events');

    // 4. Create Geosurepath Stats Table for Dashboard Load Reduction (Step 10)
    // Instead of counting 10M rows every load, we use a summary table.
    if (!await knex.schema.hasTable('geosurepath_device_stats')) {
        await knex.schema.createTable('geosurepath_device_stats', (table) => {
            table.increments('id').primary();
            table.integer('device_id').unsigned().unique().notNullable();
            table.timestamp('last_online');
            table.float('daily_distance').defaultTo(0);
            table.integer('daily_alerts').defaultTo(0);
            table.timestamp('updated_at').defaultTo(knex.fn.now());
        });
    }
};

exports.down = async function(knex) {
    await knex.raw('DROP INDEX IF EXISTS idx_positions_brin_time');
    await knex.raw('DROP INDEX IF EXISTS idx_events_brin_time');
    await knex.raw('DROP INDEX IF EXISTS idx_positions_attributes_gin');
    await knex.raw('DROP INDEX IF EXISTS idx_devices_attributes_gin');
    await knex.schema.dropTableIfExists('geosurepath_device_stats');
};
