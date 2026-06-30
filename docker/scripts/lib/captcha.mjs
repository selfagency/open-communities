/**
 * Pure captcha key helpers for bootstrapping Cap.
 * All functions are side-effect-free and testable without Docker.
 */
import { Buffer } from 'node:buffer';

/**
 * Check if captcha keys already exist in env file content.
 */
export function keysAlreadyConfigured(envContent) {
  return (
    envContent.includes('PUBLIC_CAPTCHA_SITE_KEY=') &&
    envContent.includes('CAPTCHA_SITE_SECRET=')
  );
}

/**
 * Build base64-encoded Bearer auth header from session token + hash.
 */
export function buildBearerAuth(token, hash) {
  return `Bearer ${Buffer.from(JSON.stringify({ token, hash })).toString('base64')}`;
}

/**
 * Build env file entry string from site + secret keys.
 */
export function buildEnvEntry(siteKey, secretKey) {
  return `\n# Created by bootstrap\nPUBLIC_CAPTCHA_SITE_KEY="${siteKey}"\nCAPTCHA_SITE_SECRET="${secretKey}"\n`;
}

/**
 * Orchestrate Captcha API calls: login -> create API key -> create site key.
 * Accepts a capPost function for testability.
 */
export async function createCaptchaKeys(capUrl, capAdminKey, capPost) {
  // Step 1: Login
  const login = await capPost('/auth/login', { admin_key: capAdminKey }, null);
  if (!login.ok || !login.data) {
    return { ok: false, message: `login failed: ${login.status}` };
  }

  const { session_token: token, hashed_token: hash } = login.data;
  const bearer = buildBearerAuth(token, hash);

  // Step 2: Create API key
  const ak = await capPost('/server/settings/apikeys', { name: 'ci-bot' }, `Bearer ${bearer}`);
  if (!ak.ok || !ak.data) {
    return { ok: false, message: `api key creation failed: ${ak.status}` };
  }

  // Step 3: Create site key
  const sk = await capPost('/server/keys', { name: 'open-communities' }, `Bot ${ak.data.apiKey}`);
  if (!sk.ok || !sk.data) {
    return { ok: false, message: `site key creation failed: ${sk.status}` };
  }

  const { siteKey, secretKey } = sk.data;
  return { ok: true, message: 'Captcha keys created', siteKey, secretKey };
}

/**
 * Retry wrapper with backoff.
 * Calls fn(i) up to maxRetries times.
 */
async function retryAttempt(fn, i) {
  try {
    const result = await fn(i);
    if (result && typeof result === 'object' && 'ok' in result && !result.ok) {
      if (i === 0) process.stdout.write('\n    \u23f3 retry');
      return { shouldRetry: true, value: undefined };
    }
    return { shouldRetry: false, value: result };
  } catch (e) {
    if (i === 0) process.stdout.write(`\n    \u23f3 waiting (${e?.cause?.code || e?.message || 'error'})`);
    return { shouldRetry: true, value: undefined };
  }
}

export async function withRetry(fn, maxRetries = 60, delayMs = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    const { shouldRetry, value } = await retryAttempt(fn, i);
    if (!shouldRetry) return value;
    await sleep(delayMs);
  }
  return { ok: false, message: 'Max retries exhausted' };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
