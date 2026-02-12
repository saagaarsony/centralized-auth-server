const mysql = require('mysql2');
require('dotenv').config();

// Create the connection pool for MySQL
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'admin',
    database: process.env.DB_NAME || 'bim_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Use promise-based wrapper for easier async/await usage
const promisePool = pool.promise();

// Create sessions table if it doesn't exist (Migrating from SQLite)
const initDb = async () => {
    try {
        await promisePool.execute(`
            CREATE TABLE IF NOT EXISTS sessions (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                user_id INT UNSIGNED,
                email VARCHAR(150),
                role VARCHAR(50),
                module_name VARCHAR(100),
                refresh_token TEXT,
                login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                logout_time TIMESTAMP NULL,
                is_active TINYINT(1) DEFAULT 1,
                ip_address VARCHAR(45),
                user_agent TEXT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('MySQL Database initialized (sessions table ready).');
    } catch (err) {
        console.error('Error initializing MySQL database:', err.message);
    }
};

initDb();

module.exports = promisePool;
