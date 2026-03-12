exports.up = function(knex) {
  return knex.schema.createTable('geosurepath_alerts', (table) => {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.string('device_id').notNullable();
    table.string('severity');
    table.text('message');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index(['title', 'device_id', 'created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('geosurepath_alerts');
};
