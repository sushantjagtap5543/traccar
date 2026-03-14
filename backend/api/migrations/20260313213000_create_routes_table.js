exports.up = function(knex) {
  return knex.schema.createTable('geosurepath_routes', function(table) {
    table.increments('id');
    table.integer('user_id').notNullable();
    table.string('name').notNullable();
    table.text('polyline').nullable();
    table.jsonb('coordinates').nullable();
    table.float('buffer').defaultTo(50); // meters
    table.boolean('active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('geosurepath_routes');
};
