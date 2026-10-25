#!/usr/bin/env python3
"""Check the slide copy against the data before the deck is shown.

    python build/check_copy.py            # the detail deck (deck.html, content/slides.js)
    python build/check_copy.py --story    # the story page (index.html, content/story.js)


- Every {{token}} in content/slides.js must be a fact the export produced (data/scenario.js)
  or a sourced constant in STATIC_FACTS. An unknown token fails the check.
- Literal numbers in the copy are listed for review. Citations (years, section numbers) and
  dates are expected; a figure about the network should be a token instead.

    python build/check_copy.py
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)


def load_facts():
    text = open(os.path.join(ROOT, "data", "scenario.json"), encoding="utf-8").read()
    facts = json.loads(text)["facts"]
    static_text = open(os.path.join(ROOT, "content", "slides.js"), encoding="utf-8").read()
    block = re.search(r"window\.STATIC_FACTS = \{(.*?)\};", static_text, re.S)
    static = set(re.findall(r"^\s*([a-z_0-9]+):", block.group(1), re.M)) if block else set()
    return facts, static


# Figures the story page measures on load (assets/story.js), from the same network data.
STORY_RUNTIME = {"path_fall_m", "path_km"}


def load_story_facts():
    facts = json.loads(open(os.path.join(ROOT, "data", "story.json"), encoding="utf-8").read())["facts"]
    text = open(os.path.join(ROOT, "content", "story.js"), encoding="utf-8").read()
    block = re.search(r"window\.OSP_STATIC = \{(.*?)\};", text, re.S)
    static = set(re.findall(r"^\s*([a-z_0-9]+):", block.group(1), re.M)) if block else set()
    return facts, static | STORY_RUNTIME, text


# Figures the demo measures on load (demo/engine.js), from the same network data.
DEMO_RUNTIME = {"path_fall_m", "path_km", "stress_half_wet", "stress_half_severe"}


def load_demo_facts():
    demo = os.path.join(os.path.dirname(os.path.dirname(ROOT)), "demo")
    data = open(os.path.join(demo, "story-data.js"), encoding="utf-8").read()
    facts = json.loads(data[data.index("{"):data.rindex("}") + 1])["facts"]
    text = open(os.path.join(demo, "scenes.js"), encoding="utf-8").read()
    block = re.search(r"window\.OSP_STATIC = \{(.*?)\};", text, re.S)
    static = set(re.findall(r"^\s*([a-z_0-9]+):", block.group(1), re.M)) if block else set()
    info = open(os.path.join(demo, "sources.js"), encoding="utf-8").read()
    info = info[info.index("  info: {"):]     # only the info-button text is filled from the data
    return facts, static | DEMO_RUNTIME, text + "\n" + info


def main():
    if "--demo" in sys.argv:
        facts, static, text = load_demo_facts()
        copy = re.sub(r"window\.OSP_STATIC = \{.*?\};", "", text, flags=re.S)
    elif "--story" in sys.argv:
        facts, static, text = load_story_facts()
        copy = re.sub(r"window\.OSP_STATIC = \{.*?\};", "", text, flags=re.S)
    else:
        facts, static = load_facts()
        text = open(os.path.join(ROOT, "content", "slides.js"), encoding="utf-8").read()
        copy = re.sub(r"window\.STATIC_FACTS = \{.*?\};", "", text, flags=re.S)
    known = set(facts) | static
    copy = re.sub(r"(?m)^\s*//.*$", "", copy)     # whole-line comments describe the syntax; they are not copy
    tokens = re.findall(r"\{\{([A-Za-z0-9_]+)\}\}", copy)
    unknown = sorted({t for t in tokens if t not in known})
    print(f"tokens used: {len(tokens)} ({len(set(tokens))} distinct), known facts: {len(known)}")
    if unknown:
        print("UNKNOWN TOKENS:", ", ".join(unknown))
        sys.exit(1)

    # Literal numbers outside tokens, for review (strip tags, tokens and code comments first).
    visible = re.sub(r"<[^>]+>", " ", copy)
    visible = re.sub(r"\{\{[A-Za-z0-9_]+\}\}", " ", visible)
    visible = re.sub(r"//[^\n]*", " ", visible)
    literals = sorted(set(re.findall(r"(?<![A-Za-z_])\d[\d,.%]*", visible)))
    print("literal numbers in copy (review: citations and dates are expected):")
    print("  " + ", ".join(literals))
    print("copy check passed")


if __name__ == "__main__":
    main()
