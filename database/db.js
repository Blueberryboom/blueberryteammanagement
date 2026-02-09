const mysql = require('mysql2/promise');
require('dotenv').config();

let pool;

async function init() {

  pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "blueberrybot",
    connectionLimit: 5
  });

  console.log("🟣 Connected to MariaDB");

  // ===== TABLES =====

  await pool.query(`
  CREATE TABLE IF NOT EXISTS tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(32),
  channel_id VARCHAR(32),
  type VARCHAR(20),
  claimed_by VARCHAR(32) DEFAULT NULL,
  status ENUM('open','closed') DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`);

  await pool.query(`
  CREATE TABLE IF NOT EXISTS ticket_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,

    ticket_id INT,
    action VARCHAR(32),

    user_id VARCHAR(32),
    info TEXT,

    time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`);

  // ===== NEW MEMBER GOALS TABLE =====
  await pool.query(`
  CREATE TABLE IF NOT EXISTS member_goals (
    id INT AUTO_INCREMENT PRIMARY KEY,

    goal INT NOT NULL,

    set_by VARCHAR(64),
    set_by_id VARCHAR(32),

    time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`);

  console.log("🟢 Database tables ensured");
}

// ================= TICKETS =================

async function createTicket(channelId, userId, type) {

  const [res] = await pool.query(
`INSERT INTO tickets
(channel_id, user_id, type)
VALUES (?, ?, ?)`,
[channelId, userId, type]
  );

  return res.insertId;
}

async function logAction(ticketId, action, userId, info = "") {

  await pool.query(
`INSERT INTO ticket_logs
(ticket_id, action, user_id, info)
VALUES (?, ?, ?, ?)`,
[ticketId, action, userId, info]
  );
}

async function getOpenTicket(channelId) {

  const [rows] = await pool.query(
`SELECT * FROM tickets
 WHERE channel_id = ?
 AND status = 'open'`,
[channelId]
  );

  return rows[0];
}

async function closeTicket(ticketId) {

  await pool.query(
`UPDATE tickets
 SET status = 'closed',
     closed_at = NOW()
 WHERE id = ?`,
[ticketId]
  );
}

async function claimTicket(ticketId, modId) {

  await pool.query(
`UPDATE tickets
 SET claimed_by = ?
 WHERE id = ?`,
[modId, ticketId]
  );
}

// ================= MEMBER GOALS =================

async function setGoal(amount, user) {

  await pool.query(
`INSERT INTO member_goals
(goal, set_by, set_by_id)
VALUES (?, ?, ?)`,
[
  amount,
  user.tag,
  user.id
]);
}

async function getLatestGoal() {

  const [rows] = await pool.query(
`SELECT * FROM member_goals
 ORDER BY id DESC
 LIMIT 1`
  );

  return rows[0];
}

module.exports = {
  init,
  pool,

  // tickets
  createTicket,
  logAction,
  getOpenTicket,
  closeTicket,
  claimTicket,

  // goals
  setGoal,
  getLatestGoal
};
