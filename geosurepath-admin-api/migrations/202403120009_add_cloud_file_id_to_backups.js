exports.up = function(knex) {
  return knex.schema.alterTable('geosurepath_backups', (table) => {
    table.string('cloud_file_id').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('geosurepath_backups', (table) => {
    table.dropColumn('cloud_file_id');
  });
};
