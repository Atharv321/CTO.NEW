import { test, expect } from '@playwright/test';

test.describe('Health Check', () => {
  test('API should be healthy', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('status');
  });

  test('should load home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/.*/, { timeout: 5000 });
    // Add more specific assertions based on your app
  });
});
