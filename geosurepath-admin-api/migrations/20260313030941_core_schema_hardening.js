/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // 1. Harden tc_users for SaaS Security
    .alterTable('tc_users', table => {
      if (knex.client.config.client === 'postgresql') {
        // Use raw to check for column existence or rely on Knex to handle errors
        table.string('totp_secret', 32).nullable();
        table.boolean('totp_enabled').notNullable().defaultTo(false);
        table.string('status', 20).notNullable().defaultTo('active');
      }
    })
    // 2. Standardized Session Management (SOC2 Compliance)
    .createTable('geosurepath_sessions', table => {
      table.increments('id').primary();
      table.string('user_email', 255).notNullable();
      table.string('token_hash', 64).notNullable().unique();
      table.string('ip_address', 45);
      table.string('user_agent', 500);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('expires_at').notNullable();
      table.index(['user_email', 'token_hash']);
    })
    // 3. Login Auditing
    .createTable('geosurepath_login_attempts', table => {
      table.increments('id').primary();
      table.string('email', 255).notNullable();
      table.string('ip_address', 45);
      table.boolean('success').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.index(['email', 'ip_address']);
    })
    // 4. Performance Indexes
    .raw('CREATE INDEX IF NOT EXISTS idx_positions_device_time ON tc_positions (deviceid, servertime DESC)')
    .raw('CREATE INDEX IF NOT EXISTS idx_events_device_time ON tc_events (deviceid, eventtime DESC)');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('geosurepath_login_attempts')
    .dropTableIfExists('geosurepath_sessions')
    .alterTable('tc_users', table => {
      table.dropColumn('totp_secret');
      table.dropColumn('totp_enabled');
      table.dropColumn('status');
    });
};
