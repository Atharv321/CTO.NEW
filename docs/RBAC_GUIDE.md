# Role-Based Access Control (RBAC) Guide

## Overview

This guide explains the Role-Based Access Control (RBAC) system implemented in the Barber Booking API. RBAC allows you to control which users can access which resources based on their assigned roles.

## Available Roles

### 1. Admin
- **Description**: Full system access
- **Permissions**:
  - User management (create, read, update, delete)
  - Role management
  - Location management
  - Inventory management
  - System configuration
  - View audit logs
  - Generate reports

### 2. Manager
- **Description**: Location and staff management
- **Permissions**:
  - Manage staff within their location
  - Manage inventory for their location
  - View and manage bookings
  - Generate location-specific reports
  - Cannot manage other locations or users outside their scope

### 3. Staff
- **Description**: Inventory and operational tasks
- **Permissions**:
  - Perform inventory transactions (receive, consume, adjust)
  - View stock levels
  - Create stock counts
  - View bookings
  - Cannot create or manage users
  - Cannot manage locations

### 4. User
- **Description**: Limited public access
- **Permissions**:
  - View own profile
  - Update own information
  - View public information

## Role Hierarchy

```
┌─────────────────────────────────────────┐
│            ADMIN                        │
│   (Full System Access)                  │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│           MANAGER                       │
│  (Location & Staff Management)          │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│            STAFF                        │
│  (Operational Tasks)                    │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│            USER                         │
│  (Basic Access)                         │
└─────────────────────────────────────────┘
```

## Implementation

### Middleware Functions

#### `verifyAccessToken(req, res, next)`
Verifies the JWT access token and injects user context.

```javascript
const { verifyAccessToken } = require('./middleware/auth');

router.get('/protected', verifyAccessToken, (req, res) => {
  // req.user contains: { id, email, role }
  res.json({ user: req.user });
});
```

#### `requireRole(...roles)`
Restricts access to specific roles.

```javascript
const { requireRole } = require('./middleware/auth');

// Only admins and managers
router.post('/locations', verifyAccessToken, requireRole('admin', 'manager'), (req, res) => {
  // Implementation
});
```

#### `requireAdmin`
Shorthand for admin-only access.

```javascript
const { requireAdmin } = require('./middleware/auth');

router.delete('/users/:id', verifyAccessToken, requireAdmin, (req, res) => {
  // Only admins can delete users
});
```

#### `requireManager`
Allows managers and admins.

```javascript
const { requireManager } = require('./middleware/auth');

router.get('/staff', verifyAccessToken, requireManager, (req, res) => {
  // Managers and admins can view staff
});
```

#### `requireStaff`
Allows staff, managers, and admins.

```javascript
const { requireStaff } = require('./middleware/auth');

router.post('/inventory/adjust', verifyAccessToken, requireStaff, (req, res) => {
  // Staff and above can adjust inventory
});
```

#### `injectUserContext(req, res, next)`
Optional - injects user context if token is present, sets to null otherwise.

```javascript
const { injectUserContext } = require('./middleware/auth');

// Optional auth - endpoint works with or without token
router.get('/public-info', injectUserContext, (req, res) => {
  if (req.user) {
    res.json({ message: 'Personalized data for ' + req.user.email });
  } else {
    res.json({ message: 'Public data' });
  }
});
```

## Usage Examples

### Example 1: Admin-Only Endpoint

```javascript
const express = require('express');
const { verifyAccessToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/admin/users:
 *   post:
 *     summary: Create a new user (Admin only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               roleId:
 *                 type: string
 */
router.post('/users', verifyAccessToken, requireAdmin, async (req, res) => {
  try {
    const { email, firstName, lastName, roleId } = req.body;
    
    // User creation logic
    const user = await userService.createUser({
      email,
      firstName,
      lastName,
      roleId
    });
    
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
```

### Example 2: Manager-Level Endpoint

```javascript
/**
 * Manager and above can manage their location's inventory
 */
router.post('/locations/:locationId/inventory', 
  verifyAccessToken, 
  requireManager, 
  async (req, res) => {
    try {
      const { locationId } = req.params;
      const { itemId, quantity, action } = req.body;
      
      // Check if manager has access to this location
      const hasAccess = await locationService.userHasAccess(
        req.user.id, 
        locationId
      );
      
      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'You do not have access to this location' 
        });
      }
      
      const result = await inventoryService.updateInventory({
        locationId,
        itemId,
        quantity,
        action,
        performedBy: req.user.id
      });
      
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
});
```

### Example 3: Staff-Level Endpoint

```javascript
/**
 * Staff and above can perform inventory transactions
 */
router.post('/inventory/receive',
  verifyAccessToken,
  requireStaff,
  async (req, res) => {
    try {
      const { locationId, itemId, quantity } = req.body;
      
      const transaction = await inventoryService.receiveStock({
        locationId,
        itemId,
        quantity,
        performedBy: req.user.id,
        timestamp: new Date()
      });
      
      res.status(201).json(transaction);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
});
```

