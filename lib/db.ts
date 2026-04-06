import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'interview_platform',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;

export async function initDatabase() {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE DATABASE IF NOT EXISTS interview_platform
    `);
    await connection.query(`USE interview_platform`);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(36) PRIMARY KEY,
        candidate_name VARCHAR(255),
        job_role VARCHAR(255),
        job_description TEXT,
        years_experience INT,
        resume_text TEXT,
        overall_score DECIMAL(5,2),
        status ENUM('pending','in_progress','completed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(36),
        question_number INT,
        question_text TEXT,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS answers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question_id INT,
        session_id VARCHAR(36),
        answer_text TEXT,
        score DECIMAL(4,1),
        feedback TEXT,
        ideal_answer TEXT,
        FOREIGN KEY (question_id) REFERENCES questions(id)
      )
    `);
  } finally {
    connection.release();
  }
}