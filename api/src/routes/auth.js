const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../db');
const { generateToken } = require('../middleware/auth');
const {
  validate,
  loginSchema,
  magicLinkRequestSchema,
  magicLinkVerifySchema,
} = require('../validators');

const router = express.Router();

// Login with email and password
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await db.query(
      'SELECT id, email, password_hash, name FROM admins WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    const admin = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    const token = generateToken({
      id: admin.id,
      email: admin.email,
      name: admin.name,
    });

    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process login',
    });
  }
});

// Request magic link
router.post('/magic-link', validate(magicLinkRequestSchema), async (req, res) => {
  try {
    const { email } = req.body;

    // Check if admin exists
    const adminResult = await db.query(
      'SELECT id FROM admins WHERE email = $1',
      [email]
    );

    if (adminResult.rows.length === 0) {
      // Return success even if email doesn't exist (security best practice)
      return res.json({
        message: 'If the email exists, a magic link has been sent',
      });
    }

    // Generate magic link token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await db.query(
      'INSERT INTO magic_links (email, token, expires_at) VALUES ($1, $2, $3)',
      [email, token, expiresAt]
    );

    // In a real application, you would send this via email
    console.log(`Magic link for ${email}: /auth/verify-magic-link?token=${token}`);

    res.json({
      message: 'If the email exists, a magic link has been sent',
      // For development/testing purposes only - remove in production
      ...(process.env.NODE_ENV === 'development' && { token }),
    });
  } catch (error) {
    console.error('Magic link request error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process magic link request',
    });
  }
});

// Verify magic link
router.post('/verify-magic-link', validate(magicLinkVerifySchema), async (req, res) => {
  try {
    const { token } = req.body;

    const result = await db.query(
      `SELECT ml.email, ml.expires_at, ml.used, a.id, a.name 
       FROM magic_links ml
       JOIN admins a ON ml.email = a.email
       WHERE ml.token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired magic link',
      });
    }

    const magicLink = result.rows[0];

    if (magicLink.used) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Magic link has already been used',
      });
    }

    if (new Date(magicLink.expires_at) < new Date()) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Magic link has expired',
      });
    }

    // Mark magic link as used
    await db.query('UPDATE magic_links SET used = true WHERE token = $1', [token]);

    const jwtToken = generateToken({
      id: magicLink.id,
      email: magicLink.email,
      name: magicLink.name,
    });

    res.json({
      token: jwtToken,
      admin: {
        id: magicLink.id,
        email: magicLink.email,
        name: magicLink.name,
      },
    });
  } catch (error) {
    console.error('Magic link verification error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to verify magic link',
    });
  }
});

module.exports = router;
