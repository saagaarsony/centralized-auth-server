const http = require('http');

const makeRequest = (method, path, body = null, token = null) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: data ? JSON.parse(data) : {} });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
};

const runTests = async () => {
    console.log('--- Starting Auth System Tests ---');

    // 1. Login
    console.log('\n[1] Testing Login...');
    const loginRes = await makeRequest('POST', '/auth/login', {
        email: 'admin@example.com',
        password: 'adminpassword'
    });

    if (loginRes.status !== 200) {
        console.error('Login Failed:', loginRes.body);
        return;
    }
    console.log('Login Success!');
    const { accessToken, refreshToken, user } = loginRes.body;
    console.log(`Access Token: ${accessToken.substring(0, 20)}...`);
    console.log(`Refresh Token: ${refreshToken.substring(0, 20)}...`);

    // 2. Verify Access Token
    console.log('\n[2] Testing Token Verification...');
    const verifyRes = await makeRequest('GET', '/auth/verify', null, accessToken);
    if (verifyRes.status === 200 && verifyRes.body.valid) {
        console.log('Verification Success:', verifyRes.body.user.email);
    } else {
        console.error('Verification Failed:', verifyRes.body);
    }

    // 3. Refresh Token
    console.log('\n[3] Testing Token Refresh...');
    const refreshRes = await makeRequest('POST', '/auth/refresh', { refresh_token: refreshToken });
    if (refreshRes.status === 200 && refreshRes.body.accessToken) {
        console.log('Refresh Success! New Access Token:', refreshRes.body.accessToken.substring(0, 20) + '...');
    } else {
        console.error('Refresh Failed:', refreshRes.body);
    }

    // 4. Logout
    console.log('\n[4] Testing Logout...');
    const logoutRes = await makeRequest('POST', '/auth/logout', { refresh_token: refreshToken });
    if (logoutRes.status === 200) {
        console.log('Logout Success:', logoutRes.body.message);
    } else {
        console.error('Logout Failed:', logoutRes.body);
    }

    // 5. Verify Refresh after Logout (Should Fail)
    console.log('\n[5] Testing Refresh after Logout (Should Fail)...');
    const refreshFailRes = await makeRequest('POST', '/auth/refresh', { refresh_token: refreshToken });
    if (refreshFailRes.status === 403) {
        console.log('Success: Refresh token rejected after logout.');
    } else {
        console.error('Failure: Refresh token still valid or unexpected error:', refreshFailRes.status, refreshFailRes.body);
    }

    console.log('\n--- Tests Completed ---');
};

// Wait for server to start (manual delay or just run this after starting server)
// For this script, we assume server is running.
runTests().catch(err => console.error(err));
