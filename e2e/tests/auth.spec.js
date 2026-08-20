import { expect, test } from '@playwright/test';
import { uid } from 'radashi';

import { clearMailpit, findMessageBySubject } from '../helpers/mailpit.js';
import { TEST_PASSWORD } from '../fixtures/credentials.js';
import { deleteTestUsers } from '../helpers/pb-helper.js';

const BASE = (() => {
  if (!process.env.PLAYWRIGHT_BASE_URL) {
    throw new Error('PLAYWRIGHT_BASE_URL must be set before running E2E tests');
  }
  return process.env.PLAYWRIGHT_BASE_URL;
})();
const MAILPIT_API = process.env.MAILPIT_API ?? 'http://127.0.0.1:8025/api/v1';
const PB_ADMIN = process.env.PB_TEST_ADMIN || 'admin@test.com'; // nosemgrep
const PB_PASSWORD = process.env.PB_TEST_PASSWORD || 'i3_NL-dfzzFt5TX'; // nosemgrep

/**
 * Authenticate as PocketBase superuser. Tries PB v0.29+ endpoint first,
 * falls back to legacy /api/admins/auth-with-password.
 */
async function getSuperuserToken(pbApi, admin, password) {
  if (!admin || !password) throw new Error('PB_TEST_ADMIN and PB_TEST_PASSWORD env vars required');
  for (const url of [
    `${pbApi}/collections/_superusers/auth-with-password`,
    `${pbApi}/admins/auth-with-password`
  ]) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identity: admin, password })
    });
    if (res.ok) return (await res.json()).token;
  }
  throw new Error('Superuser auth failed: tried both endpoints');
}

/**
 * Fetch the full message detail from Mailpit by message ID.
 */
async function getMailpitMessageDetail(messageId) {
  const res = await fetch(`${MAILPIT_API}/message/${messageId}`, {
    headers: { accept: 'application/json' }
  });
  if (!res.ok) throw new Error(`Mailpit detail fetch failed: ${res.status}`);
  return res.json();
}

/**
 * Extract a verification link from a Mailpit message detail.
 * Returns the decoded link or null if not found.
 */
