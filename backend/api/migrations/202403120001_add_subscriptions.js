exports.up = function(knex) {
  return knex.schema.createTable('geosurepath_subscriptions', function(table) {
    table.increments('id');
    table.integer('user_id').notNullable();
    table.string('plan_id').notNullable();
    table.string('status').defaultTo('active');
    table.timestamp('expiry_date').notNullable();
    table.integer('device_limit').defaultTo(2);
    table.string('razorpay_payment_id').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('geosurepath_subscriptions');
};
