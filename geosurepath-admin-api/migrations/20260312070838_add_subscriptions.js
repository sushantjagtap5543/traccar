/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema
        .createTable('geosurepath_subscriptions', function (table) {
            table.increments('id');
            table.integer('user_id').notNullable(); // Links to Traccar tc_users.id
            table.string('plan_id').notNullable(); // basic, standard, enterprise
            table.string('status').notNullable().defaultTo('active'); // active, expired, cancelled
            table.string('razorpay_order_id').nullable();
            table.string('razorpay_payment_id').nullable();
            table.timestamp('start_date').defaultTo(knex.fn.now());
            table.timestamp('expiry_date').notNullable();
            table.integer('device_limit').defaultTo(5);
            table.timestamps(true, true);
        })
        .then(() => {
            // Add a constraint to geosurepath_settings for subscription prices?
            // For now we'll store them in pricingConfig in frontend but we need them in backend for verification
            return knex('geosurepath_settings').insert([
                { key: 'plan_price_basic', value: '499' },
                { key: 'plan_price_standard', value: '999' },
                { key: 'plan_price_enterprise', value: '2499' }
            ]);
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable('geosurepath_subscriptions');
};
