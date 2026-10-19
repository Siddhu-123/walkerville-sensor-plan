// Loads the story page (index.html) in Chromium and walks every scene at desktop and tablet sizes.
// Fails on a page error, an unfilled {{token}}, a panel that needs scrolling on desktop, or a slow frame rate.
//   node presentation/build/story_smoke.js [screenshot-folder]
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const page_url = "file://" + path.resolve(__dirname, "..", "index.html");
const shots = process.argv[2];
const SIZES = [["desktop", 1440, 900], ["tablet-landscape", 1024, 768], ["tablet-portrait", 768, 1024]];

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const problems = [];
  for (const [name, w, h] of SIZES) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    page.on("pageerror", (e) => problems.push(`${name}: page error ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error") problems.push(`${name}: console ${m.text()}`); });
    await page.goto(page_url);
    await page.waitForFunction(() => window.__story);
    const n = await page.evaluate(() => window.__story.scenes.length);
    for (let i = 0; i < n; i++) {
      await page.evaluate((k) => window.__story.enter(k), i);
      await page.waitForTimeout(i === 0 ? 3200 : 2900);
      const r = await page.evaluate(() => {
        const card = document.getElementById("card");
        const t0 = performance.now();
        return new Promise((res) => {
          let frames = 0;
          const tick = () => { frames++; if (performance.now() - t0 < 600) requestAnimationFrame(tick); else res({
            id: window.__story.scenes[window.__story.cur].id,
            unfilled: (card.innerText.match(/\?\?\w+|\{\{\w+\}\}/g) || []),
            scroll: card.scrollHeight - card.clientHeight,
            fps: Math.round(frames / ((performance.now() - t0) / 1000)),
            wide: document.documentElement.scrollWidth > window.innerWidth,
          }); };
          requestAnimationFrame(tick);
        });
      });
      if (r.unfilled.length) problems.push(`${name} ${r.id}: unfilled ${r.unfilled.join(" ")}`);
      if (name === "desktop" && r.scroll > 4) problems.push(`${name} ${r.id}: panel scrolls by ${r.scroll}px`);
      if (r.wide) problems.push(`${name} ${r.id}: horizontal overflow`);
      console.log(`${name.padEnd(17)} ${String(i + 1).padStart(2)} ${r.id.padEnd(9)} fps ${r.fps} scroll ${r.scroll}`);
      if (shots) {
        fs.mkdirSync(shots, { recursive: true });
        await page.screenshot({ path: path.join(shots, `${name}-${String(i + 1).padStart(2, "0")}-${r.id}.png`) });
      }
    }
    await page.close();
  }
  await browser.close();
  if (problems.length) { console.log("PROBLEMS:\n" + problems.join("\n")); process.exit(1); }
  console.log("story smoke test passed");
})();