### Example 4: Dynamic Role Checking

```javascript
/**
 * Custom role-based logic
 */
router.get('/dashboard/:type', verifyAccessToken, async (req, res) => {
  const { type } = req.params;
  const user = req.user;
  
  // Generate dashboard based on role
  if (user.role === 'admin') {
    return res.json(await dashboardService.getAdminDashboard());
  } else if (user.role === 'manager') {
    return res.json(await dashboardService.getManagerDashboard(user.id));
  } else if (user.role === 'staff') {
    return res.json(await dashboardService.getStaffDashboard(user.id));
  } else {
    return res.json(await dashboardService.getPublicDashboard());
  }
});
```

## Implementing Custom Role Checks

### Location-Based Access

```javascript
async function requireLocationAccess(locationId) {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      // Admins have access to all locations
      if (user.role === 'admin') {
        return next();
      }
      
      // Check if user has access to this location
      const access = await prisma.userLocation.findFirst({
        where: {
          userId: user.id,
          locationId: locationId
        }
      });
      
      if (!access) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have access to this location'
        });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}

// Usage
router.get('/locations/:locationId/items', 
  verifyAccessToken,
  requireLocationAccess(req.params.locationId),
  async (req, res) => {
    // Implementation
  }
);
```

### Permission Matrix

```javascript
const rolePermissions = {
  admin: [
    'create_user',
    'read_user',
    'update_user',
    'delete_user',
    'create_location',
    'read_location',
    'update_location',
    'delete_location',
    'view_audit_logs',
    'manage_roles'
  ],
  manager: [
    'read_user',
    'update_user',
    'read_location',
    'update_location',
    'create_inventory',
    'read_inventory',
    'update_inventory',
    'view_location_reports'
  ],
  staff: [
    'read_user',
    'update_user',
    'read_inventory',
    'create_inventory_transaction',
    'read_inventory_transaction'
  ],
  user: [
    'read_user',
    'update_user'
  ]
};

function requirePermission(permission) {
  return (req, res, next) => {
    const userRole = req.user.role;
    const permissions = rolePermissions[userRole] || [];
    
    if (!permissions.includes(permission)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Permission '${permission}' is required`
      });
    }
    
    next();
  };
}
```

## Testing RBAC

### Unit Tests

```javascript
describe('RBAC Middleware', () => {
  describe('requireAdmin', () => {
    it('should allow admin access', async () => {
      const token = jwt.sign(
        { userId: 'admin-1', email: 'admin@example.com', role: 'admin' },
        JWT_SECRET
      );
      
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).not.toBe(403);
    });
    
    it('should deny manager access', async () => {
      const token = jwt.sign(
        { userId: 'manager-1', email: 'manager@example.com', role: 'manager' },
        JWT_SECRET
      );
      
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(403);
    });
  });
});
```

## Audit Logging

Log role-based access for security auditing:

```javascript
function auditAccess(action) {
  return async (req, res, next) => {
    const user = req.user;
    
    // Log the access attempt
    await prisma.auditLog.create({
      data: {
        entityName: 'AccessControl',
        entityId: user.id,
        action: action,
        userId: user.id,
        metadata: {
          role: user.role,
          endpoint: req.path,
          method: req.method,
          timestamp: new Date()
        }
      }
    });
    
    next();
  };
}

router.delete('/users/:id', 
  verifyAccessToken,
  requireAdmin,
  auditAccess('DELETE_USER'),
  async (req, res) => {
    // Implementation
  }
);
```

## Best Practices

1. **Always verify token first** - Use `verifyAccessToken` before any role check
2. **Fail securely** - Return 403 Forbidden, not 404 Not Found
3. **Log access violations** - Track failed authorization attempts
4. **Use role hierarchy** - Don't require all roles manually if hierarchical
5. **Keep roles simple** - Avoid too many granular roles
6. **Document permissions** - Clearly specify what each role can do
7. **Test edge cases** - Test role boundaries and transitions
8. **Audit changes** - Log when permissions are granted/revoked

## Migration and Deployment

### Adding a New Role

1. Add role to database:
```bash
psql -d appdb -c "INSERT INTO roles (name, description) VALUES ('viewer', 'Read-only access')"
```

2. Update role constants
3. Add middleware for new role
4. Update documentation
5. Deploy and test

### Changing Role Permissions

1. Update database schema if needed
2. Update middleware
3. Run migration
4. Update tests
5. Deploy with backward compatibility in mind

## Troubleshooting

### "Forbidden" Error When Expecting Access
- Check token is valid
- Verify user role in token matches JWT_SECRET
- Ensure middleware order is correct (verify before role check)

### Can't Create Test User with Specific Role
- Verify role exists in database
- Use bootstrap script to seed roles
- Check role name matches exactly

### Token Works Locally but Not in Production
- Verify JWT_SECRET is consistent
- Check token expiry settings
- Verify user role was saved correctly

## References

- [OWASP Access Control](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [NIST Access Control Guide](https://csrc.nist.gov/publications/detail/sp/800-88/final)
