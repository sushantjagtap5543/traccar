/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('geosurepath_backups', function(table) {
    table.string('checksum', 64).nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('geosurepath_backups', function(table) {
    table.dropColumn('checksum');
  });
};
