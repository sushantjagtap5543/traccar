exports.up = function(knex) {
  return knex.schema.alterTable('geosurepath_subscriptions', (table) => {
    table.index(['user_id', 'status']);
    table.index(['expiry_date']);
    table.index(['razorpay_payment_id']);
  })
  .alterTable('geosurepath_backups', (table) => {
    table.index(['created_at']);
    table.index(['status']);
  })
  .alterTable('geosurepath_sessions', (table) => {
    table.index(['expires_at']);
    table.index(['user_email']);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('geosurepath_subscriptions', (table) => {
    table.dropIndex(['user_id', 'status']);
    table.dropIndex(['expiry_date']);
    table.dropIndex(['razorpay_payment_id']);
  })
  .alterTable('geosurepath_backups', (table) => {
    table.dropIndex(['created_at']);
    table.dropIndex(['status']);
  })
  .alterTable('geosurepath_sessions', (table) => {
    table.dropIndex(['expires_at']);
    table.dropIndex(['user_email']);
  });
};