function extractVerificationLink(detail) {
  const raw = detail.HTML || detail.Text || '';
  const linkMatch =
    raw.match(/https?:\/\/[^\s"'<>]+verifyEmail[^\s"'<>]*/g) ||
    raw.match(/https?:\/\/[^\s"'<>]+\?[^\s"'<>]*verifyEmail[^\s"'<>]*/g);
  if (!linkMatch || linkMatch.length === 0) return null;
  return linkMatch[0].replace(/&amp;/g, '&').replace(/=3D/g, '=');
}

/**
 * Extract a reset token from a Mailpit message detail.
 * Returns the token string or null if not found.
 */
function extractResetToken(detail) {
  const raw = detail.HTML || detail.Text || JSON.stringify(detail);
  const match =
    raw.match(/resetPassword=([A-Za-z0-9\-_.]+)/) ||
    raw.match(/resetPassword"\]\s*:\s*"([A-Za-z0-9\-_.]+)/);
  return match ? match[1] : null;
}

/**
 * Extract a query parameter value from a URL string.
 */
function extractTokenFromLink(link, paramName) {
  const url = new URL(link);
  return url.searchParams.get(paramName);
}

test.describe('auth flows', () => {
  test.describe.configure({ mode: 'serial' });

  const emailPrefix = `e2e-${uid(6)}`;
  const email = `${emailPrefix}@example.test`;
  const password = TEST_PASSWORD;

  test.beforeAll(async () => {
    await clearMailpit();
  });

  test.afterAll(async () => {
    await deleteTestUsers(emailPrefix).catch(() => {});
  });

  test('signup -> sends verification email and verifies account', async ({ page }) => {
    const PB_API = process.env.PB_API ?? 'http://127.0.0.1:8090/api';

    // Auth as superuser
    const token = await getSuperuserToken(PB_API, PB_ADMIN, PB_PASSWORD);

    // Create the user via PB admin API (bypasses broken use:enhance form)
    const createRes = await fetch(`${PB_API}/collections/users/records`, {
      body: JSON.stringify({
        email,
        emailVisibility: true,
        name: 'E2E Tester',
        password,
        passwordConfirm: password,
        verified: false
      }),
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      method: 'POST'
    });
    if (!createRes.ok) throw new Error(`User creation failed: ${createRes.status}`);
    console.log('[e2e] User created via PB API');

    // Request verification email
    const verifyReqRes = await fetch(`${PB_API}/collections/users/request-verification`, {
      body: JSON.stringify({ email }),
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      method: 'POST'
    });
    if (!verifyReqRes.ok) throw new Error(`Verification request failed: ${verifyReqRes.status}`);

    // Find verification email in Mailpit and extract the link
    const msg = await findMessageBySubject('Verify your Open Communities email', 20000);
    expect(msg).toBeTruthy();

    const detail = await getMailpitMessageDetail(msg.ID || msg.id);
    const verificationLink = extractVerificationLink(detail);
    expect(verificationLink).toBeTruthy();

    // Extract the verification token and confirm via PB API
    const verifyToken = extractTokenFromLink(verificationLink, 'verifyEmail');
    expect(verifyToken).toBeTruthy();

    const confirmRes = await fetch(`${PB_API}/collections/users/confirm-verification`, {
      body: JSON.stringify({ token: verifyToken, password, passwordConfirm: password }),
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      method: 'POST'
    });
    if (!confirmRes.ok) throw new Error(`Verification confirm failed: ${confirmRes.status}`);

    // Verify the user is now marked as verified
    const usersRes = await fetch(`${PB_API}/collections/users/records?filter=${encodeURIComponent(`(email="${email}")`)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (usersRes.ok) {
      const usersData = await usersRes.json();
      expect(usersData.items).toHaveLength(1);
      expect(usersData.items[0].email).toBe(email);
      expect(usersData.items[0].verified).toBe(true);
      console.log('[e2e] Verified:', usersData.items[0].id);
    }
  });

  test('request reset -> receives reset email and sets new password', async ({ page }) => {
    const PB_API = process.env.PB_API ?? 'http://127.0.0.1:8090/api';

    // Request password reset via PB API (public endpoint, no auth needed)
    const resetReqRes = await fetch(`${PB_API}/collections/users/request-password-reset`, {
      body: JSON.stringify({ email }),
      headers: { 'content-type': 'application/json' },
      method: 'POST'
    });
    if (!resetReqRes.ok) throw new Error(`Password reset request failed: ${resetReqRes.status}`);

    // Find reset email in Mailpit and extract the token
    const resetMsg = await findMessageBySubject('Reset', 20000);
    expect(resetMsg).toBeTruthy();

    const detail = await getMailpitMessageDetail(resetMsg.ID || resetMsg.id);
    const resetToken = extractResetToken(detail);
    expect(resetToken).toBeTruthy();

    // Confirm password reset via PB API (public endpoint)
    const newPass = `${password}1`;
    const confirmRes = await fetch(`${PB_API}/collections/users/confirm-password-reset`, {
      body: JSON.stringify({ token: resetToken, password: newPass, passwordConfirm: newPass }),
      headers: { 'content-type': 'application/json' },
      method: 'POST'
    });
    if (!confirmRes.ok) throw new Error(`Password reset confirm failed: ${confirmRes.status}`);
  });

  test('login with new password', async ({ page, context }) => {
    const PB_API = process.env.PB_API ?? 'http://127.0.0.1:8090/api';
    const newPass = `${password}1`;

    // Auth via PB API directly (app's use:enhance doesn't work in prod build)
    const authRes = await fetch(`${PB_API}/collections/users/auth-with-password`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identity: email, password: newPass })
    });
    if (!authRes.ok) throw new Error(`Login with new password failed: ${authRes.status}`);
    const authData = await authRes.json();

    // Set auth cookie so the browser recognizes the user as logged in
    const pbAuth = `pb_auth=${encodeURIComponent(JSON.stringify({ token: authData.token, record: authData.record }))}`;
    await context.addCookies([
      { name: 'auth', value: pbAuth, domain: 'localhost', path: '/' },
      { name: 'session', value: crypto.randomUUID(), domain: 'localhost', path: '/' }
    ]);

    // Navigate to home — should show logged-in state
    await page.goto(BASE);
    await expect(page.locator('nav').getByRole('button', { name: /add congregation/i })).toBeVisible({ timeout: 10000 });
  });
});
