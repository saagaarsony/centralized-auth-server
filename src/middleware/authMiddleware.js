const { verifyAccessToken } = require('../utils/jwtUtils');

/**
 * Middleware to authenticate requests using Access Token
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'Access Token Required' });
    }

    const user = verifyAccessToken(token);

    if (!user) {
        return res.status(403).json({ message: 'Invalid or Expired Access Token' });
    }

    // Attach user to request object
    req.user = user;

    next();
};

module.exports = authenticateToken;
