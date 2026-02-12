const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authService = require('../services/authService');
const { verifyRefreshToken, generateAccessToken, verifyAccessToken } = require('../utils/jwtUtils');

/**
 * POST /auth/login
 * Input: email, password
 */
router.post('/login', async (req, res) => {
    let { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const metadata = {
            ip: req.ip,
            userAgent: req.headers['user-agent']
        };

        const result = await authService.login(email.trim(), password.trim(), metadata);
        res.json(result);

    } catch (error) {
        console.error('Login Error:', error.message);
        const status = error.message === 'Invalid credentials' ? 401 :
            error.message === 'User Service Unavailable' ? 503 : 500;
        res.status(status).json({ message: error.message });
    }
});

/**
 * POST /auth/refresh
 * Input: refresh_token
 */
router.post('/refresh', async (req, res) => {
    const { refresh_token } = req.body;

    if (!refresh_token) {
        return res.status(401).json({ message: 'Refresh Token Required' });
    }

    try {
        // 1. Verify Refresh Token Signature
        const userPayload = verifyRefreshToken(refresh_token);
        if (!userPayload) {
            return res.status(403).json({ message: 'Invalid Refresh Token' });
        }

        // 2. Check if Refresh Token matches active session in MySQL
        const [rows] = await db.execute(
            `SELECT * FROM sessions WHERE refresh_token = ? AND is_active = 1`,
            [refresh_token]
        );

        if (rows.length === 0) {
            return res.status(403).json({ message: 'Session invalid or expired' });
        }

        const session = rows[0];

        // 3. Issue new Access Token
        const newAccessToken = generateAccessToken({
            userId: userPayload.userId,
            email: userPayload.email,
            roleId: userPayload.roleId
        });

        res.json({ accessToken: newAccessToken });

    } catch (error) {
        console.error('Refresh Error:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * POST /auth/logout
 * Input: refresh_token
 */
router.post('/logout', async (req, res) => {
    const { refresh_token } = req.body;

    if (!refresh_token) {
        return res.status(400).json({ message: 'Refresh Token Required for Logout' });
    }

    try {
        const logoutTime = new Date(); // MySQL handles Date objects automatically

        const [result] = await db.execute(
            `UPDATE sessions SET is_active = 0, logout_time = ? WHERE refresh_token = ?`,
            [logoutTime, refresh_token]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Session not found or already logged out' });
        }

        res.json({ message: 'Logged out successfully' });

    } catch (error) {
        console.error('Logout Error:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
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

/**
 * GET /auth/permissions
 * Returns all modules, features, and permissions for the authenticated user's role.
 * Header: Authorization: Bearer <access_token>
 */
router.get('/permissions', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'No token provided' });

    const user = verifyAccessToken(token);
    if (!user) return res.status(403).json({ message: 'Invalid or expired token' });

    try {
        const [rows] = await db.execute(`
            SELECT 
                m.name AS module_name,
                f.name AS feature_name,
                p.name AS permission_name
            FROM role_permissions rp
            JOIN roles r ON rp.role_id = r.id
            JOIN features f ON rp.feature_id = f.id
            JOIN modules m ON f.module_id = m.id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE r.id = ?
            ORDER BY m.name, f.name, p.name
        `, [user.roleId]);

        // Group by module for a cleaner response
        const permissions = rows.reduce((acc, curr) => {
            if (!acc[curr.module_name]) acc[curr.module_name] = {};
            if (!acc[curr.module_name][curr.feature_name]) acc[curr.module_name][curr.feature_name] = [];
            acc[curr.module_name][curr.feature_name].push(curr.permission_name);
            return acc;
        }, {});

        res.json({
            user: {
                email: user.email,
                roleId: user.roleId
            },
            permissions
        });

    } catch (error) {
        console.error('Fetch Permissions Error:', error.message, 'User:', JSON.stringify(user));
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

/**
 * POST /auth/check-permission
 * Checks if the user has a specific permission for a feature.
 * Body: { feature: 'BG IMG', permission: 'edit' }
 * Header: Authorization: Bearer <access_token>
 */
router.post('/check-permission', async (req, res) => {
    const { feature, permission } = req.body || {};
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'No token provided' });
    if (!feature || !permission) return res.status(400).json({ message: 'Feature and permission are required' });

    const user = verifyAccessToken(token);
    if (!user) return res.status(403).json({ message: 'Invalid or expired token' });

    try {
        const [rows] = await db.execute(`
            SELECT COUNT(*) AS has_access
            FROM role_permissions rp
            JOIN roles r ON rp.role_id = r.id
            JOIN features f ON rp.feature_id = f.id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE r.id = ?
              AND f.name = ?
              AND p.name = ?
        `, [user.roleId, feature, permission]);

        const hasAccess = rows[0].has_access > 0;

        res.json({
            allowed: hasAccess,
            user: user.email,
            roleId: user.roleId,
            request: { feature, permission }
        });

    } catch (error) {
        console.error('Check Permission Error:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
