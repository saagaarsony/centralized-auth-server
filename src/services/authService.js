const bcrypt = require('bcrypt');
const db = require('../config/database');
const userService = require('./userService');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwtUtils');

/**
 * Handles user login logic.
 * @param {string} email 
 * @param {string} password 
 * @param {object} metadata - ip, userAgent
 */
async function login(email, password, metadata = {}) {
    // 1. Fetch user from external API
    const externalUser = await userService.fetchUserByEmail(email);
    if (!externalUser) {
        throw new Error('Invalid credentials');
    }

    // 2. Compare password with bcrypt
    const isMatch = await bcrypt.compare(password, externalUser.password_hash);
    if (!isMatch) {
        throw new Error('Invalid credentials');
    }

    // 3. Fetch role_id from local MySQL users table or auto-provision
    let [userRows] = await db.execute(
        'SELECT id, role_id FROM users WHERE email = ?',
        [email]
    );

    let localUser;
    let roleId;

    if (userRows.length === 0) {
        // Auto-provision user if they exist in external API but not locally
        console.log(`Auto-provisioning user: ${email}`);

        // Fetch role_id by name dynamically
        const targetRoleName = externalUser.role === 'admin' ? 'admin' : 'employee';
        const [roleRows] = await db.execute('SELECT id FROM roles WHERE name = ?', [targetRoleName]);

        let roleIdFromDb = roleRows.length > 0 ? roleRows[0].id : null;

        if (!roleIdFromDb) {
            // Fallback: fetch any role or use a conservative ID
            const [anyRole] = await db.execute('SELECT id FROM roles LIMIT 1');
            roleIdFromDb = anyRole.length > 0 ? anyRole[0].id : 3;
        }

        const [insertResult] = await db.execute(
            'INSERT INTO users (name, email, role_id) VALUES (?, ?, ?)',
            [email.split('@')[0], email, roleIdFromDb]
        );

        roleId = roleIdFromDb;
        localUser = { id: insertResult.insertId, role_id: roleId };
    } else {
        localUser = userRows[0];
        roleId = localUser.role_id;
    }

    // 4. Generate Tokens
    const tokenPayload = {
        id: localUser.id,
        email: email,
        roleId: roleId
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // 5. Save Session
    await db.execute(
        `INSERT INTO sessions (user_id, email, role, module_name, refresh_token, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [localUser.id, email, 'N/A', 'N/A', refreshToken, metadata.ip || '0.0.0.0', metadata.userAgent || 'Unknown']
    );

    return {
        accessToken,
        refreshToken,
        user: {
            id: localUser.id,
            email: email,
            roleId: roleId
        }
    };
}

module.exports = {
    login
};
