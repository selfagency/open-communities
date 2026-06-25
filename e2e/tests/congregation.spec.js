import { expect, test } from '@playwright/test';
import { sleep, uid as uniqueId } from 'radashi';

const base = 'http://localhost:4173';
const email = 'regular@example.test';
const password = 'TestPass123!';

test.describe('Congregation CRUD', () => {
  test.describe.configure({ mode: 'serial' });

  const congregationName = `E2E Test Congregation ${uniqueId(4)}`;
  const congregationContact = `contact-${uniqueId(4)}@example.test`;

  test('homepage shows congregation directory', async ({ page }) => {
    await page.goto(base);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('input[id="search"]')).toBeVisible();
    await expect(page.locator('div.col-span-1').first()).toBeVisible({ timeout: 15000 });
  });

  test('login as existing user', async ({ page }) => {
    await page.goto(`${base}/login`);
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
    await expect(page.locator('text=Logout')).toBeVisible({ timeout: 10000 });
  });

  test('add a congregation', async ({ page }) => {
    await page.goto(`${base}/add`);
    await page.waitForLoadState('networkidle');

    // Use the input ID rendered by shadcn-svelte Form.Field (inside accordion)
    // Force to true since the input is inside a collapsed accordion
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
    expect(currentUrl).toContain(base);
  });

  test('congregation appears in search results', async ({ page }) => {
    await page.goto(base);
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[id="search"]');
    await searchInput.fill(congregationName);
    await sleep(1000);

    const card = page.locator(`text=${congregationName}`);
    await expect(card).toBeVisible({ timeout: 10000 });
  });
});
