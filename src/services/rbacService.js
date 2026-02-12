const db = require('../config/database');

/**
 * Checks if a role has permission for a specific feature within a module.
 * Optimized SQL query using JOINs across RBAC tables.
 * 
 * @param {number} roleId 
 * @param {string} moduleName 
 * @param {string} featureName 
 * @param {string} permissionName 
 * @returns {Promise<boolean>}
 */
async function checkPermission(roleId, moduleName, featureName, permissionName) {
    try {
        const query = `
            SELECT COUNT(*) AS has_permission
            FROM role_permissions rp
            JOIN features f ON rp.feature_id = f.id
            JOIN modules m ON f.module_id = m.id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE rp.role_id = ?
              AND m.name = ?
              AND f.name = ?
              AND p.name = ?
        `;

        const [rows] = await db.execute(query, [roleId, moduleName, featureName, permissionName]);

        return rows[0].has_permission > 0;
    } catch (error) {
        console.error('RBAC Permission Check Error:', error.message);
        throw new Error('Authorization check failed');
    }
}

module.exports = {
    checkPermission
};
