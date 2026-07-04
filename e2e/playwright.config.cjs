const path = require('node:path');
const { defineConfig, devices } = require('@playwright/test');
// __filename and __dirname are CJS globals — no fileURLToPath needed

/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = defineConfig({
  expect: { timeout: 5000 },
  fullyParallel: true,
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  reporter: [['list'], ['html', { outputFolder: path.join(__dirname, 'playwright-report') }]],
  testDir: path.join(__dirname, 'tests'),
  timeout: 60_000,
  use: {
    // Require explicit PLAYWRIGHT_BASE_URL; fail fast if unset to avoid implicit defaults.
    baseURL: (() => {
      if (!process.env.PLAYWRIGHT_BASE_URL) {
        throw new Error('PLAYWRIGHT_BASE_URL must be set in the environment before running E2E tests');
      }
      return process.env.PLAYWRIGHT_BASE_URL;
    })(),
    headless: true,
    ignoreHTTPSErrors: true,
    viewport: { height: 800, width: 1280 }
  }
});
