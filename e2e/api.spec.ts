import { test, expect } from '@playwright/test';

test.describe('API Integration', () => {
  test('should handle API requests', async ({ request }) => {
    // Example: Test API endpoints
    const response = await request.get('/health');
    expect(response.status()).toBe(200);
  });

  test('should handle errors gracefully', async ({ request }) => {
    const response = await request.get('/api/nonexistent');
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('should validate request/response format', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(typeof body).toBe('object');
  });
});
