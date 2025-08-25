import { expect, test } from '@playwright/test';
import { sleep, uid } from 'radashi';

import { clearMailpit, findMessageBySubject } from '../helpers/mailpit.js';
import { deleteTestUsers } from '../helpers/pb-helper.js';

const base = 'http://localhost:4173';

test.describe('auth flows', () => {
  // run tests in this describe serially so they can share state
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

    // Wait for the captcha widget to load
    await page.waitForSelector('cap-widget', { timeout: 10000 });

    // Wait for the captcha clickable area and click it
    await page.waitForSelector('cap-widget .captcha', { timeout: 10000 });
    await page.click('cap-widget .captcha');

    // Wait for the captcha to be solved (it should show as "done" state)
    await page.waitForSelector('cap-widget .captcha[data-state="done"]', { timeout: 10000 });

    // Click the submit button
    await sleep(1000);
    await page.click('button[type="submit"]');

    // Wait for form submission
    await page.waitForTimeout(2000);

    const subjectPart = 'Verify your Open Communities email';
    const msg = await findMessageBySubject(subjectPart, 20000);
    if (!msg) {
      const MAILPIT_API = process.env.MAILPIT_API ?? 'http://127.0.0.1:8025/api/v1';
      const res = await fetch(`${MAILPIT_API}/messages`);
      const dump = await (res.ok ? res.json() : res.text());
      console.error('[e2e-debug] verification email not found — Mailpit messages dump:', JSON.stringify(dump, null, 2));
    }
    expect(msg).toBeTruthy();

    const MAILPIT_API = process.env.MAILPIT_API ?? 'http://127.0.0.1:8025/api/v1';
    const rawRes = await fetch(`${MAILPIT_API}/message/${msg.id}/raw`);
    let raw = rawRes.ok ? await rawRes.text() : '';

    // If raw fetch failed, try getting message details
    if (!raw) {
      const detailRes = await fetch(`${MAILPIT_API}/message/${msg.id}`);
      if (detailRes.ok) {
        const detail = await detailRes.json();
        raw = detail.HTML || detail.Text || JSON.stringify(detail);
      }
    }

    // Add debug logging and improve token extraction
    console.log('[e2e-debug] Raw email content length:', raw.length);
    console.log('[e2e-debug] Raw email content preview:', raw.substring(0, 500));

    // More comprehensive token extraction that handles URL encoding and line breaks
    const tokenMatch = raw.match(/verifyEmail=3D([A-Za-z0-9-_.%=]+)/g) ||
                       raw.match(/verifyEmail=([A-Za-z0-9-_.%=]+)/g) ||
                       raw.match(/verifyEmail["\s]*[:=]\s*["']?([A-Za-z0-9-_.%=]+)["']?/g);

    let rawToken = null;
    if (tokenMatch && tokenMatch.length > 0) {
      // Extract the token from the first match, handling multiple capture patterns
      const match = tokenMatch[0];
      const tokenPart = match.split('=').pop(); // Get everything after the last =
      rawToken = tokenPart;
    }

    console.log('[e2e-debug] Extracted raw token:', rawToken);

    // URL decode the token if needed
    if (rawToken) {
      verifyToken = decodeURIComponent(rawToken);
      // Handle the 3D encoding specifically (3D = URL encoded =)
      if (rawToken.startsWith('3D')) {
        verifyToken = decodeURIComponent(rawToken.replace(/^3D/, '='));
      }
    }

    console.log('[e2e-debug] Final decoded token:', verifyToken);

    expect(verifyToken).toBeTruthy();

    // Verify user was created in PocketBase
    const PB_ADMIN = process.env.PB_TEST_ADMIN;
    const PB_PASSWORD = process.env.PB_TEST_PASSWORD;
    const PB_API = process.env.PB_API ?? 'http://127.0.0.1:8090/api';

    if (PB_ADMIN && PB_PASSWORD) {
      // Login as admin to PocketBase
      const authRes = await fetch(`${PB_API}/admins/auth-with-password`, {
        body: JSON.stringify({ identity: PB_ADMIN, password: PB_PASSWORD }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST'
      });

      if (authRes.ok) {
        const authData = await authRes.json();
        const token = authData.token;

        // Query users to find our test user
        const usersRes = await fetch(`${PB_API}/collections/users/records?filter=(email="${email}")`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          expect(usersData.items).toHaveLength(1);
          expect(usersData.items[0].email).toBe(email);
          expect(usersData.items[0].verified).toBe(false); // Should be unverified initially
          console.log('[e2e] User successfully created in PocketBase:', usersData.items[0].id);
        } else {
          console.warn('[e2e] Failed to query PocketBase users:', await usersRes.text());
        }
      } else {
        console.warn('[e2e] Failed to authenticate with PocketBase admin');
      }
    }

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
    const rawResetRes = await fetch(`${MAILPIT_API}/message/${resetMsg.id}/raw`);
    let rawReset = rawResetRes.ok ? await rawResetRes.text() : '';

    // If raw fetch failed, try getting message details
    if (!rawReset) {
      const detailRes = await fetch(`${MAILPIT_API}/message/${resetMsg.id}`);
      if (detailRes.ok) {
        const detail = await detailRes.json();
        rawReset = detail.HTML || detail.Text || JSON.stringify(detail);
      }
    }

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
