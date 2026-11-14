#!/usr/bin/env python3
"""Check Sim 4 numeric values and generated regions. Run from the repo root.

Numbers inside strings count too, including IDs, ranges, percentages and prices.
This checks source membership, not whether a number belongs to the right claim.
Percent/fraction comparisons use nearest whole percent (half up); $25k = 25000.
"""

import json
import re
import subprocess
import sys
import tempfile
from decimal import Decimal, ROUND_HALF_UP
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "demo/notes/sim4_source"

# Exact (leaf path, numeric value): one-line derivation. Never allow a whole field
# or a number globally. No exceptions are currently needed; add only values
# calculated from these source exports, with the calculation explained here.
ALLOW = {}

NUMBER = re.compile(
    r"(?P<money>\$\s*)?"
    r"(?P<value>[+-]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?(?:[eE][+-]?\d+)?)"
    r"(?P<k>[kK](?!\w))?(?P<percent>\s*%)?"
)


class PlainText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []

    def handle_data(self, data):
        self.parts.append(data)


def strip_html(value):
    parser = PlainText()
    parser.feed(value)
    return " ".join(parser.parts)


def load_json_assignment(path, name):
    text = path.read_text(encoding="utf-8")
    match = re.search(r"window\." + re.escape(name) + r"\s*=\s*", text)
    if not match:
        raise ValueError(f"{path}: missing window.{name} assignment")
    value, end = json.JSONDecoder().raw_decode(text[match.end():])
    if text[match.end() + end:].strip() not in ("", ";"):
        raise ValueError(f"{path}: unexpected text after JSON assignment")
    return value


def leaves(value, path="", include_keys=False):
    if isinstance(value, dict):
        for key, item in value.items():
            if include_keys:
                yield path, key
            yield from leaves(item, f"{path}.{key}" if path else key, include_keys)
    elif isinstance(value, list):
        for index, item in enumerate(value):
            yield from leaves(item, f"{path}[{index}]", include_keys)
    else:
        yield path, value


def numbers(value):
    if isinstance(value, bool) or value is None:
        return
    if isinstance(value, (int, float)):
        yield Decimal(str(value)), "number"
    elif isinstance(value, str):
        for match in NUMBER.finditer(value):
            number = Decimal(match["value"].replace(",", ""))
            if match["money"] and match["k"]:
                number *= 1000
            kind = "money" if match["money"] else "percent" if match["percent"] else "number"
            yield number, kind


def whole(value):
    return value.quantize(Decimal("1"), rounding=ROUND_HALF_UP)


def check_numbers():
    sim4 = load_json_assignment(SOURCE / "sim4.js", "SIM4")
    regions = load_json_assignment(SOURCE / "regions.js", "SIM3_REGIONS")
    for field in ("tables", "limits"):
        sim4["expert"][field] = strip_html(sim4["expert"][field])

    raw, percents = set(), set()
    for _, value in leaves([sim4, regions], include_keys=True):
        if isinstance(value, str) and "<" in value:
            value = strip_html(value)
        for number, kind in numbers(value):
            if kind == "percent":
                percents.add(whole(number))
            else:
                raw.add(number)
                if kind == "number" and 0 <= number <= 1:
                    percents.add(whole(number * 100))

    # Use Node's JS parser rather than trying to rewrite object literal syntax.
    script = """
const fs = require('fs'), vm = require('vm');
const context = {window: {}};
vm.runInNewContext(fs.readFileSync('demo/sim4-facts.js', 'utf8'), context,
                   {timeout: 1000});
if (!context.window.OSP_SIM4) throw Error('missing window.OSP_SIM4');
process.stdout.write(JSON.stringify(context.window.OSP_SIM4));
"""
    result = subprocess.run(["node", "-e", script], cwd=ROOT, check=True,
                            capture_output=True, text=True)
    facts = json.loads(result.stdout)
    failures = []
    count = 0
    for section in ("facts", "curves", "budget_compare", "holdout_k5"):
        if section not in facts or not facts[section]:
            failures.append(f"OSP_SIM4.{section}: missing or empty")
            continue
        for path, value in leaves(facts[section], section):
            for number, kind in numbers(value):
                count += 1
                allowed = (path, str(number)) in ALLOW
                if kind == "percent":
                    matched = whole(number) in percents or number / 100 in raw
                else:
                    matched = number in raw
                    if kind == "number" and 0 <= number <= 1:
                        matched |= whole(number * 100) in percents
                    elif kind == "number" and number == whole(number) and 0 <= number <= 100:
                        matched |= number in percents
                if not matched and not allowed:
                    failures.append(f"OSP_SIM4.{path}: {number} is unsourced (value {value!r})")
    print(f"Sim 4 facts: checked {count} numeric values")
    return failures


def check_regions():
    # The builder has a fixed relative output path. Supply its source directory
    # in a temporary repo-shaped directory so the tracked output is never written.
    with tempfile.TemporaryDirectory(prefix="sim4-check-") as directory:
        temporary = Path(directory)
        (temporary / "demo/notes").mkdir(parents=True)
        (temporary / "demo/notes/sim4_source").symlink_to(SOURCE, target_is_directory=True)
        subprocess.run([sys.executable, str(ROOT / "demo/tools/build_sim4_regions.py")],
                       cwd=temporary, check=True, capture_output=True, text=True)
        if (temporary / "demo/sim4-regions.js").read_bytes() != (ROOT / "demo/sim4-regions.js").read_bytes():
            return ["demo/sim4-regions.js differs from fresh build_sim4_regions.py output"]
    print("Sim 4 regions: matches fresh generated output")
    return []


def main():
    failures = []
    for check in (check_numbers, check_regions):
        try:
            failures.extend(check())
        except (OSError, ValueError, KeyError, TypeError, subprocess.SubprocessError) as error:
            failures.append(str(error))
            if isinstance(error, subprocess.CalledProcessError) and error.stderr:
                failures.append(error.stderr.strip())
    for failure in failures:
        print(f"FAIL: {failure}", file=sys.stderr)
    if failures:
        return 1
    print("Sim 4 facts and regions OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
