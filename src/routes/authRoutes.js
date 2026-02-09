const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../db/database');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, verifyAccessToken } = require('../utils/jwtUtils');

// Helper to find user by email (Reads file dynamically to avoid caching)
const findUser = (email) => {
    const usersPath = path.resolve(__dirname, '../../users.json');
    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    const cleanEmail = email.trim().toLowerCase();
    return usersData.find(u => u.email.trim().toLowerCase() === cleanEmail);
};

/**
 * POST /auth/login
 * Input: email, password
 */
router.post('/login', (req, res) => {
    let { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    email = email.trim();
    password = password.trim();

    // 1. Validate User Credentials
    const user = findUser(email);
    if (!user || user.password.trim() !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 2. Generate Tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 3. Save Session to DB (module_name is now optional/null)
    const stmt = db.prepare(`
    INSERT INTO sessions (user_id, email, role, module_name, refresh_token, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

    const ip = req.ip;
    const userAgent = req.headers['user-agent'];

    stmt.run(user.id, user.email, user.role, 'NONE', refreshToken, ip, userAgent, function (err) {
        if (err) {
            return res.status(500).json({ message: 'Error creating session', error: err.message });
        }

        // Return Tokens
        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        });
    });
    stmt.finalize();
});

/**
 * POST /auth/refresh
 * Input: refresh_token
 */
router.post('/refresh', (req, res) => {
    const { refresh_token } = req.body;

    if (!refresh_token) {
        return res.status(401).json({ message: 'Refresh Token Required' });
    }

    // 1. Verify Refresh Token Signature
    const userPayload = verifyRefreshToken(refresh_token);
    if (!userPayload) {
        return res.status(403).json({ message: 'Invalid Refresh Token' });
    }

    // 2. Check if Refresh Token matches active session in DB
    db.get(
        `SELECT * FROM sessions WHERE refresh_token = ? AND is_active = 1`,
        [refresh_token],
        (err, session) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!session) return res.status(403).json({ message: 'Session invalid or expired' });

            // 3. Issue new Access Token
            const newAccessToken = generateAccessToken({
                id: userPayload.userId,
                email: userPayload.email,
                role: userPayload.role
            });

            res.json({ accessToken: newAccessToken });
        }
    );
});

/**
 * POST /auth/logout
 * Input: refresh_token
 */
router.post('/logout', (req, res) => {
    const { refresh_token } = req.body;

    if (!refresh_token) {
        return res.status(400).json({ message: 'Refresh Token Required for Logout' });
    }

    // Mark session as inactive
    const logoutTime = new Date().toISOString();

    db.run(
        `UPDATE sessions SET is_active = 0, logout_time = ? WHERE refresh_token = ?`,
        [logoutTime, refresh_token],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });

            if (this.changes === 0) {
                return res.status(404).json({ message: 'Session not found or already logged out' });
            }

            res.json({ message: 'Logged out successfully' });
        }
    );
});

/**
 * GET /auth/verify
 * Header: Authorization: Bearer <access_token>
 */
router.get('/verify', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ valid: false, message: 'No token provided' });

    const user = verifyAccessToken(token);

    if (!user) {
        return res.status(403).json({ valid: false, message: 'Invalid or expired token' });
    }

    res.json({
        valid: true,
        user: user
    });
});

module.exports = router;
