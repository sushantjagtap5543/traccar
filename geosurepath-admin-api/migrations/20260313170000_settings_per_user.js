exports.up = function(knex) {
  return knex.schema.table('geosurepath_settings', function(table) {
    table.integer('user_id').nullable().references('id').inTable('tc_users').onDelete('CASCADE');
    // We need to drop the existing primary key or unique constraint on 'key' and create a new unique one on (key, user_id)
    // Note: In knex, dropUnique or dropPrimary depends on how it was originally created.
    // Based on the routes/alerts.js mention of ON CONFLICT (key, user_id), we assume we need a unique constraint.
  }).then(() => {
    return knex.raw('ALTER TABLE geosurepath_settings DROP CONSTRAINT IF EXISTS geosurepath_settings_key_key');
  }).then(() => {
    return knex.raw('ALTER TABLE geosurepath_settings ADD CONSTRAINT geosurepath_settings_key_user_id_unique UNIQUE (key, user_id)');
  });
};

exports.down = function(knex) {
  return knex.schema.table('geosurepath_settings', function(table) {
    table.dropUnique(['key', 'user_id'], 'geosurepath_settings_key_user_id_unique');
    table.dropColumn('user_id');
  }).then(() => {
    return knex.raw('ALTER TABLE geosurepath_settings ADD UNIQUE (key)');
  });
};
