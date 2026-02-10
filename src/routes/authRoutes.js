const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db/database');
const userService = require('../utils/userService');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, verifyAccessToken } = require('../utils/jwtUtils');

// Helper to find user by email removed - using userService instead


/**
 * POST /auth/login
 * Input: email, password
 */
router.post('/login', async (req, res) => {
    let { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    email = email.trim();
    password = password.trim();

    // 1. Validate User Credentials
    try {
        const user = await userService.fetchUserByEmail(email);

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Compare password using bcrypt
        console.log('--- Debug Password Match ---');
        console.log('Email:', email);
        console.log('Password length provided:', password ? password.length : 'null');
        console.log('Hash from API:', user.password_hash);

        const isMatch = await bcrypt.compare(password, user.password_hash);

        console.log('Bcrypt comparison result:', isMatch);
        console.log('---------------------------');

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 2. Generate Tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // 3. Save Session to DB
        // Use module_name from request or default to 'NONE' if not provided
        const moduleName = req.body.module_name || 'NONE';

        const stmt = db.prepare(`
    INSERT INTO sessions (user_id, email, role, module_name, refresh_token, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

        const ip = req.ip;
        const userAgent = req.headers['user-agent'];

        stmt.run(user.id, user.email, user.role, moduleName, refreshToken, ip, userAgent, function (err) {
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
    } catch (error) {
        console.error('Login Error:', error.message);
        const status = error.message === 'User Service Unavailable' ? 503 : 500;
        res.status(status).json({ message: error.message });
    }
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
