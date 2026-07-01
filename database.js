const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;

const dbDir = path.join(__dirname, 'data');
const dbPath = path.join(dbDir, 'library.db');

// Create database directory if it doesn't exist
async function ensureDbDir() {
  try {
    await fs.mkdir(dbDir, { recursive: true });
  } catch (error) {
    console.error('Error creating database directory:', error);
  }
}

// Initialize database and create tables
async function initializeDatabase() {
  await ensureDbDir();

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log('Connected to SQLite database');

        // Create admin users table
        db.run(`
          CREATE TABLE IF NOT EXISTS admin_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) {
            reject(err);
          } else {
            console.log('Admin users table created/verified');
            resolve(db);
          }
        });
      }
    });
  });
}

// Get database connection
function getDatabase() {
  return new sqlite3.Database(dbPath);
}

// Verify admin credentials
async function verifyAdmin(username, password) {
  const db = getDatabase();
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM admin_users WHERE username = ?',
      [username],
      async (err, row) => {
        db.close();
        if (err) {
          reject(err);
          return;
        }

        if (!row) {
          resolve(null);
          return;
        }

        // Verify password using bcrypt
        const bcrypt = require('bcrypt');
        const isValid = await bcrypt.compare(password, row.password_hash);
        resolve(isValid ? row : null);
      }
    );
  });
}

// Create admin user
async function createAdmin(username, password) {
  const bcrypt = require('bcrypt');
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const db = getDatabase();
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO admin_users (username, password_hash) VALUES (?, ?)',
      [username, passwordHash],
      function(err) {
        db.close();
        if (err) {
          if (err.message.includes('UNIQUE constraint')) {
            reject(new Error('Username already exists'));
          } else {
            reject(err);
          }
        } else {
          resolve({ id: this.lastID, username });
        }
      }
    );
  });
}

// Check if admin user exists
async function adminExists(username) {
  const db = getDatabase();
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id FROM admin_users WHERE username = ?',
      [username],
      (err, row) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(!!row);
        }
      }
    );
  });
}

module.exports = {
  initializeDatabase,
  verifyAdmin,
  createAdmin,
  adminExists
};