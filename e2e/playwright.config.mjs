import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  expect: { timeout: 5000 },
  fullyParallel: true,
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  reporter: [['list'], ['html', { outputFolder: path.join(__dirname, 'playwright-report') }]],
  testDir: path.join(__dirname, 'tests'),
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:4173',
    headless: true,
    ignoreHTTPSErrors: true,
    viewport: { height: 800, width: 1280 }
  }
});
