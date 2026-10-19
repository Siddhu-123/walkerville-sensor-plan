// Smoke test for the deck: every slide loads with no console errors and no unresolved tokens,
// no slide overflows sideways at desktop or phone width, and the main controls respond.
// Needs Node with the 'playwright' package and a Chromium it can launch.
//
//   node build/smoke_test.js                       # uses the chromium at CHROMIUM_PATH or Playwright's default
//   CHROMIUM_PATH=/path/to/chromium node build/smoke_test.js
const path = require("path");
const { chromium } = require("playwright");

const DECK = "file://" + path.resolve(__dirname, "..", "deck.html");

(async () => {
  const opts = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {};
  const browser = await chromium.launch(opts);
  const problems = [];
  try {
    for (const [name, viewport] of [["desktop", { width: 1280, height: 720 }], ["phone", { width: 390, height: 844 }]]) {
      const page = await browser.newPage({ viewport });
      page.on("pageerror", e => problems.push(`${name}: ${e.message}`));
      page.on("console", m => { if (m.type() === "error") problems.push(`${name} console: ${m.text()}`); });
      await page.goto(DECK, { waitUntil: "load" });
      const total = await page.evaluate(() => window.__deck.slides);
      const unresolved = await page.evaluate(() => window.__deck.missing);
      if (unresolved.length) problems.push(`${name}: unresolved tokens ${[...new Set(unresolved)].join(", ")}`);
      for (let i = 1; i <= total; i++) {
        await page.evaluate(n => window.__deck.show(n - 1), i);
        const over = await page.evaluate(() => {
          const s = document.querySelector(".slide.active");
          return s.scrollWidth - s.clientWidth;
        });
        if (over > 2) problems.push(`${name}: slide ${i} overflows sideways by ${over}px`);
      }
      if (name === "desktop") {
        await page.evaluate(() => window.__deck.show(9));
        await page.click(".slide.active .seg button:nth-child(2)");
        const big = await page.textContent(".slide.active .readout .big");
        if (!/Design wet/.test(big)) problems.push(`baseline control did not update: "${big}"`);
        await page.evaluate(() => window.__deck.show(12));
        await page.fill(".slide.active input[type=range]", "6");
        await page.dispatchEvent(".slide.active input[type=range]", "input");
        const sensors = await page.textContent(".slide.active .readout .big");
        if (!/With 6 sensors/.test(sensors)) problems.push(`sensor slider did not update: "${sensors}"`);
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
  if (problems.length) {
    console.error("smoke test failed:\n  " + problems.join("\n  "));
    process.exit(1);
  }
  console.log("smoke test passed: all slides load, no overflow, controls respond");
})().catch(e => { console.error(e); process.exit(1); });
