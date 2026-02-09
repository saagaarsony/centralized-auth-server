const jwt = require('jsonwebtoken');

// Secret keys (In production, these should be in environment variables)
const ACCESS_TOKEN_SECRET = 'your-access-token-secret-key-change-me';
const REFRESH_TOKEN_SECRET = 'your-refresh-token-secret-key-change-me';

// Token Expiry Times
const ACCESS_TOKEN_EXPIRY = '15m'; // Short-lived
const REFRESH_TOKEN_EXPIRY = '7d'; // Long-lived

/**
 * Generates an Access Token
 * @param {object} user - User object containing id, email, role
 * @returns {string} - JWT Access Token
 */
const generateAccessToken = (user) => {
    return jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        ACCESS_TOKEN_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
};

/**
 * Generates a Refresh Token
 * @param {object} user - User object containing id, email, role
 * @returns {string} - JWT Refresh Token
 */
const generateRefreshToken = (user) => {
    return jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        REFRESH_TOKEN_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
};

/**
 * Verifies an Access Token
 * @param {string} token - JWT Access Token
 * @returns {object|null} - Decoded payload or null if invalid
 */
const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, ACCESS_TOKEN_SECRET);
    } catch (err) {
        return null;
    }
};

/**
 * Verifies a Refresh Token
 * @param {string} token - JWT Refresh Token
 * @returns {object|null} - Decoded payload or null if invalid
 */
const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, REFRESH_TOKEN_SECRET);
    } catch (err) {
        return null;
    }
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken
};
