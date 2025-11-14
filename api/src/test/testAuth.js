const jwt = require('jsonwebtoken');

const JWT_SECRET = 'test-secret-key';

function generateTestToken(userData = {}) {
  const defaultData = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    role: 'operator',
    ...userData,
  };

  return jwt.sign(defaultData, JWT_SECRET, { expiresIn: '1h' });
}

function generateTokenWithRole(role) {
  return generateTestToken({ role });
}

function generateAdminToken() {
  return generateTokenWithRole('admin');
}

function generateManagerToken() {
  return generateTokenWithRole('manager');
}

function generateOperatorToken() {
  return generateTokenWithRole('operator');
}

function generateViewerToken() {
  return generateTokenWithRole('viewer');
}

module.exports = {
  JWT_SECRET,
  generateTestToken,
  generateTokenWithRole,
  generateAdminToken,
  generateManagerToken,
  generateOperatorToken,
  generateViewerToken,
};
