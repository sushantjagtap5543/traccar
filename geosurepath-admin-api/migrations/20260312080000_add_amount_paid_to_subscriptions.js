/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.alterTable('geosurepath_subscriptions', function (table) {
        table.decimal('amount_paid', 10, 2).nullable();
        table.string('currency').defaultTo('INR');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.alterTable('geosurepath_subscriptions', function (table) {
        table.dropColumn('amount_paid');
        table.dropColumn('currency');
    });
};
