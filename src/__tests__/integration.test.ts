import { chromium, Page, test } from '@playwright/test';

test.describe('Login Flow', () => {
  let page: Page;
  const VITE_URL = 'http://localhost:3000';

  test.beforeAll(async () => {
    const browser = await chromium.launch();
    page = await browser.newPage();
  });

  test('should login and redirect to dashboard', async () => {
    await page.goto(`${VITE_URL}/login`);
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${VITE_URL}/dashboard`);
    // check that the dashboard is rendered
    const dashboardTitle = await page.textContent('h1');
    expect(dashboardTitle).toBe('Dashboard');
  });
});