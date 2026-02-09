const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to SQLite database
// Using a file-based database for persistence
const dbPath = path.resolve(__dirname, '../../sessions.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Create sessions table if not exists
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    email TEXT,
    role TEXT,
    module_name TEXT,
    refresh_token TEXT,
    login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    logout_time DATETIME,
    is_active INTEGER DEFAULT 1,
    ip_address TEXT,
    user_agent TEXT
  )`, (err) => {
        if (err) {
            console.error('Error creating table:', err.message);
        } else {
            console.log('Sessions table ready.');
        }
    });
});

module.exports = db;
