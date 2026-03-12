exports.up = function(knex) {
  return knex.schema.alterTable('geosurepath_subscriptions', (table) => {
    table.string('invoice_number').unique();
  }).then(() => {
    return knex('geosurepath_settings').insert([
      { key: 'invoice_prefix', value: 'GS-INV-' },
      { key: 'invoice_next_val', value: '1001' }
    ]);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('geosurepath_subscriptions', (table) => {
    table.dropColumn('invoice_number');
  }).then(() => {
    return knex('geosurepath_settings').whereIn('key', ['invoice_prefix', 'invoice_next_val']).del();
  });
};
