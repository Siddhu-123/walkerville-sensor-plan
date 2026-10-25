#!/usr/bin/env python3
"""Loads the demo (demo.html) in Chromium and walks every scene at desktop and tablet sizes.
Fails on a page error, an unfilled {{token}}, a panel that needs scrolling on desktop, or a page
wider than the window. The Python twin of story_smoke.js, for the demo page.

    pip install playwright && playwright install chromium
    python presentation/build/demo_smoke.py [screenshot-folder]
"""
import os
import pathlib
import sys

from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
PAGE = (HERE.parent.parent.parent / "demo.html").as_uri()
SIZES = [("desktop", 1440, 900), ("tablet-landscape", 1024, 768), ("tablet-portrait", 768, 1024)]
SHOTS = sys.argv[1] if len(sys.argv) > 1 else None

MEASURE = """() => new Promise((res) => {
  const card = document.getElementById("card"), t0 = performance.now(); let frames = 0;
  const tick = () => { frames++; if (performance.now() - t0 < 600) requestAnimationFrame(tick); else res({
    id: window.__story.scenes[window.__story.cur].id,
    unfilled: card.innerText.match(/\\?\\?\\w+|\\{\\{\\w+\\}\\}/g) || [],
    scroll: card.scrollHeight - card.clientHeight,
    fps: Math.round(frames / ((performance.now() - t0) / 1000)),
    wide: document.documentElement.scrollWidth > window.innerWidth,
  }); };
  requestAnimationFrame(tick);
})"""


def main():
    problems = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=os.environ.get("CHROMIUM_PATH") or None)
        for name, w, h in SIZES:
            page = browser.new_page(viewport={"width": w, "height": h}, device_scale_factor=1)
            page.on("pageerror", lambda e, n=name: problems.append(f"{n}: page error {e}"))
            page.on("console", lambda m, n=name: problems.append(f"{n}: console {m.text}") if m.type == "error" else None)
            page.goto(PAGE)
            page.wait_for_function("() => window.__story")
            n = page.evaluate("() => window.__story.scenes.length")
            for i in range(n):
                page.evaluate("(k) => window.__story.enter(k)", i)
                page.wait_for_timeout(3200 if i == 0 else 2900)
                r = page.evaluate(MEASURE)
                if r["unfilled"]:
                    problems.append(f"{name} {r['id']}: unfilled {' '.join(r['unfilled'])}")
                # the reference list is long by nature and scrolls; every other panel must fit
                if name == "desktop" and r["scroll"] > 4 and r["id"] != "references":
                    problems.append(f"{name} {r['id']}: panel scrolls by {r['scroll']}px")
                if r["wide"]:
                    problems.append(f"{name} {r['id']}: horizontal overflow")
                print(f"{name:<17} {i + 1:>2} {r['id']:<10} fps {r['fps']} scroll {r['scroll']}", flush=True)
                if SHOTS:
                    os.makedirs(SHOTS, exist_ok=True)
                    page.screenshot(path=os.path.join(SHOTS, f"{name}-{i + 1:02d}-{r['id']}.png"))
            page.close()
        browser.close()
    # the basemap's tiles do not load from file://; that is expected, not a page fault
    problems = [p for p in problems if "net::ERR_" not in p and "Failed to load resource" not in p]
    if problems:
        print("PROBLEMS:\n" + "\n".join(problems))
        sys.exit(1)
    print("demo smoke test passed")


if __name__ == "__main__":
    main()
