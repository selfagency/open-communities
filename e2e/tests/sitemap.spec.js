import { expect, test } from '@playwright/test';

const BASE = (() => {
  if (!process.env.PLAYWRIGHT_BASE_URL) {
    throw new Error('PLAYWRIGHT_BASE_URL must be set before running E2E tests');
  }
  return process.env.PLAYWRIGHT_BASE_URL;
})();

test.describe('Sitemap', () => {
  test('sitemap.xml returns valid XML with congregation URLs', async ({ page }) => {
    const response = await page.request.get(`${BASE}/sitemap.xml`);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('xml');

    const body = await response.text();
    expect(body).toContain('<?xml version="1.0"');
    expect(body).toContain('<urlset');
    expect(body).toContain('<loc>');
    expect(body).toContain('</urlset>');
  });

  test('sitemap contains home page and congregation entries', async ({ page }) => {
    const response = await page.request.get(`${BASE}/sitemap.xml`);
    const body = await response.text();

    // Home page should be present (protocol may be http or https in CI)
    expect(body).toMatch(new RegExp(`<loc>https?://${new URL(BASE).host}/</loc>`));

    // At least one congregation ?id= entry should exist
    expect(body).toContain('/?id=');
  });
});
