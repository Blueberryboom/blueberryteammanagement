const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'blueberry',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initDatabase() {
  console.log("🟡 Ensuring database tables...");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(32),
      channel_id VARCHAR(32),
      type VARCHAR(20),
      status VARCHAR(20) DEFAULT 'open',
      claimed_by VARCHAR(32) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ticket_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ticket_id INT,
      action VARCHAR(50),
      moderator VARCHAR(32),
      info TEXT,
      time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS member_goal (
      id INT PRIMARY KEY,
      goal INT,
      set_by VARCHAR(64),
      time BIGINT
    )
  `);

  await pool.query(`
  CREATE TABLE IF NOT EXISTS mod_applications (
    id INT PRIMARY KEY DEFAULT 1,
    open BOOLEAN,
    message TEXT,
    set_by VARCHAR(64),
    time BIGINT
  )
`);

// ensure row exists
await pool.query(`
  INSERT IGNORE INTO mod_applications (id, open, message, set_by, time)
  VALUES (1, 0, 'Applications are closed.', 'system', UNIX_TIMESTAMP())
`);

  console.log("🟢 Database tables ensured");
}

module.exports = {
  pool,

  async query(sql, params) {
    return pool.query(sql, params);
  },

  async execute(sql, params) {
    return pool.execute(sql, params);
  },

  initDatabase
};
