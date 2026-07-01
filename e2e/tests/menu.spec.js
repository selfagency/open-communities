import { expect, test } from '@playwright/test';

import { ADMIN_EMAIL, ADMIN_PASSWORD, TEST_EMAIL, TEST_PASSWORD } from '../fixtures/credentials.js';

const BASE = process.env.PB_TEST_BASEURL || 'http://localhost:4173';
const PB_API = process.env.PB_API || 'http://127.0.0.1:8090/api';

/**
 * Helper: authenticate directly against PocketBase and set auth cookie.
 */
async function loginAs({ context, email, password }) {
  const res = await fetch(`${PB_API}/collections/users/auth-with-password`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ identity: email, password })
  });
  if (!res.ok) throw new Error(`PB auth failed: ${res.status}`);
  const data = await res.json();
  const pbAuth = `pb_auth=${encodeURIComponent(JSON.stringify({ token: data.token, record: data.record }))}`;
  await context.addCookies([
    { name: 'auth', value: pbAuth, domain: 'localhost', path: '/' },
    { name: 'session', value: crypto.randomUUID(), domain: 'localhost', path: '/' }
  ]);
}

test.describe('Sidebar menu — desktop (1280px)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('anon: opens Sheet with language, theme, add congregation, login, footer links', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // Desktop header should show Add Congregation button + hamburger
    await expect(page.getByRole('button', { name: /add congregation/i })).toBeVisible();

    // Open the Sheet via hamburger
    const hamburger = page.locator('nav button').last();
    await hamburger.click();
    await page.waitForTimeout(500);

    // Sheet should contain language selector
    await expect(page.getByText('Language', { exact: true })).toBeVisible();

    // Sheet should contain dark mode toggle
    await expect(page.getByText(/dark mode/i)).toBeVisible();

    // Sheet should contain Add Congregation link
    await expect(page.getByRole('link', { name: /add congregation/i })).toBeVisible();

    // Sheet should contain Login link
    await expect(page.getByRole('link', { name: /login/i })).toBeVisible();

    // Sheet should contain footer links
    await expect(page.getByRole('link', { name: /about/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /contact/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /privacy/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /terms/i })).toBeVisible();
  });

  test('logged-in user: opens Sheet with account, logout, no login', async ({ page, context }) => {
    await loginAs({ context, email: TEST_EMAIL, password: TEST_PASSWORD });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // Open the Sheet
    const hamburger = page.locator('nav button').last();
    await hamburger.click();
    await page.waitForTimeout(500);

    // Should show account link
    await expect(page.getByRole('button', { name: /manage account/i })).toBeVisible();

    // Should show logout
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();

    // Should NOT show login link
    await expect(page.getByRole('link', { name: /login/i })).not.toBeVisible();

    // Should still show footer links
    await expect(page.getByRole('link', { name: /about/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /contact/i })).toBeVisible();
  });

  test('admin: opens Sheet with admin links', async ({ page, context }) => {
    await loginAs({ context, email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // Open the Sheet
    const hamburger = page.locator('nav button').last();
    await hamburger.click();
    await page.waitForTimeout(500);

    // Should show admin section
    await expect(page.getByRole('button', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /congregations/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /users/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /pages/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /translations/i })).toBeVisible();

    // Should show account + logout
    await expect(page.getByRole('button', { name: /manage account/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();
  });
});

test.describe('Sidebar menu — mobile (375px)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('anon: hamburger replaces top nav, opens Sheet with all links', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // Mobile header should NOT show Add Congregation button inline
    await expect(page.getByRole('button', { name: /add congregation/i })).not.toBeVisible();

    // Open the Sheet via hamburger (only button in mobile nav)
    const hamburger = page.locator('nav button').last();
    await hamburger.click();
    await page.waitForTimeout(500);

    // Sheet should contain language + theme
    await expect(page.getByText('Language', { exact: true })).toBeVisible();
    await expect(page.getByText(/dark mode/i)).toBeVisible();

    // Sheet should contain Add Congregation link
    await expect(page.getByRole('link', { name: /add congregation/i })).toBeVisible();

    // Sheet should contain Login link
    await expect(page.getByRole('link', { name: /login/i })).toBeVisible();

    // Sheet should contain footer links
    await expect(page.getByRole('link', { name: /about/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /contact/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /privacy/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /terms/i })).toBeVisible();
  });

  test('logged-in user: hamburger replaces top nav, shows account + logout', async ({ page, context }) => {
    await loginAs({ context, email: TEST_EMAIL, password: TEST_PASSWORD });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // Open the Sheet
    const hamburger = page.locator('nav button').last();
    await hamburger.click();
    await page.waitForTimeout(500);

    // Should show account + logout
    await expect(page.getByRole('button', { name: /manage account/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();

    // Should NOT show login
    await expect(page.getByRole('link', { name: /login/i })).not.toBeVisible();

    // Footer links still present
    await expect(page.getByRole('link', { name: /about/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /contact/i })).toBeVisible();
  });

  test('admin: hamburger replaces top nav, shows admin links', async ({ page, context }) => {
    await loginAs({ context, email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // Open the Sheet
    const hamburger = page.locator('nav button').last();
    await hamburger.click();
    await page.waitForTimeout(500);

    // Admin links
    await expect(page.getByRole('button', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /congregations/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /users/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /pages/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /translations/i })).toBeVisible();

    // Account + logout
    await expect(page.getByRole('button', { name: /manage account/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();
  });
});
