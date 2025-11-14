const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Mock database - in production, this would be a real database
const users = [
  {
    id: '1',
    email: 'admin@example.com',
    password: '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', // 'password'
    name: 'Admin User',
    role: 'admin',
    locations: [
      { id: 'loc1', name: 'Main Warehouse', address: '123 Main St' },
      { id: 'loc2', name: 'Secondary Warehouse', address: '456 Oak Ave' },
    ],
    currentLocation: { id: 'loc1', name: 'Main Warehouse', address: '123 Main St' },
  },
  {
    id: '2',
    email: 'manager@example.com',
    password: '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', // 'password'
    name: 'Manager User',
    role: 'manager',
    locations: [
      { id: 'loc1', name: 'Main Warehouse', address: '123 Main St' },
    ],
    currentLocation: { id: 'loc1', name: 'Main Warehouse', address: '123 Main St' },
  },
  {
    id: '3',
    email: 'user@example.com',
    password: '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', // 'password'
    name: 'Regular User',
    role: 'user',
    locations: [
      { id: 'loc1', name: 'Main Warehouse', address: '123 Main St' },
    ],
    currentLocation: { id: 'loc1', name: 'Main Warehouse', address: '123 Main St' },
  },
];

// Store refresh tokens (in production, use Redis or database)
const refreshTokens = new Set();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_EXPIRES_IN = '15m';
const JWT_REFRESH_EXPIRES_IN = '7d';

// Generate JWT tokens
function generateTokens(user) {
  const accessToken = jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
    },
    JWT_SECRET
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );

  refreshTokens.add(refreshToken);

  return { accessToken, refreshToken };
}

// Find user by email
function findUserByEmail(email) {
  return users.find(user => user.email === email);
}

// Find user by ID
function findUserById(id) {
  return users.find(user => user.id === id);
}

// Create user response object (without password)
function createUserResponse(user) {
  const { password, ...userResponse } = user;
  return userResponse;
}

// Middleware to verify access token
function verifyAccessToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = findUserById(decoded.userId);
    if (!req.user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const tokens = generateTokens(user);
    const userResponse = createUserResponse(user);

    res.json({
      user: userResponse,
      tokens,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role = 'user' } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Email, password, and name are required' });
    }

    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: (users.length + 1).toString(),
      email,
      password: hashedPassword,
      name,
      role,
      locations: [],
      currentLocation: null,
    };

    users.push(newUser);
    const tokens = generateTokens(newUser);
    const userResponse = createUserResponse(newUser);

    res.status(201).json({
      user: userResponse,
      tokens,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', verifyAccessToken, (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    refreshTokens.delete(refreshToken);
  }
  res.json({ message: 'Logged out successfully' });
});

// POST /api/auth/refresh
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token required' });
  }

  if (!refreshTokens.has(refreshToken)) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = findUserById(decoded.userId);

    if (!user) {
      refreshTokens.delete(refreshToken);
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Remove old refresh token and generate new ones
    refreshTokens.delete(refreshToken);
    const tokens = generateTokens(user);

    res.json(tokens);
  } catch (error) {
    refreshTokens.delete(refreshToken);
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// GET /api/auth/me
router.get('/me', verifyAccessToken, (req, res) => {
  res.json(createUserResponse(req.user));
});

// POST /api/auth/switch-location
router.post('/switch-location', verifyAccessToken, (req, res) => {
  const { locationId } = req.body;

  if (!locationId) {
    return res.status(400).json({ message: 'Location ID is required' });
  }

  const location = req.user.locations.find(loc => loc.id === locationId);
  if (!location) {
    return res.status(404).json({ message: 'Location not found' });
  }

  req.user.currentLocation = location;
  res.json(createUserResponse(req.user));
});

// POST /api/auth/password-reset-request
router.post('/password-reset-request', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const user = findUserByEmail(email);
  if (!user) {
    // Always return success to prevent email enumeration
    return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  }

  // In production, send email with reset token
  const resetToken = jwt.sign(
    { userId: user.id, type: 'password-reset' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  console.log(`Password reset token for ${email}: ${resetToken}`);
  
  res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
});

// POST /api/auth/password-reset
router.post('/password-reset', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password are required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.type !== 'password-reset') {
      return res.status(400).json({ message: 'Invalid token type' });
    }

    const user = findUserById(decoded.userId);
    if (!user) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }
});

module.exports = router;