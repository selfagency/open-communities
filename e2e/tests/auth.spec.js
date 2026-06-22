import { expect, test } from '@playwright/test';
import { sleep, uid } from 'radashi';

import { clearMailpit, findMessageBySubject } from '../helpers/mailpit.js';
import { deleteTestUsers } from '../helpers/pb-helper.js';

const base = 'http://localhost:4173';
const MAILPIT_API = process.env.MAILPIT_API ?? 'http://127.0.0.1:8025/api/v1';

test.describe('auth flows', () => {
  test.describe.configure({ mode: 'serial' });

  const emailPrefix = `e2e-${uid(6)}`;
  const email = `${emailPrefix}@example.test`;
  const password = 'TestPass123!';
  let verifyToken;
  let resetToken;

  test.beforeAll(async () => {
    await clearMailpit();
  });

  test.afterAll(async () => {
    await deleteTestUsers(emailPrefix).catch(() => {});
  });

  test('signup -> sends verification email and verifies account', async ({ page }) => {
    await page.goto(`${base}/login?signUp`, { waitUntil: 'commit', timeout: 15000 });

    // Form is SSR-rendered but hidden by bits-ui tabs. Use $eval to bypass visibility.
    await page.waitForSelector('form[action*="signup"]', { timeout: 15000, state: 'attached' });

    // Set form fields via $eval (hidden inputs not interactable via page.fill)
    await page.$eval('input[autocomplete="name"]', (el, v) => { (el).value = v; }, 'E2E Tester');
    await page.$eval('input[autocomplete="email"]', (el, v) => { (el).value = v; }, email);
    await page.$eval('input[type="password"]', (el, v) => { (el).value = v; }, password);
    await page.$eval('input[name="passwordConfirm"]', (el, v) => { (el).value = v; }, password).catch(async () => {
      const pwInputs = await page.$$('input[type="password"]');
      if (pwInputs.length >= 2) {
        await pwInputs[1].evaluate((el, v) => { (el).value = v; }, password);
      }
    });

    // Bypass captcha: widget is SSR-hidden, dispatch synthetic event via $eval
    await page.$eval('cap-widget', (el) => {
      el.dispatchEvent(new CustomEvent('captcha', { detail: { token: 'e2e-token' } }));
    });
    await sleep(500);
    // Submit via evaluate (re-queries DOM fresh)
    await page.evaluate(() => document.querySelector('button[type="submit"]')?.click());
    await sleep(500);
    const successMessage = await page.textContent('*:has-text("Sign up successful")').catch(() => null);
    if (successMessage) console.log('[e2e] Success:', successMessage);

    // Wait for verification email
    console.log('[e2e] Waiting for verification email...');
    await sleep(1000);
    const subjectPart = 'Verify your Open Communities email';
    const msg = await findMessageBySubject(subjectPart, 20000);
    expect(msg).toBeTruthy();

    const messageId = msg.ID || msg.id;
    const detailRes = await fetch(`${MAILPIT_API}/message/${messageId}`, {
      headers: { accept: 'application/json' }
    });
    if (!detailRes.ok) throw new Error(`Detail fetch failed: ${detailRes.status}`);
    const detail = await detailRes.json();
    const raw = detail.HTML || detail.Text || '';
    const linkMatch =
      raw.match(/https?:\/\/[^\s"'<>]+verifyEmail[^\s"'<>]*/g) ||
      raw.match(/https?:\/\/[^\s"'<>]+\?[^\s"'<>]*verifyEmail[^\s"'<>]*/g);
    let verificationLink = null;
    if (linkMatch && linkMatch.length > 0) {
      verificationLink = linkMatch[0].replace(/&amp;/g, '&').replace(/=3D/g, '=');
    }
    expect(verificationLink).toBeTruthy();

    await page.goto(verificationLink);
    await page.waitForTimeout(2000);

    // Verify user in PB
    const PB_ADMIN = process.env.PB_TEST_ADMIN;
    const PB_PASSWORD = process.env.PB_TEST_PASSWORD;
    const PB_API = process.env.PB_API ?? 'http://127.0.0.1:8090/api';
    if (PB_ADMIN && PB_PASSWORD) {
      const authRes = await fetch(`${PB_API}/admins/auth-with-password`, {
        body: JSON.stringify({ identity: PB_ADMIN, password: PB_PASSWORD }),
        headers: { 'content-type': 'application/json' },
        method: 'POST'
      });
      if (authRes.ok) {
        const authData = await authRes.json();
        const token = authData.token;
        const usersRes = await fetch(`${PB_API}/collections/users/records?filter=(email="${email}")`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          expect(usersData.items).toHaveLength(1);
          expect(usersData.items[0].email).toBe(email);
          expect(usersData.items[0].verified).toBe(true);
          console.log('[e2e] Verified:', usersData.items[0].id);
        }
      }
    }

    await page.goto(`${base}/login?verifyEmail=${verifyToken}`);
  });

  test('request reset -> receives reset email and sets new password', async ({ page }) => {
    await page.goto(`${base}/login`);
    await page.fill('input[autocomplete="email"]', email);
    await page.click('text=Send reset email');

    const resetMsg = await findMessageBySubject('Reset', 20000);
    expect(resetMsg).toBeTruthy();

    const messageId = resetMsg.ID || resetMsg.id;
    const rawResetRes = await fetch(`${MAILPIT_API}/message/${messageId}/raw`, {
      headers: { accept: 'application/json' }
    });
    let rawReset = rawResetRes.ok ? await rawResetRes.text() : '';
    if (!rawReset) {
      const detailRes = await fetch(`${MAILPIT_API}/message/${messageId}`, {
        headers: { accept: 'application/json' }
      });
      if (detailRes.ok) {
        const detail = await detailRes.json();
        rawReset = detail.HTML || detail.Text || JSON.stringify(detail);
      }
    }

    const resetMatch =
      rawReset.match(/resetPassword=([A-Za-z0-9-_]+)/) ||
      rawReset.match(/resetPassword"\]\s*:\s*"([A-Za-z0-9-_]+)/);
    resetToken = resetMatch ? resetMatch[1] : undefined;
    expect(resetToken).toBeTruthy();

    await page.goto(`${base}/login?resetPassword=${resetToken}`);
    const newPass = `${password}1`;
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    const resetPwLocators = page.locator('input[type="password"]');
    const resetPwCount = await resetPwLocators.count();
    if (resetPwCount >= 1) await resetPwLocators.nth(0).fill(newPass);
    if (resetPwCount >= 2) await resetPwLocators.nth(1).fill(newPass);
    if (resetPwCount === 0) {
      await page.fill('input[autocomplete="new-password"]', newPass).catch(() => {});
      await page.fill('input[name="passwordConfirm"]', newPass).catch(() => {});
    }
    await page.click('text=Reset password');
  });

  test('login with new password', async ({ page }) => {
    const newPass = `${password}1`;
    await page.goto(`${base}/login`);
    await page.waitForSelector('input[autocomplete="email"], input[type="password"]', { timeout: 10000 });
    await page.fill('input[autocomplete="email"]', email);
    const loginPwLoc = page.locator('input[type="password"]');
    if ((await loginPwLoc.count()) >= 1) {
      await loginPwLoc.nth(0).fill(newPass);
    } else {
      await page.fill('input[name="password"]', newPass).catch(() => {});
    }
    await Promise.all([page.waitForNavigation(), page.click('text=Login')]);
    await expect(page.locator('text=Logout')).toBeVisible({ timeout: 5000 });
  });
});
