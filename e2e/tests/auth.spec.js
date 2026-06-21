import { expect, test } from '@playwright/test';
import { sleep, uid } from 'radashi';

import { clearMailpit, findMessageBySubject } from '../helpers/mailpit.js';
import { deleteTestUsers } from '../helpers/pb-helper.js';

const base = 'http://localhost:4173';
const MAILPIT_API = process.env.MAILPIT_API ?? 'http://127.0.0.1:8025/api/v1';

test.describe('auth flows', () => {
  // run tests in this describe serially so they can share state
  test.describe.configure({ mode: 'serial' });

  const emailPrefix = `e2e-${uid(6)}`;
  const email = `${emailPrefix}@example.test`;
  const password = 'TestPass123!';
  // eslint-disable-next-line no-unassigned-vars -- set from email later
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

    // Click the submit button
    await sleep(300);

    // Check if captcha token is set before submitting
    const captchaCheck = await page.evaluate(() => {
      const captchaInput = document.querySelector('input[name="captcha"]');
      return {
        captchaValue: captchaInput?.value || 'NO VALUE',
        hasSubmitButton: !!document.querySelector('button[type="submit"]')
      };
    });
    console.log('[e2e-debug] Pre-submit check:', captchaCheck);

    await page.click('button[type="submit"]');

    // Wait for form submission
    await sleep(200);

    // Check if there are any form errors displayed
    // const errorMessages = await page.evaluate(() => {
    //   const errors = Array.from(document.querySelectorAll('[data-testid="error"], .error, .field-error, .form-error'));
    //   return errors.map(el => el.textContent.trim()).filter(text => text);
    // });

    // if (errorMessages.length > 0) {
    //   console.log('[e2e-debug] Form errors found:', errorMessages);
    // }

    // Check if we're still on the signup page (which would indicate an error)
    // const currentUrl = page.url();
    // console.log('[e2e-debug] Current URL after form submission:', currentUrl);

    // Look for success message
    const successMessage = await page.textContent('*:has-text("Sign up successful")').catch(() => null);
    if (successMessage) {
      console.log('[e2e-debug] Success message:', successMessage);
    }

    // Wait a bit for the email to be sent (without using page context)
    console.log('[e2e-debug] Waiting for verification email to be sent...');
    await sleep(1000);

    const subjectPart = 'Verify your Open Communities email';
    // console.log('[e2e-debug] Looking for email with subject containing:', subjectPart);

    const msg = await findMessageBySubject(subjectPart, 20000);
    expect(msg).toBeTruthy();

    // console.log('[e2e-debug] Found message:', { id: msg.ID || msg.id, subject: msg.Subject || msg.subject });

    const messageId = msg.ID || msg.id;
    // console.log('[e2e-debug] Fetching message details for ID:', messageId);

    // Skip raw endpoint and go directly to message details
    const detailRes = await fetch(`${MAILPIT_API}/message/${messageId}`, {
      headers: {
        accept: 'application/json'
      }
    });
    console.log('[e2e-debug] Detail response status:', detailRes.status, detailRes.statusText);

    if (!detailRes.ok) {
      throw new Error(`Failed to fetch message details: ${detailRes.status} ${detailRes.statusText}`);
    }

    const detail = await detailRes.json();
    // console.log('[e2e-debug] Message detail keys:', Object.keys(detail));
    // console.log('[e2e-debug] Detail HTML length:', detail.HTML?.length || 0);
    // console.log('[e2e-debug] Detail Text length:', detail.Text?.length || 0);

    // Use HTML content primarily, fall back to Text
    const raw = detail.HTML || detail.Text || '';

    // Add debug logging and extract verification link
    // console.log('[e2e-debug] Final email content length:', raw.length);
    // console.log('[e2e-debug] Final email content preview:', raw.substring(0, 500));    // Extract verification link instead of just the token
    const linkMatch =
      raw.match(/https?:\/\/[^\s"'<>]+verifyEmail[^\s"'<>]*/g) ||
      raw.match(/https?:\/\/[^\s"'<>]+\?[^\s"'<>]*verifyEmail[^\s"'<>]*/g);

    let verificationLink = null;
    if (linkMatch && linkMatch.length > 0) {
      verificationLink = linkMatch[0];
      // Clean up any HTML encoding
      verificationLink = verificationLink.replace(/&amp;/g, '&').replace(/=3D/g, '=');
    }

    // console.log('[e2e-debug] Extracted verification link:', verificationLink);

    expect(verificationLink).toBeTruthy();

    // Click the verification link
    await page.goto(verificationLink);

    // Wait for verification to complete
    await page.waitForTimeout(2000);

    // Check if we're on a success page or if there's a success message
    // const pageContent = await page.textContent('body');
    // console.log('[e2e-debug] Verification page content:', pageContent.substring(0, 200));

    // Verify user was created in PocketBase
    const PB_ADMIN = process.env.PB_TEST_ADMIN;
    const PB_PASSWORD = process.env.PB_TEST_PASSWORD;
    const PB_API = process.env.PB_API ?? 'http://127.0.0.1:8090/api';

    if (PB_ADMIN && PB_PASSWORD) {
      // Login as admin to PocketBase
      const authRes = await fetch(`${PB_API}/admins/auth-with-password`, {
        body: JSON.stringify({ identity: PB_ADMIN, password: PB_PASSWORD }),
        headers: { 'content-type': 'application/json' },
        method: 'POST'
      });

      if (authRes.ok) {
        const authData = await authRes.json();
        const token = authData.token;

        // Query users to find our test user
        const usersRes = await fetch(`${PB_API}/collections/users/records?filter=(email="${email}")`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          expect(usersData.items).toHaveLength(1);
          expect(usersData.items[0].email).toBe(email);
          expect(usersData.items[0].verified).toBe(true); // Should be verified after clicking the link
          console.log('[e2e] User successfully verified in PocketBase:', usersData.items[0].id);
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

    const resetMsg = await findMessageBySubject('Reset', 20000);
    expect(resetMsg).toBeTruthy();

    const messageId = resetMsg.ID || resetMsg.id;
    const rawResetRes = await fetch(`${MAILPIT_API}/message/${messageId}/raw`, {
      headers: {
        accept: 'application/json'
      }
    });
    let rawReset = rawResetRes.ok ? await rawResetRes.text() : '';

    // If raw fetch failed, try getting message details
    if (!rawReset) {
      const detailRes = await fetch(`${MAILPIT_API}/message/${messageId}`, {
        headers: {
          accept: 'application/json'
        }
      });
      if (detailRes.ok) {
        const detail = await detailRes.json();
        rawReset = detail.HTML || detail.Text || JSON.stringify(detail);
      }
    }

    const resetMatch =
      rawReset.match(/resetPassword=([A-Za-z0-9-_]+)/) || rawReset.match(/resetPassword"\]\s*:\s*"([A-Za-z0-9-_]+)/);
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
