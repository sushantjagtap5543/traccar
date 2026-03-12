exports.up = function(knex) {
  return knex.schema.createTable('geosurepath_audit_logs', (table) => {
    table.increments('id').primary();
    table.integer('user_id'); // Admin ID or User ID
    table.string('action').notNullable(); // e.g., 'LOGIN', 'RESTART_SERVICE', 'UPDATE_CONFIG'
    table.string('resource'); // e.g., 'geosurepath_settings'
    table.jsonb('payload');
    table.string('ip_address');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('geosurepath_audit_logs');
};
