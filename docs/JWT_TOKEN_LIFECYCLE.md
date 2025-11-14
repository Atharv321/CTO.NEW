# JWT Token Lifecycle and Security

## Overview

This document describes the JWT (JSON Web Token) authentication flow, token lifecycle, and security best practices for the Barber Booking API.

## Token Types

### Access Token
- **Purpose**: Used to authenticate API requests
- **Lifetime**: 15 minutes (configurable via `JWT_ACCESS_EXPIRES_IN`)
- **Usage**: Included in the `Authorization` header as `Bearer <token>`
- **Scope**: Full access to protected resources based on user role

### Refresh Token
- **Purpose**: Used to obtain a new access token without re-authentication
- **Lifetime**: 7 days (configurable via `JWT_REFRESH_EXPIRES_IN`)
- **Usage**: Sent to `/api/auth/refresh` endpoint to get new tokens
- **Scope**: Only valid for the user who originally received it

## Authentication Flow

### 1. User Registration

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": {
      "id": "uuid",
      "name": "user"
    },
    "status": "ACTIVE",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### 2. User Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": {
      "id": "uuid",
      "name": "user"
    },
    "status": "ACTIVE",
    "lastLoginAt": "2024-01-01T00:00:00Z"
  },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### 3. Making Authenticated Requests

Include the access token in the Authorization header:

```http
GET /api/auth/me
Authorization: Bearer eyJhbGc...
```

### 4. Token Refresh

When the access token approaches expiry (or becomes invalid):

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

## Role-Based Access Control (RBAC)

### Role Hierarchy

```
admin
  ├── Full system access
  ├── Can manage users and roles
  └── Can perform all operations

manager
  ├── Can manage locations
  ├── Can manage staff
  └── Can perform most operations except user management

staff
  ├── Can perform inventory operations
  ├── Can view reports
  └── Limited to assigned location

user
  └── Minimal access to public resources
```

### Authorization Examples

**Admin-only endpoint:**
```javascript
router.post('/admin/users', verifyAccessToken, requireAdmin, async (req, res) => {
  // Only admin users can access this
});
```

**Manager and above:**
```javascript
router.get('/locations/:id', verifyAccessToken, requireManager, async (req, res) => {
  // Managers and admins can access this
});
```

**Staff and above:**
```javascript
router.post('/inventory/adjust', verifyAccessToken, requireStaff, async (req, res) => {
  // Staff, managers, and admins can access this
});
```

## Token Storage and Security

### Browser/Web Application

1. **Never store tokens in localStorage** - Vulnerable to XSS attacks
2. **Use HttpOnly cookies** for secure token storage
3. **Set Secure flag** for HTTPS-only transmission
4. **Set SameSite flag** to prevent CSRF attacks

### Mobile Application

1. Store refresh tokens in secure storage (KeyChain/KeyStore)
2. Store access tokens in memory or secure storage
3. Implement token rotation on app background

### Server-to-Server

1. Store refresh token securely
2. Validate token signature before trusting
3. Implement token rotation policies

## Environment Variables

All JWT configuration is controlled through environment variables:

```bash
# JWT Secrets (min 32 characters in production)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# Token Expiry
JWT_ACCESS_EXPIRES_IN=15m        # Access token lifetime
JWT_REFRESH_EXPIRES_IN=7d        # Refresh token lifetime
```

## Security Best Practices

### 1. Secret Management

- **Development**: Can use default values from `.env.example`
- **Staging**: Use strong random secrets (min 32 characters)
- **Production**: Use strong random secrets and rotate periodically
  
Generate strong secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Token Rotation

Implement token rotation to minimize exposure window:

```javascript
async function rotateTokens(refreshToken) {
  const decoded = await authService.verifyRefreshToken(refreshToken);
  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  
  // Invalidate old refresh token
  // Issue new tokens
  return authService.generateTokens(user);
}
```

### 3. Logout and Token Invalidation

For stateless JWT, you have options:

**Option 1: Token Blacklist (Stateful)**
```javascript
const tokenBlacklist = new Set();

router.post('/logout', verifyAccessToken, (req, res) => {
  tokenBlacklist.add(req.headers.authorization.split(' ')[1]);
  res.json({ message: 'Logged out successfully' });
});
```

**Option 2: Short-lived Tokens + Refresh Rotation (Stateless)**
```javascript
// Short-lived access tokens eliminate need for blacklist
// Long-lived refresh tokens can be rotated on each use
```

### 4. HTTPS Only

Always use HTTPS in production:

```javascript
// Enforce HTTPS
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.protocol !== 'https') {
    return res.redirect(301, `https://${req.host}${req.url}`);
  }
  next();
});
```

### 5. Rate Limiting

Protect auth endpoints from brute force:

```javascript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true
});

router.post('/login', loginLimiter, async (req, res) => {
  // Login logic
});
```

## Error Handling

### Invalid Token
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### Missing Authorization
```json
{
  "error": "Unauthorized",
  "message": "Access token required"
}
```

### Insufficient Permissions
```json
{
  "error": "Forbidden",
  "message": "This action requires one of the following roles: admin"
}
```

## Debugging

### Decode JWT Token

Inspect token claims:
```javascript
const jwt = require('jsonwebtoken');
const decoded = jwt.decode(token); // Without verification
console.log(decoded);
```

### Verify Token

Check token validity:
```javascript
const jwt = require('jsonwebtoken');
try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('Valid token:', decoded);
} catch (error) {
  console.error('Invalid token:', error.message);
}
```

## Common Issues and Solutions

### Token Expired
**Problem**: Getting 401 "Invalid or expired token"
**Solution**: Use refresh token to obtain new access token

### Token Invalid
**Problem**: Token format or signature mismatch
**Solution**: Ensure correct `Authorization: Bearer <token>` format

### Wrong Role
**Problem**: Getting 403 "Forbidden" despite valid token
**Solution**: Check user role and required permissions

### CORS Issues
**Problem**: Browser blocks request
**Solution**: Configure CORS headers for your frontend domain

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

## Monitoring and Logging

### Log Authentication Events

```javascript
app.use((req, res, next) => {
  if (req.user) {
    console.log(`[AUTH] User ${req.user.id} - ${req.method} ${req.path}`);
  }
  next();
});
```

### Alert on Suspicious Activity

```javascript
// Log failed login attempts
logger.warn({
  event: 'failed_login',
  email: req.body.email,
  ip: req.ip,
  timestamp: new Date()
});
```

## References

- [JWT.io](https://jwt.io/) - JWT information and tools
- [RFC 7519](https://tools.ietf.org/html/rfc7519) - JWT specification
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
