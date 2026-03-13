/**
 * GeoSurePath Schema Maintenance (BUG-010, BUG-017)
 * 1. Establishes a standalone user metadata table to prevent collisions with Traccar's core schema.
 * 2. Expands TOTP secret storage to accommodate standard Base32 encoded secrets.
 */

exports.up = function(knex) {
    return knex.schema
        // 1. Standalone Metadata Table (Fix for BUG-010)
        .createTable('geosurepath_user_metadata', table => {
            table.integer('user_id').primary().references('id').inTable('tc_users').onDelete('CASCADE');
            table.string('client_id', 64).index();
            table.string('totp_secret', 128);
            table.boolean('totp_enabled').defaultTo(false);
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
        })
        // 2. Data Migration: Move existing metadata if tc_users was already mutated
        .then(async () => {
            const hasClientId = await knex.schema.hasColumn('tc_users', 'client_id');
            const hasTotpSecret = await knex.schema.hasColumn('tc_users', 'totp_secret');
            
            if (hasClientId || hasTotpSecret) {
                const users = await knex('tc_users').select('id', 
                    hasClientId ? 'client_id' : knex.raw('NULL'),
                    hasTotpSecret ? 'totp_secret' : knex.raw('NULL'),
                    knex.schema.hasColumn('tc_users', 'totp_enabled') ? 'totp_enabled' : knex.raw('FALSE')
                );
                
                const metadata = users.map(u => ({
                    user_id: u.id,
                    client_id: u.client_id || 'DEFAULT',
                    totp_secret: u.totp_secret,
                    totp_enabled: u.totp_enabled || false
                })).filter(m => m.totp_secret || m.client_id !== 'DEFAULT');

                if (metadata.length > 0) {
                    await knex('geosurepath_user_metadata').insert(metadata);
                }
            }
        });
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('geosurepath_user_metadata');
};
