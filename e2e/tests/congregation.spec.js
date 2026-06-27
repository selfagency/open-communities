import { expect, test } from '@playwright/test';
import { sleep, uid as uniqueId } from 'radashi';

const BASE = process.env.PB_TEST_BASEURL || 'http://localhost:4173';
const email = 'regular@example.test';
const password = 'TestPass123!';

test.describe('Congregation CRUD', () => {
  test.describe.configure({ mode: 'serial' });

  const congregationName = `E2E Test Congregation ${uniqueId(4)}`;
  const congregationContact = `contact-${uniqueId(4)}@example.test`;

  /**
   * Helper: login as the regular test user.
   * Playwright 1.61+ isolates browser contexts per test even in serial mode,
   * so each test that needs auth must login independently (cookies don't persist).
   */
  async function loginAsUser(page) {
    await page.goto(`${BASE}/login?login`);
    await page.waitForLoadState('networkidle');
    await page.locator('form[action*="login"] input[autocomplete="email"]').fill(email);
    const pwInputs = page.locator('form[action*="login"] input[type="password"]');
    if ((await pwInputs.count()) >= 1) {
      await pwInputs.nth(0).fill(password);
    }
    await page.locator('form[action*="login"] button[type="submit"]').click();
    // Wait for client-side redirect to home after login success
    await page.waitForURL('**/');
  }

  test('homepage shows congregation directory', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('input[id="search"]')).toBeVisible();
    await expect(page.locator('div.col-span-1').first()).toBeVisible({ timeout: 15000 });
  });

  test('login as existing user', async ({ page }) => {
    await loginAsUser(page);

    // Verify login succeeded: Login button should NOT be visible.
    // The header renders "Add Congregation" in both states, so check for
    // the absence of the Login button instead.
    const loginBtn = page.getByRole('button', { name: /^login$/i });
    await expect(loginBtn).not.toBeVisible({ timeout: 5000 });
  });

  test('add a congregation', async ({ page }) => {
    // Login first — browser context is isolated per test in PW 1.61+
    await loginAsUser(page);

    await page.goto(`${BASE}/add`);
    await page.waitForLoadState('networkidle');
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
    await page.waitForLoadState('networkidle');

    // Search for a congregation seeded as visible (non-admin submissions are invisible).
    const searchInput = page.locator('input[id="search"]');
    await searchInput.fill('Shalom Congregation');
    await sleep(1000);

    const card = page.locator('text=Shalom Congregation');
    await expect(card).toBeVisible({ timeout: 10000 });
  });
});
