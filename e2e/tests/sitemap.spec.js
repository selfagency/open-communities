import { expect, test } from '@playwright/test';

const BASE = process.env.PB_TEST_BASEURL || 'http://localhost:4173';

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
    expect(body).toMatch(/<loc>https?:\/\/localhost:3000\/<\/loc>/);

    // At least one congregation ?id= entry should exist
    expect(body).toContain('/?id=');
  });
});
