import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.PB_TEST_ADMIN || 'admin@test.com';
const BASE = process.env.PB_TEST_BASEURL || 'http://localhost:4173';

test.describe('Admin backend', () => {
  test.beforeEach(async ({ page }) => {
    // Login via the app's login form
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState('networkidle');
    const loginForm = page.locator('form[action*="login"]');
    await loginForm.locator('input[autocomplete="email"]').fill(ADMIN_EMAIL);
    await loginForm.locator('input[type="password"]').first().fill(process.env.PB_TEST_PASSWORD || 'i3_NL-dfzzFt5TX');
    await loginForm.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);
  });

  test('admin dashboard loads with stats', async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('Congregations')).toBeVisible();
    await expect(page.getByText('Users')).toBeVisible();
    await expect(page.getByText('Pending Approvals')).toBeVisible();
  });

  test('congregations list loads', async ({ page }) => {
    await page.goto(`${BASE}/admin/congregations`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Congregations')).toBeVisible();
    await expect(page.getByPlaceholder('Search congregations...')).toBeVisible();
  });

  test('approvals page loads with tabs', async ({ page }) => {
    await page.goto(`${BASE}/admin/approvals`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Approvals')).toBeVisible();
    await expect(page.getByText('New Submissions')).toBeVisible();
  });

  test('users list loads', async ({ page }) => {
    await page.goto(`${BASE}/admin/users`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Users')).toBeVisible();
    await expect(page.getByPlaceholder('Search users...')).toBeVisible();
  });

  test('analytics page loads', async ({ page }) => {
    await page.goto(`${BASE}/admin/analytics`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Analytics')).toBeVisible();
  });

  test('pages list loads', async ({ page }) => {
    await page.goto(`${BASE}/admin/pages`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Pages')).toBeVisible();
  });

  test('settings page loads', async ({ page }) => {
    await page.goto(`${BASE}/admin/settings`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Settings')).toBeVisible();
    await expect(page.getByText('Node.js')).toBeVisible();
    await expect(page.getByText('SMTP')).toBeVisible();
  });

  test('non-admin user is redirected from admin', async ({ page }) => {
    await page.goto(`${BASE}/logout`);
    await page.waitForLoadState('networkidle');
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState('networkidle');
    const loginForm = page.locator('form[action*="login"]');
    await loginForm.locator('input[autocomplete="email"]').fill('regular@example.test');
    await loginForm.locator('input[type="password"]').first().fill('TestPass123!');
    await loginForm.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);
    await page.goto(`${BASE}/admin`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(`${BASE}/`);
  });
});
