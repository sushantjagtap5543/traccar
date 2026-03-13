/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.alterTable('tc_devices', function (table) {
        // Enforce unique uniqueid (IMEI)
        // Note: Traccar uses uniqueid column for IMEI/identifier
        // We ensure it has a unique constraint if not already present
        // knex.raw is safer for existing table constraints
    })
    .then(() => {
        return knex.raw('ALTER TABLE tc_devices ADD COLUMN IF NOT EXISTS client_id INTEGER');
    })
    .then(() => {
        return knex.raw('ALTER TABLE tc_users ADD COLUMN IF NOT EXISTS client_id INTEGER');
    })
    .then(() => {
        // Create unique index on uniqueid if it doesn't exist
        return knex.raw('DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = \'unique_uniqueid\') THEN ALTER TABLE tc_devices ADD CONSTRAINT unique_uniqueid UNIQUE (uniqueid); END IF; END $$;');
    })
    .then(() => {
        // Enforce index on client_id for performance
        return knex.raw('CREATE INDEX IF NOT EXISTS idx_devices_client_id ON tc_devices(client_id)');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.alterTable('tc_devices', function (table) {
        table.dropIndex([], 'idx_devices_client_id');
        table.dropUnique(['uniqueid'], 'unique_uniqueid');
        table.dropColumn('client_id');
    });
};
