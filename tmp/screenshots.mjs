import { chromium } from "@playwright/test";
const browser = await chromium.launch({ headless: true });

const viewports = [
	{ name: "desktop", width: 1280, height: 800 },
	{ name: "mobile", width: 375, height: 812 },
	{ name: "tablet", width: 768, height: 1024 },
];

for (const vp of viewports) {
	const ctx = await browser.newContext({
		viewport: { width: vp.width, height: vp.height },
	});
	const page = await ctx.newPage();
	await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
	await page.waitForTimeout(1500);
	await page.screenshot({
		path: `tmp/design-review-${vp.name}.png`,
		fullPage: true,
	});
	console.log(`${vp.name} done`);
	await ctx.close();
}

await browser.close();
console.log("ALL DONE");
