const app = require('./server');

describe('Web', () => {
  test('exports express app', () => {
    expect(app).toBeDefined();
    expect(typeof app).toBe('function');
  });
});
