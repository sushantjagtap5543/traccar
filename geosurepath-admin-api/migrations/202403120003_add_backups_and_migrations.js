/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema
        .createTable('geosurepath_backups', function (table) {
            table.increments('id');
            table.string('filename').notNullable();
            table.string('size').nullable();
            table.string('storage_type').notNullable(); // local, cloud, both
            table.string('status').notNullable(); // success, failed
            table.text('error_message').nullable();
            table.timestamp('created_at').defaultTo(knex.fn.now());
        })
        .createTable('geosurepath_migration_jobs', function (table) {
            table.increments('id');
            table.string('destination_ip').notNullable();
            table.string('status').notNullable(); // in_progress, completed, failed, rolled_back
            table.integer('progress').defaultTo(0);
            table.text('logs').nullable();
            table.text('error_message').nullable();
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('completed_at').nullable();
        })
        .then(() => {
            return knex('geosurepath_settings').insert([
                { key: 'backup_enabled', value: 'true' },
                { key: 'backup_time', value: '00:00' }, // Midnight
                { key: 'backup_retention_days', value: '15' },
                { key: 'google_drive_enabled', value: 'false' },
                { key: 'google_drive_client_id', value: '' },
                { key: 'google_drive_client_secret', value: '' },
                { key: 'google_drive_refresh_token', value: '' },
                { key: 'backup_encryption_key', value: '' }
            ]);
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema
        .dropTable('geosurepath_backups')
        .dropTable('geosurepath_migration_jobs');
};
