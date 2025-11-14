module.exports = {
  testEnvironment: 'node',
  testTimeout: 10000,
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    'server.js',
    '!src/db/migrations/**'
  ]
};
