import { expect, test } from '@playwright/test';
import { uid } from 'radashi';

import { clearMailpit, findMessageBySubject } from '../helpers/mailpit.js';
import { deleteTestUsers } from '../helpers/pb-helper.js';

const base = process.env.PB_TEST_BASEURL ?? 'http://localhost:4173';

test.describe('auth flows', () => {
  // run tests in this describe serially so they can share state
  test.describe.configure({ mode: 'serial' });

  const emailPrefix = `e2e-${uid(6)}`;
  const email = `${emailPrefix}@example.test`;
  const password = 'Testpass123!';
  let verifyToken;
  let resetToken;

  test.beforeAll(async () => {
    await clearMailpit();
  });

  test.afterAll(async () => {
    await deleteTestUsers(emailPrefix).catch(() => {});
  });

  test('signup -> sends verification email and verifies account', async ({ page }) => {
    await page.goto(`${base}/login?signUp`);
    // wait for the form to be interactive
    await page.waitForSelector('form[action*="signup"], input[autocomplete="name"]', { timeout: 10000 });

    await page.fill('input[autocomplete="name"]', 'E2E Tester');
    await page.fill('input[autocomplete="email"]', email);
    // fill password fields (some builds may not set `name` attributes predictably)
    const pwLocators = page.locator('input[type="password"]');
    const pwCount = await pwLocators.count();
    if (pwCount >= 1) {
      await pwLocators.nth(0).fill(password);
    } else {
      await page.fill('input[autocomplete="new-password"]', password).catch(() => {});
    }
    if (pwCount >= 2) {
      await pwLocators.nth(1).fill(password);
    } else {
      // fallback to named input if present
      await page.fill('input[name="passwordConfirm"]', password).catch(() => {});
    }

    await page.evaluate(() => {
      const el = document.querySelector('input[name="captcha"]');
      if (el) el.value = 'test-token';
    });

    await Promise.all([page.waitForNavigation(), page.click('text=Sign up')]);

    const subjectPart = 'Verify your email';
    const msg = await findMessageBySubject(subjectPart, 20000);
    if (!msg) {
      const MAILPIT_API = process.env.MAILPIT_API ?? 'http://127.0.0.1:8025/api/v1';
      const res = await fetch(`${MAILPIT_API}/messages`);
      const dump = await (res.ok ? res.json() : res.text());
      console.error('[e2e-debug] verification email not found — Mailpit messages dump:', JSON.stringify(dump, null, 2));
    }
    expect(msg).toBeTruthy();

    const MAILPIT_API = process.env.MAILPIT_API ?? 'http://127.0.0.1:8025/api/v1';
    const rawRes = await fetch(`${MAILPIT_API}/messages/${msg.id}/raw`);
    const raw = rawRes.ok ? await rawRes.text() : JSON.stringify(msg);
    const tokenMatch = raw.match(/verifyEmail=([A-Za-z0-9-_]+)/) || raw.match(/verifyEmail"\]\s*:\s*"([A-Za-z0-9-_]+)/);
    verifyToken = tokenMatch ? tokenMatch[1] : undefined;
    expect(verifyToken).toBeTruthy();

    // perform verification
    await page.goto(`${base}/login?verifyEmail=${verifyToken}`);
  });

  test('request reset -> receives reset email and sets new password', async ({ page }) => {
    await page.goto(`${base}/login`);
    await page.fill('input[autocomplete="email"]', email);
    await page.click('text=Send reset email');

    const MAILPIT_API = process.env.MAILPIT_API ?? 'http://127.0.0.1:8025/api/v1';
    const resetMsg = await findMessageBySubject('Reset', 20000);
    if (!resetMsg) {
      const res2 = await fetch(`${MAILPIT_API}/messages`);
      const dump2 = await (res2.ok ? res2.json() : res2.text());
      console.error('[e2e-debug] reset email not found — Mailpit messages dump:', JSON.stringify(dump2, null, 2));
    }
    expect(resetMsg).toBeTruthy();
    const rawResetRes = await fetch(`${MAILPIT_API}/messages/${resetMsg.id}/raw`);
    const rawReset = rawResetRes.ok ? await rawResetRes.text() : JSON.stringify(resetMsg);
    const resetMatch = rawReset.match(/resetPassword=([A-Za-z0-9-_]+)/) || rawReset.match(/resetPassword"\]\s*:\s*"([A-Za-z0-9-_]+)/);
    resetToken = resetMatch ? resetMatch[1] : undefined;
    expect(resetToken).toBeTruthy();

    await page.goto(`${base}/login?resetPassword=${resetToken}`);
    const newPass = password + '1';
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
    const newPass = password + '1';
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
