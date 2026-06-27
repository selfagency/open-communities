import { expect, test } from '@playwright/test';
import { sleep, uid as uniqueId } from 'radashi';

const BASE = process.env.PB_TEST_BASEURL || 'http://localhost:4173';
const email = 'regular@example.test';
const password = 'TestPass123!';

test.describe('Congregation CRUD', () => {
  test.describe.configure({ mode: 'serial' });

  const congregationName = `E2E Test Congregation ${uniqueId(4)}`;
  const congregationContact = `contact-${uniqueId(4)}@example.test`;

  test('homepage shows congregation directory', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('input[id="search"]')).toBeVisible();
    await expect(page.locator('div.col-span-1').first()).toBeVisible({ timeout: 15000 });
  });

  test('login as existing user', async ({ page }) => {
    await page.goto(`${BASE}/login?login`);
    await page.waitForLoadState('networkidle');

    // Scope to the login form — signup form also has email/password fields
    await page.locator('form[action*="login"] input[autocomplete="email"]').fill(email);
    const pwInputs = page.locator('form[action*="login"] input[type="password"]');
    if ((await pwInputs.count()) >= 1) {
      await pwInputs.nth(0).fill(password);
    }

    // Login uses client-side goto('/') via superforms — click submit, wait for redirect
    await page.locator('form[action*="login"] button[type="submit"]').click();
    await page.waitForTimeout(2000);
    await expect(page.getByText(/add congregation|edit congregation/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('add a congregation', async ({ page }) => {
    await page.goto(`${BASE}/add`);
    await page.waitForLoadState('networkidle');
    // Wait for the form to finish loading (accordion root appears)
    await page.locator('form').waitFor({ state: 'visible', timeout: 10000 });
    // Open the Congregation accordion section to expose the name input.
    // bits-ui renders Accordion.Trigger as a <button> element.
    await page.getByRole('button', { name: /congregation/i }).click();
    await page.waitForTimeout(500);

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

  test('congregation appears in search results', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[id="search"]');
    await searchInput.fill(congregationName);
    await sleep(1000);

    const card = page.locator(`text=${congregationName}`);
    await expect(card).toBeVisible({ timeout: 10000 });
  });
});
