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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS staff_strikes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(32) NOT NULL,
      moderator_id VARCHAR(32) NOT NULL,
      reason TEXT NOT NULL,
      log_channel_id VARCHAR(32) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS staff_leave_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(32) NOT NULL,
      reason TEXT NOT NULL,
      length_text VARCHAR(255) NOT NULL,
      status VARCHAR(32) DEFAULT 'pending',
      reviewer_id VARCHAR(32) NULL,
      review_note TEXT NULL,
      reviewed_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

  async setGoal(amount, user) {
    await pool.query(
      `INSERT INTO member_goal (id, goal, set_by, time)
       VALUES (1, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         goal = VALUES(goal),
         set_by = VALUES(set_by),
         time = VALUES(time)`,
      [
        amount,
        user.tag,
        Date.now()
      ]
    );
  },

  initDatabase
};
