/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema
        .createTable('geosurepath_subscriptions', function (table) {
            table.increments('id');
            table.integer('user_id').notNullable(); // Links to Traccar tc_users.id
            table.string('plan_id').notNullable(); // 1month, 6month, 12month
            table.string('status').notNullable().defaultTo('active');
            table.string('razorpay_order_id').nullable();
            table.string('razorpay_payment_id').nullable();
            table.timestamp('start_date').defaultTo(knex.fn.now());
            table.timestamp('expiry_date').notNullable();
            table.integer('device_limit').defaultTo(10);
            table.timestamps(true, true);
        })
        .then(() => {
            return knex('geosurepath_settings').insert([
                { key: 'plan_price_1month', value: '200' },
                { key: 'plan_price_6month', value: '950' },
                { key: 'plan_price_12month', value: '1500' },
                { key: 'plan_price_enterprise', value: '4500' },
                { key: 'plan_limit_1month', value: '10' },
                { key: 'plan_limit_6month', value: '25' },
                { key: 'plan_limit_12month', value: '50' },
                { key: 'plan_limit_enterprise', value: '100' }
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
