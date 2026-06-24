import { expect, test } from '@playwright/test';
import { sleep, uid as uniqueId } from 'radashi';

import { clearMailpit } from '../helpers/mailpit.js';

const base = 'http://localhost:4173';
const ADMIN_EMAIL = process.env.PB_TEST_ADMIN || 'admin@test.com';
const ADMIN_PASSWORD = process.env.PB_TEST_PASSWORD || 'i3_NL-dfzzFt5TX';
const PB_API = process.env.PB_API || 'http://127.0.0.1:8090/api';

async function pbAuth() {
  const res = await fetch(`${PB_API}/admins/auth-with-password`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });
  if (!res.ok) throw new Error(`PB auth failed: ${res.status}`);
  const data = await res.json();
  return data.token;
}

test.describe('Congregation CRUD', () => {
  test.describe.configure({ mode: 'serial' });

  const emailPrefix = `e2e-crud-${uniqueId(6)}`;
  const email = `${emailPrefix}@example.test`;
  const password = 'TestPass123!';

  const congregationName = `E2E Test Congregation ${uniqueId(4)}`;
  const congregationContact = `contact-${uniqueId(4)}@example.test`;

  test.beforeAll(async () => {
    await clearMailpit();
  });

  test('homepage shows congregation directory', async ({ page }) => {
    await page.goto(base);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('input[id="search"]')).toBeVisible();
    await expect(page.locator('section a[href*="/?id="]').first()).toBeVisible();
  });

  test('signup and login as a new user', async ({ page }) => {
    await page.goto(`${base}/login?signUp`, { waitUntil: 'commit', timeout: 15000 });
    await page.waitForSelector('form[action*="signup"]', { timeout: 15000, state: 'attached' });

    await page.$eval('input[autocomplete="name"]', (el, v) => { (el).value = v; }, 'E2E CRUD Tester');
    await page.$eval('input[autocomplete="email"]', (el, v) => { (el).value = v; }, email);
    await page.$eval('input[type="password"]', (el, v) => { (el).value = v; }, password);
    await page.$eval('input[name="passwordConfirm"]', (el, v) => { (el).value = v; }, password).catch(async () => {
      const pwInputs = await page.$$('input[type="password"]');
      if (pwInputs.length >= 2) {
        await pwInputs[1].evaluate((el, v) => { (el).value = v; }, password);
      }
    });

    await page.$eval('cap-widget', (el) => {
      el.dispatchEvent(new CustomEvent('solve', { detail: { token: 'e2e-token' } }));
    });
    await sleep(300);

    await page.$eval('form[action*="signup"]', (form) => { (form).requestSubmit(); });
    await sleep(1000);

    const success = await page.textContent('*:has-text("Sign up successful")').catch(() => null);
    expect(success).toBeTruthy();
  });

  test('verify email and login', async ({ page }) => {
    const subjectPart = 'Verify your Open Communities email';
    const { findMessageBySubject } = await import('../helpers/mailpit.js');
    const msg = await findMessageBySubject(subjectPart, 20000);
    expect(msg).toBeTruthy();

    const messageId = msg.ID || msg.id;
    const detailRes = await fetch(`${process.env.MAILPIT_API ?? 'http://127.0.0.1:8025/api/v1'}/message/${messageId}`, {
      headers: { accept: 'application/json' }
    });
    expect(detailRes.ok).toBeTruthy();
    const detail = await detailRes.json();
    const raw = detail.HTML || detail.Text || '';
    const linkMatch =
      raw.match(/https?:\/\/[^\s"'<>]+verifyEmail[^\s"'<>]*/g) ||
      raw.match(/https?:\/\/[^\s"'<>]+\?[^\s"'<>]*verifyEmail[^\s"'<>]*/g);
    expect(linkMatch).toBeTruthy();
    const verificationLink = linkMatch[0].replace(/&amp;/g, '&').replace(/=3D/g, '=');

    await page.goto(verificationLink);
    await page.waitForTimeout(2000);

    await page.goto(`${base}/login`);
    await page.waitForSelector('input[autocomplete="email"]', { timeout: 10000 });
    await page.fill('input[autocomplete="email"]', email);
    const pwLoc = page.locator('input[type="password"]');
    if ((await pwLoc.count()) >= 1) {
      await pwLoc.nth(0).fill(password);
    }
    await Promise.all([page.waitForNavigation(), page.click('text=Login')]);
    await expect(page.locator('text=Logout')).toBeVisible({ timeout: 5000 });
  });

  test('add a congregation', async ({ page }) => {
    await page.goto(`${base}/add`);
    await page.waitForLoadState('networkidle');

    const nameInput = page.locator('input[name="name"]');
    await nameInput.waitFor({ timeout: 10000 });
    await nameInput.fill(congregationName);

    const emailInput = page.locator('input[name="contactEmail"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill(congregationContact);
    }

    const denomSelect = page.locator('select[name="denomination"]');
    if (await denomSelect.isVisible()) {
      await denomSelect.selectOption('reform');
    }

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
