const { verifyAccessToken } = require('../utils/jwtUtils');
const rbacService = require('../services/rbacService');

/**
 * Middleware to authenticate user via JWT
 */
const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Authentication token required' });
    }

    const user = verifyAccessToken(token);
    if (!user) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }

    req.user = user;
    next();
};

/**
 * Middleware to authorize user based on module, feature, and permission
 * @param {string} moduleName 
 * @param {string} featureName 
 * @param {string} permissionName 
 */
const authorize = (moduleName, featureName, permissionName) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.roleId) {
                return res.status(401).json({ message: 'User not authenticated' });
            }

            const hasPermission = await rbacService.checkPermission(
                req.user.roleId,
                moduleName,
                featureName,
                permissionName
            );

            if (!hasPermission) {
                return res.status(403).json({
                    message: 'Forbidden: You do not have permission to perform this action',
                    required: { module: moduleName, feature: featureName, permission: permissionName }
                });
            }

            next();
        } catch (error) {
            console.error('Authorization Middleware Error:', error.message);
            res.status(500).json({ message: 'Internal Server Error during authorization' });
        }
    };
};

module.exports = {
    authenticate,
    authorize
};
