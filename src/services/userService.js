const axios = require('axios');
require('dotenv').config();

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'https://bimcapability.com/employee-portal/api';

/**
 * Fetches user data from external API by email.
 * @param {string} email 
 * @returns {Promise<Object|null>} User object containing id, email, password_hash, role
 */
async function fetchUserByEmail(email) {
    try {
        // Based on user request: https://bimcapability.com/employee-portal/api/user-email?email=...
        const response = await axios.get(`${USER_SERVICE_URL}/user-email`, {
            params: { email }
        });

        if (response.data && response.data.status && response.data.data) {
            const userData = response.data.data;
            console.log('User data fetched from API for:', email);

            // Normalize PHP bcrypt hash: replace $2y$ with $2b$ for Node.js compatibility
            let hash = userData.emp_password;
            if (hash && hash.startsWith('$2y$')) {
                hash = hash.replace('$2y$', '$2b$');
            }

            console.log('Normalized Password Hash:', hash);

            return {
                id: parseInt(userData.main_employee_id, 10),
                email: userData.employee_email,
                password_hash: hash,
                role: userData.user_role === '3' ? 'admin' : 'user'
            };
        }
        return null;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return null;
        }
        console.error('External User API Error:', error.message);
        throw new Error('User Service Unavailable');
    }
}

module.exports = {
    fetchUserByEmail
};
