exports.up = function(knex) {
  return knex.schema.createTable('geosurepath_settings', function(table) {
    table.string('key').primary();
    table.text('value');
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('geosurepath_settings');
};
