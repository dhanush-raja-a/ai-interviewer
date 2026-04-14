import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'interview_platform',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : undefined
});

export default pool;

export async function initDatabase() {
  const connection = await pool.getConnection();
  try {
    // Tables will be created in the database specified in the connection pool (DB_NAME)

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NULL,
        name VARCHAR(255),
        image VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure users table has updated columns for OAuth
    const [userColumns] = await connection.query(`SHOW COLUMNS FROM users`);
    const userColNames = (userColumns as any[]).map(c => c.Field);
    
    if (!userColNames.includes('image')) {
      await connection.query(`ALTER TABLE users ADD COLUMN image VARCHAR(255) AFTER name`);
    }
    
    // Make password column nullable if it isn't already
    await connection.query(`ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL`);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NULL,
        candidate_name VARCHAR(255),
        job_role VARCHAR(255),
        job_description TEXT,
        years_experience INT,
        resume_text TEXT,
        overall_score DECIMAL(5,2),
        status ENUM('pending','in_progress','completed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Ensure user_id column exists if table was created previously without it
    const [columns] = await connection.query(`SHOW COLUMNS FROM sessions LIKE 'user_id'`);
    if ((columns as any[]).length === 0) {
      await connection.query(`ALTER TABLE sessions ADD COLUMN user_id VARCHAR(36) NULL AFTER id`);
      await connection.query(`ALTER TABLE sessions ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL`);
    }


    await connection.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(36),
        question_number INT,
        question_text TEXT,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
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
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      )
    `);
  } finally {
    connection.release();
  }
}

// Database initialized manually or via separate script
// initDatabase().catch(console.error);