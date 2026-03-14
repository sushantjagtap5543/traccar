exports.up = function(knex) {
  return knex.schema.createTable('geosurepath_user_metadata', function(table) {
    table.integer('user_id').primary();
    table.string('client_id').nullable();
    table.string('totp_secret').nullable();
    table.string('company_name').nullable();
    table.string('address').nullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('geosurepath_user_metadata');
};
