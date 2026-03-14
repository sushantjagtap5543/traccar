const fs = require('fs');
const path = require('path');

exports.up = async function(knex) {
    const sqlPath = path.join(__dirname, '..', '..', 'database', 'migrations', '001_initial_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split combined statements if necessary, but Knex usually handles multi-statement strings for PG
    return knex.raw(sql);
};

exports.down = function(knex) {
    // Drop triggers first
    return knex.raw(`
        DROP TRIGGER IF EXISTS trg_overspeed_check ON telemetry;
        DROP TRIGGER IF EXISTS trg_device_binding_log ON vehicles;
        DROP FUNCTION IF EXISTS check_overspeed();
        DROP FUNCTION IF EXISTS log_device_binding();
        DROP TABLE IF EXISTS command_logs;
        DROP TABLE IF EXISTS alerts;
        DROP TABLE IF EXISTS telemetry;
        DROP TABLE IF EXISTS subscriptions;
        DROP TABLE IF EXISTS approved_devices;
        DROP TABLE IF EXISTS vehicles;
        DROP TABLE IF EXISTS users;
    `);
};
