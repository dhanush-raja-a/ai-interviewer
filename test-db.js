const mysql = require('mysql2/promise');
require('dotenv').config();

async function test() {
  console.log("Connecting to DB:", process.env.DB_HOST, process.env.DB_USER);
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT),
    ssl: { rejectUnauthorized: false }
  });
  const start = Date.now();
  try {
    const [rows] = await pool.query('SELECT 1 as val;');
    console.log("Success:", rows, `in ${Date.now() - start}ms`);
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    pool.end();
  }
}
test();
