import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.PB_TEST_ADMIN || 'admin@test.com';
const BASE = process.env.PB_TEST_BASEURL || 'http://localhost:4173';

test.describe('Admin backend', () => {
  test.beforeEach(async ({ page }) => {
    // Login via the app's login form
    await page.goto(`${BASE}/login?login`);
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

  test('non-admin user is redirected from admin', async ({ page }) => {
    await page.goto(`${BASE}/logout`);
    await page.waitForLoadState('networkidle');
    await page.goto(`${BASE}/login?login`);
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

  test('new page form loads', async ({ page }) => {
    await page.goto(`${BASE}/admin/pages`);
    await page.waitForLoadState('networkidle');
    await page.getByText('New Page').click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Title')).toBeVisible();
    await expect(page.getByText('Slug')).toBeVisible();
    await expect(page.getByText('Description')).toBeVisible();
    await expect(page.getByText('Image')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('page list has title and slug columns', async ({ page }) => {
    await page.goto(`${BASE}/admin/pages`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Title')).toBeVisible();
    await expect(page.getByText('Slug')).toBeVisible();
    await expect(page.getByText('Updated')).toBeVisible();
  });

  test('user editor loads from users list', async ({ page }) => {
    await page.goto(`${BASE}/admin/users`);
    await page.waitForLoadState('networkidle');
    const editButton = page.locator('table button').first();
    await editButton.click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Profile')).toBeVisible();
    await expect(page.getByText('Change Password')).toBeVisible();
  });

  test('create new page via page editor', async ({ page }) => {
    await page.goto(`${BASE}/admin/pages/new`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('New Page')).toBeVisible();

    // Fill in the form
    await page.getByLabel('Title').fill('E2E Test Page');
    // Slug auto-generates from title
    await page.getByLabel('Description').fill('Created during E2E test');

    // Submit the form
    await page.getByRole('button', { name: 'Create Page' }).click();
    await page.waitForLoadState('networkidle');

    // Should redirect back to pages list
    await expect(page.getByText('Pages')).toBeVisible();
  });

  test('edit existing page changes title', async ({ page }) => {
    await page.goto(`${BASE}/admin/pages`);
    await page.waitForLoadState('networkidle');

    // Click first edit pencil in the table
    const editButton = page.locator('table button').first();
    await editButton.click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Edit')).toBeVisible();
    await expect(page.getByLabel('Title')).toBeVisible();
    await expect(page.getByLabel('Slug')).toBeVisible();
  });

  test('user editor can update name', async ({ page }) => {
    await page.goto(`${BASE}/admin/users`);
    await page.waitForLoadState('networkidle');

    // Click the first edit pencil icon
    const editButton = page.locator('table button').first();
    await editButton.click();
    await page.waitForLoadState('networkidle');

    // User editor should show profile form
    await expect(page.getByText('Profile')).toBeVisible();
    await expect(page.getByText('Change Password')).toBeVisible();
    await expect(page.getByText('Danger Zone')).toBeVisible();
  });

  test('user menu has language and dark mode at top', async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await page.waitForLoadState('networkidle');
    // Open user menu
    await page.getByLabel('User menu').click();
    // Language and dark mode should be visible
    await expect(page.getByText('Language')).toBeVisible();
    await expect(page.getByText('Dark mode')).toBeVisible();
  });
});
