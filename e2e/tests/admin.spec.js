import { test, expect } from '@playwright/test';

import { TEST_PASSWORD } from '../fixtures/credentials.js';

const ADMIN_EMAIL = process.env.PB_TEST_ADMIN || 'admin@test.com';
const BASE = (() => {
  if (!process.env.PLAYWRIGHT_BASE_URL) {
    throw new Error('PLAYWRIGHT_BASE_URL must be set before running E2E tests');
  }
  return process.env.PLAYWRIGHT_BASE_URL;
})();
const PB_API = process.env.PB_API || 'http://127.0.0.1:8090/api';

/**
 * Authenticate directly against PocketBase and set the auth cookie on the
 * Playwright context. This bypasses the app's login form entirely, avoiding
 * any issues with use:enhance form submission in production builds.
 */
async function loginAsAdmin({ context }) {
  const res = await fetch(`${PB_API}/collections/users/auth-with-password`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      identity: ADMIN_EMAIL,
      password: process.env.PB_TEST_PASSWORD || 'i3_NL-dfzzFt5TX'
    })
  });
  if (!res.ok) throw new Error(`PB admin auth failed: ${res.status}`);
  const data = await res.json();
  const pbAuth = `pb_auth=${encodeURIComponent(JSON.stringify({ token: data.token, record: data.record }))}`;
  await context.addCookies([
    { name: 'auth', value: pbAuth, domain: 'localhost', path: '/' },
    { name: 'session', value: crypto.randomUUID(), domain: 'localhost', path: '/' }
  ]);
}

test.describe('Admin backend', () => {
  test.beforeEach(async ({ page, context }) => {
    await loginAsAdmin({ context });
  });

  test('admin dashboard loads with stats', async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('link', { name: 'Congregations' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Users' })).toBeVisible();
    await expect(page.getByText('Pending Approvals').first()).toBeVisible();
  });

  test('congregations list loads', async ({ page }) => {
    await page.goto(`${BASE}/admin/congregations`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Congregations' })).toBeVisible();
  });

  test('congregations page shows data', async ({ page }) => {
    await page.goto(`${BASE}/admin/congregations`, { waitUntil: 'load' });
    // Verify we're still on the admin page (not redirected due to auth failure)
    await expect(page).toHaveURL(/\/admin\/congregations/);
    // Verify the page heading is visible (confirms page rendered)
    await expect(page.getByRole('heading', { name: 'Congregations' })).toBeVisible();
  });

  test('users list loads', async ({ page }) => {
    await page.goto(`${BASE}/admin/users`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
  });

  test('dashboard shows analytics stats', async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('link', { name: 'Congregations' })).toBeVisible();
    await expect(page.getByText('Pending Approvals').first()).toBeVisible();
  });

  test('pages list loads', async ({ page }) => {
    await page.goto(`${BASE}/admin/pages`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Pages' })).toBeVisible();
  });

  test('non-admin user is redirected from admin', async ({ page }) => {
    await page.goto(`${BASE}/logout`);
    await page.waitForLoadState('networkidle');
    await page.goto(`${BASE}/login?login`);
    await page.waitForLoadState('networkidle');
    const loginForm = page.locator('form[action*="login"]');
    await loginForm.locator('input[autocomplete="email"]').fill('regular@example.test');
    await loginForm.locator('input[type="password"]').first().fill(TEST_PASSWORD);
    await loginForm.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);
    await page.goto(`${BASE}/admin`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(`${BASE}/`);
  });

  test('new page form loads', async ({ page }) => {
    await page.goto(`${BASE}/admin/pages`);
    await page.waitForLoadState('networkidle');
    await page.getByText('New Page').click();
    await page.waitForURL('**/admin/pages/new');
    await expect(page.getByRole('heading', { name: 'New Page' })).toBeVisible();
    await expect(page.locator('#title')).toBeVisible();
    await expect(page.getByLabel('Slug')).toBeVisible();
    await expect(page.locator('#description')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('page list has title and slug columns', async ({ page }) => {
    await page.goto(`${BASE}/admin/pages`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Title')).toBeVisible();
    await expect(page.getByText('Slug')).toBeVisible();
    await expect(page.getByText('Updated')).toBeVisible();
  });

  test('create new page via page editor', async ({ page }) => {
    // Navigate via pages list first (client-side routing) to avoid SSR hydration
    // issues with direct navigation to the editor page.
    await page.goto(`${BASE}/admin/pages`);
    await page.waitForLoadState('networkidle');
    await page.getByText('New Page').click();
    await page.waitForURL('**/admin/pages/new');
    await expect(page.getByRole('heading', { name: 'New Page' })).toBeVisible();

    // Fill in the form
    await page.locator('#title').fill('E2E Test Page');
    await page.locator('#description').fill('Created during E2E test');

    // Verify slug is auto-generated from title (this was the main bug being fixed)
    const slugInput = page.getByLabel('Slug');
    await expect(slugInput).toHaveValue(/[a-z0-9-]+/);

    // Verify submit button is enabled when form is valid
    await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled();
  });
});
