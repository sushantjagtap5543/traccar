exports.up = function(knex) {
  return knex.schema
    .createTable('geosurepath_sessions', (table) => {
      table.increments('id').primary();
      table.string('user_email').notNullable();
      table.string('token_hash').notNullable().unique();
      table.string('user_agent');
      table.string('ip_address');
      table.timestamp('expires_at').notNullable();
      table.timestamps(true, true);
    })
    .createTable('geosurepath_recovery_codes', (table) => {
      table.increments('id').primary();
      table.string('user_email').notNullable();
      table.string('code_hash').notNullable();
      table.boolean('used').defaultTo(false);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('geosurepath_recovery_codes')
    .dropTableIfExists('geosurepath_sessions');
};
