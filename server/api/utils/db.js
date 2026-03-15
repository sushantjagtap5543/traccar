const { Pool } = require("pg");
const { DB } = require("../config/env");

const pool = new Pool({
  host: DB.HOST,
  user: DB.USER,
  password: DB.PASS,
  database: DB.NAME,
  port: 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
