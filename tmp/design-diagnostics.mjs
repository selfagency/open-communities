import { chromium } from "@playwright/test";

const browser = await chromium.launch({ headless: true });

async function analyzeViewport(name, width, height) {
	const ctx = await browser.newContext({ viewport: { width, height } });
	const page = await ctx.newPage();

	// Collect console errors
	const errors = [];
	page.on("console", (msg) => {
		if (msg.type() === "error") errors.push(msg.text());
	});

	await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
	await page.waitForTimeout(2000);

	const info = await page.evaluate(() => {
		const nav = document.querySelector("nav");
		const main = document.querySelector("main");
		const footer = document.querySelector("footer");
		const welcome = document.querySelector('[class*="rounded-xl"]');
		const grid = document.querySelector('[class*="grid"]');

		// Text overflow detection
		const overflowEls = [];
		document.querySelectorAll("*").forEach((el) => {
			const rect = el.getBoundingClientRect();
			if (el.children.length === 0 && el.textContent?.trim()) {
				if (rect.width > 0 && rect.right > window.innerWidth + 2) {
					overflowEls.push({
						tag: el.tagName,
						text: el.textContent?.slice(0, 40),
						right: rect.right,
						viewport: window.innerWidth,
					});
				}
			}
		});

		// Check card grid columns
		const gridStyle = grid ? getComputedStyle(grid) : null;

		// Check font loading
		const fontFaces = [...document.fonts].map((f) => f.family);

		// Check if Tocuh targets are too small
		const smallTargets = [];
		document
			.querySelectorAll('button, a, [role="button"], input, select')
			.forEach((el) => {
				const rect = el.getBoundingClientRect();
				if (
					rect.width > 0 &&
					rect.height > 0 &&
					(rect.width < 44 || rect.height < 44)
				) {
					smallTargets.push({
						tag: el.tagName,
						text: el.textContent?.slice(0, 30),
						w: Math.round(rect.width),
						h: Math.round(rect.height),
					});
				}
			});

		return {
			layout: {
				viewport: { width, height },
				scrollHeight: document.documentElement.scrollHeight,
				headerHeight: nav?.offsetHeight,
				mainMT: main ? getComputedStyle(main).marginTop : null,
				mainMaxW: main ? getComputedStyle(main).maxWidth : null,
				welcomeRect: welcome?.getBoundingClientRect(),
				gridCols: gridStyle?.gridTemplateColumns,
				gridGap: gridStyle?.gap,
				footerTop: footer?.getBoundingClientRect()?.top,
			},
			overflow: overflowEls.slice(0, 10),
			smallTargets: smallTargets.slice(0, 20),
			fonts: [...new Set(fontFaces)].slice(0, 5),
		};
	});

	console.log(`\n=== ${name} (${width}x${height}) ===`);
	console.log("Layout:", JSON.stringify(info.layout, null, 2));
	if (errors.length) console.log("Console errors:", errors);
	if (info.overflow.length)
		console.log("Overflows:", info.overflow.slice(0, 5));
	if (info.smallTargets.length)
		console.log(
			`Small touch targets (${info.smallTargets.length}):`,
			info.smallTargets.slice(0, 10),
		);
	console.log("Fonts:", info.fonts);

	await ctx.close();
}

await analyzeViewport("Desktop", 1280, 800);
await analyzeViewport("Tablet", 768, 1024);
await analyzeViewport("Mobile", 375, 812);
await analyzeViewport("Narrow", 320, 568); // iPhone SE

await browser.close();
console.log("\nALL DONE");
