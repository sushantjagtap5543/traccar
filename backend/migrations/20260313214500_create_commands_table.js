exports.up = function(knex) {
  return knex.schema.createTable('geosurepath_commands', function(table) {
    table.increments('id');
    table.integer('user_id').notNullable();
    table.integer('device_id').notNullable();
    table.string('type').notNullable();
    table.jsonb('attributes').nullable();
    table.string('status').defaultTo('sent');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('geosurepath_commands');
};
