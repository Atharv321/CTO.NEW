# Authentication & Authorization Module

## Overview

The Auth Module provides comprehensive JWT-based authentication with role-based access control (RBAC) for the Barber Booking API.

## Quick Start

### 1. Bootstrap Initial Users

```bash
cd api
npm run db:seed  # Seed default roles
node scripts/bootstrap-users.js
```

Default test users are created:
- **Admin**: `admin@example.com` / `AdminPassword123!`
- **Manager**: `manager@example.com` / `ManagerPassword123!`
- **Staff**: `staff@example.com` / `StaffPassword123!`

### 2. User Registration

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

Response:
```json
{
  "user": {
    "id": "uuid",
    "email": "newuser@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": { "name": "user" },
    "status": "ACTIVE"
  },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### 3. User Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "AdminPassword123!"
  }'
```

### 4. Access Protected Resources

```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

### 5. Refresh Access Token

```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<refreshToken>"
  }'
```

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/register
Register a new user

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "user": { ... },
  "tokens": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

#### POST /api/auth/login
Authenticate user and receive tokens

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "user": { ... },
  "tokens": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

#### POST /api/auth/refresh
Refresh access token using refresh token

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

#### GET /api/auth/me
Get current user information

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": { "name": "user" },
  "status": "ACTIVE"
}
```

#### POST /api/auth/change-password
Change user password

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "oldPassword": "CurrentPassword123!",
  "newPassword": "NewPassword123!"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

## Middleware Usage

### verifyAccessToken
Verify JWT and inject user context

```javascript
const { verifyAccessToken } = require('../middleware/auth');

router.get('/protected', verifyAccessToken, (req, res) => {
  res.json({ user: req.user }); // req.user available
});
```

### Role-Based Guards

```javascript
const { verifyAccessToken, requireAdmin, requireManager, requireStaff } = require('../middleware/auth');

// Admin only
router.post('/admin/users', verifyAccessToken, requireAdmin, handler);

// Manager and admin
router.get('/staff', verifyAccessToken, requireManager, handler);

// Staff and above
router.post('/inventory', verifyAccessToken, requireStaff, handler);

// Custom roles
const { requireRole } = require('../middleware/auth');
router.get('/custom', verifyAccessToken, requireRole('admin', 'manager'), handler);
```

### Optional User Context

```javascript
const { injectUserContext } = require('../middleware/auth');

// Works with or without token
router.get('/public', injectUserContext, (req, res) => {
  if (req.user) {
    res.json({ message: `Hello, ${req.user.email}` });
  } else {
    res.json({ message: 'Hello, guest' });
  }
});
```

## RBAC Roles

### Role Hierarchy

```
ADMIN
  ↓ (can do everything admin can)
MANAGER
  ↓ (can do everything manager can)
STAFF
  ↓ (can do everything staff can)
USER
```

### Default Roles

| Role | Description | Typical Permissions |
|------|-------------|-------------------|
| **admin** | Full system access | User management, system config |
| **manager** | Location management | Staff management, location config |
| **staff** | Operational tasks | Inventory operations |
| **user** | Limited access | View own profile |

## Configuration

### Environment Variables

```bash
# JWT Secrets (min 32 characters in production)
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Token Expiry
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### Generate Secure Secrets

```bash
# Generate a secure secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Token Lifecycle

### Authorization Flow

```
1. Register/Login
   └─→ Receive accessToken + refreshToken

2. Use accessToken to access resources
   └─→ Include in Authorization: Bearer <token> header

3. Token expiration check
   ├─→ Still valid: continue
   └─→ Expired: use refreshToken

4. Refresh Token
   ├─→ Send refreshToken to /api/auth/refresh
   └─→ Receive new accessToken + refreshToken

5. Invalid refresh token
   └─→ User must re-authenticate
```

### Token Details

**Access Token:**
- Lifetime: 15 minutes (configurable)
- Claims: userId, email, role
- Usage: Every API request
- Storage: HttpOnly cookie (recommended) or memory

**Refresh Token:**
- Lifetime: 7 days (configurable)
- Claims: userId
- Usage: Get new access token
- Storage: HttpOnly cookie (recommended) or secure storage

## Authentication Service

The `AuthService` handles all authentication logic:

```javascript
const authService = require('../services/authService');

// Register
const user = await authService.registerUser({
  email: 'user@example.com',
  password: 'SecurePassword123!',
  firstName: 'John',
  lastName: 'Doe'
});

// Login
const { user, tokens } = await authService.loginUser(
  'user@example.com',
  'SecurePassword123!'
);

// Generate tokens
const tokens = await authService.generateTokens(user);

// Verify token
const decoded = await authService.verifyAccessToken(token);

// Change password
await authService.changePassword(userId, oldPassword, newPassword);

// Bootstrap admin
const admin = await authService.createBootstrapUser(
  'admin@example.com',
  'Admin',
  'User',
  'password',
  'admin'
);
```

## Testing

### Run Tests

```bash
npm test -- tests/authService.test.js
npm test -- tests/rbac.test.js
```

### Test Coverage

- ✓ User registration
- ✓ User login with password validation
- ✓ Token generation and verification
- ✓ Token refresh
- ✓ Password change
- ✓ Role-based access control
- ✓ Middleware protection
- ✓ Error handling

### Manual Testing

#### Register user
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

#### Access protected endpoint
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <token>"
```

## Security Considerations

1. **Always use HTTPS in production** - Tokens should be transmitted over encrypted connections
2. **Store tokens securely** - Use HttpOnly cookies or secure storage
3. **Use strong secrets** - Minimum 32 characters, randomly generated
4. **Rotate secrets periodically** - Implement key rotation strategy
5. **Implement rate limiting** - Protect auth endpoints from brute force
6. **Log authentication events** - Monitor for suspicious activity
7. **Validate passwords** - Enforce strong password policies
8. **Handle token expiry gracefully** - Refresh or re-authenticate
9. **Audit access changes** - Log permission modifications
10. **Use environment variables** - Never commit secrets to repository

## Troubleshooting

### "Invalid token" Error
- Check token format: `Authorization: Bearer <token>`
- Verify token hasn't expired
- Ensure JWT_SECRET matches in environment
- Check token claims: `jwt.decode(token)`

### "Forbidden" Error
- User doesn't have required role
- Check user's role in database
- Verify middleware order (verify before role check)

### "User already exists" Error
- Try registering with different email
- Check if email exists: `SELECT * FROM users WHERE email = '...'`

### Token Not Refreshing
- Verify refresh token is valid and not expired
- Check JWT_REFRESH_SECRET configuration
- Ensure refresh token matches stored token

## Production Deployment

### Pre-deployment Checklist

- [ ] All environment variables configured
- [ ] JWT secrets are strong (32+ chars) and random
- [ ] HTTPS is enabled
- [ ] Password validation rules in place
- [ ] Rate limiting configured
- [ ] Audit logging enabled
- [ ] CORS configured correctly
- [ ] Tests passing
- [ ] Documentation reviewed

### Environment Variables

```bash
# Generate secrets
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Set in production environment
export JWT_SECRET=$JWT_SECRET
export JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
```

## API Documentation

Full Swagger/OpenAPI documentation available at:
- Development: http://localhost:3001/api-docs
- Production: https://api.example.com/api-docs

## Related Documentation

- [JWT Token Lifecycle](./JWT_TOKEN_LIFECYCLE.md)
- [RBAC Guide](./RBAC_GUIDE.md)
- [Secrets Management](./secrets-management.md)
