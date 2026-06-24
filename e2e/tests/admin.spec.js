import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.PB_TEST_ADMIN || 'admin@test.com';
const ADMIN_PASSWORD = process.env.PB_TEST_PASSWORD || 'i3_NL-dfzzFt5TX';
const BASE = process.env.PB_TEST_BASEURL || 'http://localhost:4173';

test.describe.skip('Admin backend', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState('networkidle');
    await page.getByLabel('Email').fill(ADMIN_EMAIL);
    await page.getByLabel('Password').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForURL(`${BASE}/`);
  });

  test('admin dashboard loads with stats', async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.getByText('Total Congregations')).toBeVisible();
    await expect(page.getByText('Total Users')).toBeVisible();
    await expect(page.getByText('Pending Approvals')).toBeVisible();
  });

  test('congregations list loads', async ({ page }) => {
    await page.goto(`${BASE}/admin/congregations`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Congregations');
    await expect(page.getByPlaceholder('Search congregations...')).toBeVisible();
  });

  test('approvals page loads with tabs', async ({ page }) => {
    await page.goto(`${BASE}/admin/approvals`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Approvals');
    await expect(page.getByText('New Submissions')).toBeVisible();
    await expect(page.getByText('Pending Changes')).toBeVisible();
  });

  test('users list loads', async ({ page }) => {
    await page.goto(`${BASE}/admin/users`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Users');
    await expect(page.getByPlaceholder('Search users by name or email...')).toBeVisible();
  });

  test('analytics page loads', async ({ page }) => {
    await page.goto(`${BASE}/admin/analytics`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Analytics');
    await expect(page.getByText('Congregations')).toBeVisible();
    await expect(page.getByText('Users')).toBeVisible();
  });

  test('pages list loads', async ({ page }) => {
    await page.goto(`${BASE}/admin/pages`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Pages');
  });

  test('settings page loads', async ({ page }) => {
    await page.goto(`${BASE}/admin/settings`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Settings');
    await expect(page.getByText('Node.js')).toBeVisible();
    await expect(page.getByText('SMTP')).toBeVisible();
    await expect(page.getByText('PostHog')).toBeVisible();
    await expect(page.getByText('PocketBase')).toBeVisible();
  });

  test('non-admin user is redirected from admin', async ({ page }) => {
    await page.goto(`${BASE}/logout`);
    await page.waitForLoadState('networkidle');
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState('networkidle');
    await page.getByLabel('Email').fill('regular@example.test');
    await page.getByLabel('Password').fill('TestPass123!');
    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForURL(`${BASE}/`);
    await page.goto(`${BASE}/admin`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(`${BASE}/`);
  });
});
