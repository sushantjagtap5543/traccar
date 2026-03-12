/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema
        .createTable('geosurepath_settings', function (table) {
            table.increments('id');
            table.string('key').notNullable().unique();
            table.text('value');
            table.timestamps(true, true);
        })
        .then(() => {
            return knex('geosurepath_settings').insert([
                { key: 'maintenance_mode', value: 'false' },
                { key: 'alert_threshold_cpu', value: '90' },
                { key: 'alert_threshold_ram', value: '90' }
            ]);
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable('geosurepath_settings');
};
