# Centralized Authentication System

A Node.js based centralized authentication server using Express, SQLite, and JWT.

## Features
- **Login**: Issues Access (15m) and Refresh (7d) tokens.
- **Session Management**: Stores login sessions in SQLite database.
- **Token Verification**: Endpoint for external modules to verify tokens.
- **Token Refresh**: Rotate access tokens using refresh tokens.
- **Logout**: Revokes refresh tokens and updates session status.

## Prerequisites
- Node.js (v14+)
- npm

## Setup & Run
1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Start Server**:
    ```bash
    node app.js
    ```
    Server runs on `http://localhost:3000`.

## API Endpoints

### 1. Login
- **URL**: `POST /auth/login`
- **Body**: `{ "email": "admin@example.com", "password": "adminpassword" }`
- **Response**: `{ "accessToken": "...", "refreshToken": "...", "user": {...} }`

### 2. Verify Token
- **URL**: `GET /auth/verify`
- **Headers**: `Authorization: Bearer <access_token>`
- **Response**: `{ "valid": true, "user": {...} }`

### 3. Refresh Token
- **URL**: `POST /auth/refresh`
- **Body**: `{ "refresh_token": "..." }`
- **Response**: `{ "accessToken": "..." }`

### 4. Logout
- **URL**: `POST /auth/logout`
- **Body**: `{ "refresh_token": "..." }`
- **Response**: `{ "message": "Logged out successfully" }`

## Testing
Run the included automated test script:
```bash
node test_auth_flow.js
```

## Mock Users
Check `users.json` for available credentials.
- `admin@example.com` / `adminpassword`
- `user@example.com` / `userpassword`
