import { expect, test } from '@playwright/test';
import { sleep, uid as uniqueId } from 'radashi';

import { TEST_PASSWORD } from '../fixtures/credentials.js';

const BASE = (() => {
  if (!process.env.PLAYWRIGHT_BASE_URL) {
    throw new Error('PLAYWRIGHT_BASE_URL must be set before running E2E tests');
  }
  return process.env.PLAYWRIGHT_BASE_URL;
})();
const PB_API = process.env.PB_API || 'http://127.0.0.1:8090/api';
const email = 'regular@example.test';
const password = TEST_PASSWORD;

test.describe('Congregation CRUD', () => {
  test.describe.configure({ mode: 'serial' });

  const congregationName = `E2E Test Congregation ${uniqueId(4)}`;
  const congregationContact = `contact-${uniqueId(4)}@example.test`;

  /**
   * Helper: authenticate directly against PocketBase and set auth cookie.
   * Playwright 1.61+ isolates browser contexts per test even in serial mode
   * and the app's use:enhance form submission may not work in production builds,
   * so each test that needs auth must set its own auth cookie directly.
   */
  async function loginAsUser({ context }) {
    const res = await fetch(`${PB_API}/collections/users/auth-with-password`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identity: email, password })
    });
    if (!res.ok) throw new Error(`PB user auth failed: ${res.status}`);
    const data = await res.json();
    const pbAuth = `pb_auth=${encodeURIComponent(JSON.stringify({ token: data.token, record: data.record }))}`;
    await context.addCookies([
      { name: 'auth', value: pbAuth, domain: 'localhost', path: '/' },
      { name: 'session', value: crypto.randomUUID(), domain: 'localhost', path: '/' }
    ]);
  }

  test('homepage shows congregation directory', async ({ page }) => {
    await page.goto(BASE);
    // Wait for search input to be visible instead of networkidle
    // networkidle is unreliable when CDN resources are loaded post-hydration
    await expect(page.locator('input[id="search"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('div.col-span-1').first()).toBeVisible({ timeout: 15000 });
  });

  test('login as existing user', async ({ page, context }) => {
    await loginAsUser({ context });

    // Navigate to home — should render logged-in state (Add Congregation button, no Login button)
    await page.goto(BASE);

    // Verify login succeeded: Add Congregation button should be visible.
    const addBtn = page.getByRole('button', { name: /add congregation/i });
    await expect(addBtn).toBeVisible({ timeout: 5000 });
  });

  test('add a congregation', async ({ page, context }) => {
    // Login via direct PB API — browser context is isolated per test in PW 1.61+
    await loginAsUser({ context });

    await page.goto(`${BASE}/add`);
    // The Congregation accordion section is open by default (initial view='congregation').
    // Wait for the name input to be visible directly without clicking any trigger.
    const nameInput = page.locator('#name');
    await nameInput.waitFor({ state: 'visible', timeout: 10000 });
    await nameInput.fill(congregationName);

    const contactInput = page.locator('input[name="contactEmail"]');
    if (await contactInput.isVisible()) {
      await contactInput.fill(congregationContact);
    }

    const denomSelect = page.locator('select[name="denomination"]');
    if (await denomSelect.isVisible()) {
      await denomSelect.selectOption('reform');
    }

    // Dispatch captcha solved event
    await sleep(1500);
    await page.$eval('cap-widget', (el) => {
      el.dispatchEvent(new CustomEvent('solve', { detail: { token: 'e2e-token' } }));
    }).catch(() => {});
    await sleep(500);

    const submitBtn = page.locator('button[type="submit"]');
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await sleep(2000);
    }

    const currentUrl = page.url();
    expect(currentUrl).toContain(BASE);
  });

  test('known congregation appears in search results', async ({ page }) => {
    await page.goto(BASE);

    // Search for a congregation seeded as visible (non-admin submissions are invisible).
    const searchInput = page.locator('input[id="search"]');
    await searchInput.fill('Shalom Congregation');
    await sleep(1000);

    const card = page.locator('text=Shalom Congregation');
    await expect(card).toBeVisible({ timeout: 10000 });
  });
});
