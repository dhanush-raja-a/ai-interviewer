import fs from 'fs';
import mysql from 'mysql2/promise';

const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1]] = match[2];
});

console.log("Starting secure connection to TiDB...");

const pool = mysql.createPool({
  host: env.DB_HOST,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  port: parseInt(env.DB_PORT || '4000'),
  ssl: { rejectUnauthorized: false }
});

async function run() {
   const connection = await pool.getConnection();
   try {
     console.log("Building User Architecture...");
     await connection.query(`CREATE TABLE IF NOT EXISTS users (id VARCHAR(36) PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL, password VARCHAR(255) NULL, name VARCHAR(255), image VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
     
     console.log("Building Sessions Framework...");
     await connection.query(`CREATE TABLE IF NOT EXISTS sessions (id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36) NULL, candidate_name VARCHAR(255), job_role VARCHAR(255), job_description TEXT, years_experience INT, resume_text TEXT, overall_score DECIMAL(5,2), status ENUM('pending','in_progress','completed') DEFAULT 'pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
     
     console.log("Building Question Vectors...");
     await connection.query(`CREATE TABLE IF NOT EXISTS questions (id INT AUTO_INCREMENT PRIMARY KEY, session_id VARCHAR(36), question_number INT, question_text TEXT)`);
     
     console.log("Building Answer Matrices...");
     await connection.query(`CREATE TABLE IF NOT EXISTS answers (id INT AUTO_INCREMENT PRIMARY KEY, question_id INT, session_id VARCHAR(36), answer_text TEXT, score DECIMAL(4,1), feedback TEXT, ideal_answer TEXT)`);
     
     console.log("ALL REMOTE TABLES SUCCESSFULLY DEPLOYED TO TIDB!");
   } catch(e) {
     console.error("Database initialization failed:", e);
   }
   process.exit(0);
}
run();
