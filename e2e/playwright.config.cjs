const path = require('node:path');
const { fileURLToPath } = require('node:url');
const { defineConfig, devices } = require('@playwright/test');

const __filename = fileURLToPath(__filename);
const __dirname = path.dirname(__filename);

/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = defineConfig({
  expect: { timeout: 5000 },
  fullyParallel: true,
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  reporter: [['list'], ['html', { outputFolder: path.join(__dirname, 'playwright-report') }]],
  testDir: path.join(__dirname, 'tests'),
  timeout: 60_000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4173',
    headless: true,
    ignoreHTTPSErrors: true,
    viewport: { height: 800, width: 1280 }
  }
});
