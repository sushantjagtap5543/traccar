const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'traccar',
  password: process.env.DB_PASSWORD || 'Traccar@123',
  database: process.env.DB_NAME || 'traccar',
});

async function checkDB() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables:', res.rows.map(r => r.table_name));

    const permissions = await client.query('SELECT * FROM permissions LIMIT 1');
    console.log('Permissions table accessible');
    
    await client.end();
  } catch (err) {
    console.error('Database Check Error:', err.message);
    process.exit(1);
  }
}

checkDB();
