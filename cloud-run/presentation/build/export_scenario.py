#!/usr/bin/env python3
"""Turn the pinned Simulation 2.5 results into the numbers the presentation shows.

Reads only what is vendored under presentation/data/source/ (see SOURCE.md there) and writes
presentation/data/scenario.json, geometry.json and config.json. Every figure on a slide comes
from these files; nothing is typed into the slide text.

The scoring is the one the sandbox page uses (tools/build_sim25_web.py, placement, and
simulation25/placement.js), so the numbers here are the page's numbers. --check re-derives the
figures the findings text states and fails if any of them disagree.

    python build/export_scenario.py            # write the JSON
    python build/export_scenario.py --check    # write the JSON and reconcile with the findings
"""
import argparse
import glob
import json
import os
import re
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
# SA Water data must never be committed. Point these at a private folder for a real build:
#   OSP_DECK_SOURCE  folder with the same layout as data/source/ (grid, geometry, config.js)
#   OSP_DECK_OUT     folder for the generated scenario, geometry and config files
SRC = os.environ.get("OSP_DECK_SOURCE", os.path.join(ROOT, "data", "source"))
OUT = os.environ.get("OSP_DECK_OUT", os.path.join(ROOT, "data"))

MAX_SENSORS_FALLBACK = 10


# ---------------------------------------------------------------- inputs

def load_config():
    """config.js is a script that assigns one JSON object; read the object between the braces
    that follow the OSP_CONFIG assignment (the header comment has braces of its own)."""
    text = open(os.path.join(SRC, "config.js"), encoding="utf-8").read()
    start = text.index("OSP_CONFIG = {") + len("OSP_CONFIG = ")
    end = text.rindex("}") + 1
    return json.loads(text[start:end])


def load_summaries():
    summaries = {}
    for path in sorted(glob.glob(os.path.join(SRC, "grid_whole", "*", "summary.json"))):
        summary = json.load(open(path, encoding="utf-8"))
        summaries[summary["tag"]] = summary
    return summaries


def weather_label(cfg_case_set, ii):
    for w in cfg_case_set["weather"]:
        if round(w["ii"], 2) == round(ii, 2):
            return w["label"], w["note"]
    return f"I&I {ii}", ""


def case_list(cfg, summaries):
    """Cases in config order: each weather level, then each variant at the levels it names.
    A summary belongs to a case when it carries every field the case sets."""
    sim = cfg["simulation"]
    cset = sim["case_sets"][sim["case_set"]]
    wanted = []
    for w in cset["weather"]:
        wanted.append((w["ii"], {}, w["label"], w["note"], None))
    for variant in cset["sensitivity"]["variants"]:
        for ii in cset["sensitivity"]["at_ii"]:
            label, note = weather_label(cset, ii)
            wanted.append((ii, variant["set"], label, "", variant["label"]))
    cases = []
    for idx, (ii, extra, label, note, variant) in enumerate(wanted):
        match = [tag for tag, s in summaries.items()
                 if round(s["case"]["ii"], 2) == round(ii, 2)
                 and all(s["case"].get(k) == v for k, v in extra.items())
                 and (extra or (s["case"].get("age") == "uniform" and s["case"].get("bfac") == 1.0))]
        if len(match) != 1:
            sys.exit(f"case {label!r} matches {len(match)} summaries; expected one")
        s = summaries[match[0]]
        full = label + (f" + {variant}" if variant else "")
        cases.append({"id": idx, "tag": match[0], "label": full, "note": note,
                      "ii": round(ii, 2)})
    return cases


def chamber_list(summary):
    """Chambers in the builder's order: sorted by manhole ID (the same order as its MH<id> names,
    since every ID has seven digits)."""
    return sorted(int(k) for k in summary["baseline_depth_m"])


def load_geometry(chambers):
    geo_dir = os.path.join(SRC, "geometry")
    mh = json.load(open(os.path.join(geo_dir, "manholes.json"), encoding="utf-8"))
    mains = json.load(open(os.path.join(geo_dir, "mains.json"), encoding="utf-8"))
    pos = {}
    for f in mh["features"]:
        pos[int(f["attributes"]["ID"])] = (f["geometry"]["x"], f["geometry"]["y"])
    missing = [c for c in chambers if c not in pos]
    if missing:
        sys.exit(f"{len(missing)} modelled chambers have no position, e.g. {missing[:3]}")
    xs = [pos[c][0] for c in chambers]
    ys = [pos[c][1] for c in chambers]
    ox, oy = min(xs), min(ys)
    lines = []
    for f in mains["features"]:
        for path in f["geometry"]["paths"]:
            flat = []
            for x, y in path:
                flat += [round(x - ox), round(y - oy)]
            lines.append(flat)
    return {"units": "metres, from the SA Water layer's projected grid, origin at the south-west corner",
            "chambers": [{"id": c, "x": round(pos[c][0] - ox), "y": round(pos[c][1] - oy)}
                         for c in chambers],
            "mains": lines}


# ---------------------------------------------------------------- scoring (as the page does)

def tips_for(summary, dwellings, rule, index):
    """For each growth site at this size: the chamber indices that see the growth under the rule.
    alarm: manholes that newly pass the alarm depth. rise R: manholes whose depth rises by >= R mm."""
    out = []
    for row in summary["rows"]:
        if row["dwellings"] != dwellings:
            continue
        if rule["id"] == "alarm":
            seen = [index[int(m)] for m in row["alarm"]]
        else:
            seen = [index[int(m)] for m, rise in row["rise_mm"].items() if rise >= rule["mm"]]
        out.append((index[row["site"]], sorted(seen)))
    return out


def pools_for(summaries, cases, sizes, rule, index):
    """Per case: the growth scenarios that some chamber sees, as one list of seeing sets."""
    pools = []
    for case in cases:
        tips = []
        for dwellings in sizes:
            tips += [seen for _site, seen in tips_for(summaries[case["tag"]], dwellings, rule, index)]
        pools.append([t for t in tips if t])
    return pools


def matrices(pools, n):
    """One boolean matrix per case: scenario x chamber, true where that chamber sees the scenario."""
    mats = []
    for pool in pools:
        m = np.zeros((len(pool), n), dtype=bool)
        for s, seen in enumerate(pool):
            m[s, seen] = True
        mats.append(m)
    return mats


def greedy(mats, k_max, objective):
    """The builder's greedy, step for step: each sensor is the chamber that most raises the
    objective (mean or worst case across cases); ties go to the lower index, as the builder's
    strict '>' does. Returns the order and the worst / mean share after each sensor."""
    n = mats[0].shape[1]
    covered = [np.zeros(m.shape[0], dtype=bool) for m in mats]
    counts = [0] * len(mats)
    chosen, order, worst, mean = [], [], [], []
    for _ in range(k_max):
        hits = [(m & ~c[:, None]).sum(axis=0) for m, c in zip(mats, covered)]
        fractions = [(counts[c] + hits[c]) / mats[c].shape[0] for c in range(len(mats))]
        total = np.zeros(n)
        for f in fractions:
            total = total + f
        avg = total / len(mats)
        low = np.min(np.vstack(fractions), axis=0)
        primary, secondary = (avg, low) if objective == "mean" else (low, avg)
        best, best_key = None, None
        for c in range(n):
            if c in chosen:
                continue
            key = (primary[c], secondary[c])
            if best_key is None or key > best_key:
                best, best_key = c, key
        chosen.append(best)
        order.append(best)
        for c, m in enumerate(mats):
            covered[c] |= m[:, best]
            counts[c] = int(covered[c].sum())
        shares = [counts[c] / mats[c].shape[0] for c in range(len(mats))]
        worst.append(min(shares))
        total = 0.0
        for s in shares:
            total += s
        mean.append(total / len(shares))
    return order, worst, mean


def single_sensor_heat(mats):
    """Each chamber on its own: its worst and mean share over the cases (the builder's heatmap)."""
    per_case = [m.sum(axis=0) / m.shape[0] for m in mats]
    stack = np.vstack(per_case)
    total = np.zeros(stack.shape[1])
    for row in stack:
        total = total + row
    return {"worst": np.min(stack, axis=0).tolist(), "mean": (total / len(mats)).tolist()}


def mulberry32(seed):
    """The sandbox's seeded generator (simulation25/placement.js rng), with JavaScript's 32-bit
    integer rules, so the random sets are the same ones the page scores."""
    def i32(x):
        x &= 0xFFFFFFFF
        return x - (1 << 32) if x >= 1 << 31 else x

    def imul(a, b):
        return i32((a * b) & 0xFFFFFFFF)

    def ushr(x, n):
        return (x & 0xFFFFFFFF) >> n

    state = [i32(seed)]

    def r():
        s = i32(state[0] + 0x6D2B79F5)
        state[0] = s
        t = imul(s ^ ushr(s, 15), 1 | s)
        t = i32(t + imul(t ^ ushr(t, 7), 61 | t)) ^ t
        t = i32(t)
        return ((t ^ ushr(t, 14)) & 0xFFFFFFFF) / 4294967296
    return r


def random_best_of_20(mats, k_max, objective, n, seed=20261008):
    """simulation25/placement.js 'random': at each size, twenty random sets, keeping the best."""
    r = mulberry32(seed)
    worst_sets, worst, mean = [], [], []
    for k in range(k_max):
        best = None
        for _ in range(20):
            pick = set()
            while len(pick) < k + 1:
                pick.add(int(np.floor(r() * n)))
            shares = [int(np.any(m[:, sorted(pick)], axis=1).sum()) / m.shape[0] for m in mats]
            w, avg_total = min(shares), 0.0
            for s in shares:
                avg_total += s
            avg = avg_total / len(shares)
            cand = {"s": sorted(pick), "w": w, "m": avg}
            if best is None:
                better = True
            elif objective == "mean":
                better = cand["m"] > best["m"] or (cand["m"] == best["m"] and cand["w"] > best["w"])
            else:
                better = cand["w"] > best["w"] or (cand["w"] == best["w"] and cand["m"] > best["m"])
            if better:
                best = cand
        worst_sets.append(best["s"])
        worst.append(best["w"])
        mean.append(best["m"])
    return worst_sets, worst, mean


# ---------------------------------------------------------------- derived tables

def exposure(summaries, cases, sizes, rules, index):
    """Per case, size and growth site: how many chambers respond under each rule, and how far."""
    out = {}
    for case in cases:
        per_size = {}
        for dwellings in sizes:
            rows = {}
            for row in summaries[case["tag"]]["rows"]:
                if row["dwellings"] != dwellings:
                    continue
                rises = [v for v in row["rise_mm"].values()]
                rows[index[row["site"]]] = {
                    "alarm": len(row["alarm"]),
                    "spill": len(row["spilled"]),
                    "max_rise_mm": round(max(rises), 1) if rises else 0.0,
                    **{f"r{rule['mm']}": sum(1 for v in rises if v >= rule["mm"])
                       for rule in rules if rule["id"] != "alarm"},
                }
            per_size[str(dwellings)] = [rows.get(i) for i in range(len(index))]
        out[str(case["id"])] = per_size
    return out


def baselines(summaries, cases, index):
    out = {}
    for case in cases:
        b = summaries[case["tag"]]["baseline"]
        out[str(case["id"])] = {
            "alarm": len(b["alarm"]), "surcharged": len(b["surcharged"]),
            "spilled": len(b["spilled"]),
            "alarm_chambers": sorted(index[int(m)] for m in b["alarm"]),
            "surcharged_chambers": sorted(index[int(m)] for m in b["surcharged"]),
        }
    return out


def robustness(index):
    """How often each chamber is chosen across the cases, for the worst-case objective."""
    raw = json.load(open(os.path.join(SRC, "robustness.json"), encoding="utf-8"))["robustness"]
    return {rule: [{"chamber": r["manhole"], "chosen_in": r["chosen_in"], "of": r["of"]}
                   for r in rows if r["manhole"] in index]
            for rule, rows in raw.items()}


# ---------------------------------------------------------------- reconciliation with the findings

def published_findings():
    """Figures the findings text states, read from the page's own text, so --check compares
    the presentation with what the page says rather than with a copy of this script."""
    text = open(os.path.join(SRC, "findings_index.js"), encoding="utf-8").read()
    fig = {}
    m = re.search(r"(\d+) / (\d+) / (\d+) / (\d+) / (\d+) manholes are already over the 150 mm alarm", text)
    if m:
        fig["baseline_alarm"] = [int(x) for x in m.groups()]
    m = re.search(r"and (\d+) / (\d+) / (\d+) / (\d+) / (\d+) are surcharged", text)
    if m:
        fig["baseline_surcharged"] = [int(x) for x in m.groups()]
    rows = {}
    for label in ["150 mm alarm, worst case", "150 mm alarm, average",
                  "Rise 25 mm, worst case", "Rise 25 mm, average"]:
        mm = re.search(re.escape(label) + r"\s*\|([^\\\n]*)", text)
        if mm:
            rows[label] = [int(x) for x in re.findall(r"(\d+)%", mm.group(1))]
    fig["coverage_pct"] = rows
    fig["coverage_sensor_counts"] = [1, 2, 3, 4, 6, 10]
    fig["_text"] = text
    return fig


def reconcile(result, findings):
    problems, lines = [], []
    lines.append(f"runs: {result['counts']['runs']} (published 8,200)")
    if result["counts"]["runs"] != 8200:
        problems.append("total runs")
    if "baseline_alarm" in findings:
        got = [result["baseline"][str(c["id"])]["alarm"] for c in result["cases"][:5]]
        lines.append(f"baseline alarm {got} vs published {findings['baseline_alarm']}")
        if got != findings["baseline_alarm"]:
            problems.append("baseline alarm")
    if "baseline_surcharged" in findings:
        got = [result["baseline"][str(c["id"])]["surcharged"] for c in result["cases"][:5]]
        lines.append(f"baseline surcharged {got} vs published {findings['baseline_surcharged']}")
        if got != findings["baseline_surcharged"]:
            problems.append("baseline surcharged")
    m = re.search(r"adds a spill in (\d+) of \d+ runs at \+80 dwellings, (\d+) at \+150 and (\d+) at \+700", findings.get("_text", ""))
    if m:
        got = [result["facts"][f"spill_runs_severe_{s}"] for s in (80, 150, 700)]
        lines.append(f"severe spill runs at 80/150/700: computed {got} vs published {[int(x) for x in m.groups()]}")
        if got != [int(x) for x in m.groups()]:
            problems.append("spill runs")
    ks = findings["coverage_sensor_counts"]
    for label, values in findings["coverage_pct"].items():
        rule = "alarm" if label.startswith("150") else "r25"
        metric = "worst" if label.endswith("worst case") else "mean"
        curve = result["coverage"][rule]["worst"][metric]   # the page's table: worst-case objective
        got = [round(100 * curve[k - 1]) for k in ks]
        lines.append(f"{label}: computed {got} vs published {values}")
        if got != values:
            problems.append(label)
    rnd = result["methods"]["random_best_of_20_worst"]
    k3 = [round(100 * rnd["worst"][2]), round(100 * rnd["mean"][2])]
    lines.append(f"random best-of-20, 3 sensors, 25 mm: worst/average {k3} vs published [7, 25]")
    if k3 != [7, 25]:
        problems.append("random best-of-20")
    return lines, problems


CASE_KEYS = ["dry", "design_wet", "severe", "age_weighted", "inflow_x15"]


def facts(result, summaries, cases, sizes, rules, index):
    """Named figures the slide copy quotes. Each one is computed here from the runs, so a slide
    can only say a number that the export produced; build/check_copy.py enforces that."""
    f = {"runs": result["counts"]["runs"], "cases": len(cases), "sites": result["counts"]["chambers"],
         "sizes": ", ".join(str(s) for s in sizes[:-1]) + f" and {sizes[-1]}",
         "max_sensors": result["max_sensors"],
         "alarm_mm": rules[0]["mm"],
         "rises": ", ".join(str(r["mm"]) for r in rules[1:-1]) + f" and {rules[-1]['mm']}"}
    key_of = dict(zip([c["id"] for c in cases], CASE_KEYS))
    for c in cases:
        k = key_of[c["id"]]
        b = result["baseline"][str(c["id"])]
        f[f"base_alarm_{k}"] = b["alarm"]
        f[f"base_surcharged_{k}"] = b["surcharged"]
    for rule in rules:
        for obj in ("worst", "mean"):
            for metric in ("worst", "mean"):
                for k in range(1, result["max_sensors"] + 1):
                    v = result["coverage"][rule["id"]][obj][metric][k - 1]
                    f[f"cov_{rule['id']}_{obj}_{metric}_k{k}"] = round(100 * v)
    # Extra growth from each added sensor, in percentage points (k=1 is the first sensor's total).
    k_max = result["max_sensors"]
    for rule in rules:
        for obj in ("worst", "mean"):
            for metric in ("worst", "mean"):
                curve = [f[f"cov_{rule['id']}_{obj}_{metric}_k{k}"] for k in range(1, k_max + 1)]
                for k in range(2, k_max + 1):
                    f[f"inc_{rule['id']}_{obj}_{metric}_k{k}"] = curve[k - 1] - curve[k - 2]
                steps = [curve[k - 1] - curve[k - 2] for k in range(7, k_max + 1)]
                f[f"inc_after6_max_{rule['id']}_{obj}_{metric}"] = max(steps) if steps else 0
    # Where the fixed alarm overtakes the rise rule: the last sensor count at which the rise
    # rule still catches more, for the worst case and for the average (sensors chosen for the worst case).
    alarm = result["coverage"]["alarm"]["worst"]
    focus_rule = [r for r in rules if r["mm"] == 25][0]["id"]
    rise = result["coverage"][focus_rule]["worst"]
    for metric in ("worst", "mean"):
        lead = 0
        for k in range(1, k_max + 1):
            if rise[metric][k - 1] > alarm[metric][k - 1]:
                lead = k
            else:
                break
        f[f"rise_leads_until_{metric}"] = lead
    focus = [r for r in rules if r["mm"] == 25]
    f["rise_focus_mm"] = focus[0]["mm"] if focus else None
    f["size_focus"] = 150
    if f["size_focus"] not in sizes or f["rise_focus_mm"] is None:
        sys.exit("slide focus values (150 dwellings, 25 mm rise) are not in config.js")
    f["cases"] = len(cases)
    rnd = result["methods"]["random_best_of_20_worst"]
    f["random_k3_worst"] = round(100 * rnd["worst"][2])
    f["random_k3_mean"] = round(100 * rnd["mean"][2])
    # Spills and responses, from the runs themselves (new spills only, against the baseline).
    sev = cases[2]["tag"]
    base_sp = set(summaries[sev]["baseline"]["spilled"])
    alarm_base = set(summaries[sev]["baseline"]["alarm"])
    inst, mh = 0, set()
    for row in summaries[sev]["rows"]:
        new = set(row["spilled"]) - base_sp
        inst += len(new)
        mh |= new
        f.setdefault("_spill_runs", {}).setdefault(str(row["dwellings"]), 0)
        if new:
            f["_spill_runs"][str(row["dwellings"])] += 1
    for size in sizes:
        f[f"spill_runs_severe_{size}"] = f["_spill_runs"].get(str(size), 0)
    del f["_spill_runs"]
    f["spill_instances_severe"] = inst
    f["spill_manholes_severe"] = len(mh)
    f["spill_manholes_over_alarm_severe"] = len(mh & alarm_base)
    dry = summaries[cases[0]["tag"]]
    for size in sizes:
        rows = [r for r in dry["rows"] if r["dwellings"] == size]
        f[f"dry_alarm_runs_{size}"] = sum(1 for r in rows if r["alarm"])
    wet = summaries[cases[1]["tag"]]
    for size in sizes:
        rows = [r for r in wet["rows"] if r["dwellings"] == size]
        counts = sorted(sum(1 for v in r["rise_mm"].values() if v >= 25) for r in rows)
        f[f"wet_sites_rise25_{size}"] = sum(1 for c in counts if c > 0)
        f[f"wet_median_rise25_{size}"] = counts[len(counts) // 2]
    return f


# ---------------------------------------------------------------- main

def build(check, skip_reconcile=False):
    cfg = load_config()
    sim = cfg["simulation"]
    sizes = [int(d) for d in sim["growth_dwellings"]] + [int(sim["stress_dwellings"])]
    max_k = int(sim.get("max_sensors", MAX_SENSORS_FALLBACK))
    rules = [{"id": "alarm", "label": f"{sim['alarm_depth_mm']:g} mm alarm", "mm": sim["alarm_depth_mm"]}]
    rules += [{"id": f"r{mm:g}", "label": f"Rise {mm:g} mm", "mm": mm} for mm in sim["detection_rises_mm"]]

    summaries = load_summaries()
    cases = case_list(cfg, summaries)
    first = summaries[cases[0]["tag"]]
    chambers = chamber_list(first)
    index = {c: i for i, c in enumerate(chambers)}
    n = len(chambers)

    runs = sum(len(s["rows"]) for s in summaries.values())
    result = {
        "counts": {"cases": len(cases), "chambers": n, "growth_sizes": sizes,
                   "runs": runs, "rows_per_case": len(first["rows"])},
        "source": {"sandbox_commit": "e6232db", "study_area": sim["study_area"],
                   "files": "data/source/SHA256SUMS"},
        "rules": rules, "cases": cases, "sizes": sizes, "max_sensors": max_k,
        "baseline": baselines(summaries, cases, index),
        "exposure": exposure(summaries, cases, sizes, rules, index),
        "coverage": {}, "heat": {}, "methods": {},
    }

    for rule in rules:
        pools = pools_for(summaries, cases, sizes, rule, index)
        mats = matrices(pools, n)
        entry = {"scenarios_per_case": [m.shape[0] for m in mats]}
        for objective in ("worst", "mean"):
            order, worst, mean = greedy(mats, max_k, objective)
            entry[objective] = {
                "worst": [round(v, 4) for v in worst],
                "mean": [round(v, 4) for v in mean],
                "sets": [order[:k + 1] for k in range(max_k)],
            }
        result["coverage"][rule["id"]] = entry
        result["heat"][rule["id"]] = single_sensor_heat(mats)
        if rule["id"] == "r25":
            rw_sets, rw, rm = random_best_of_20(mats, max_k, "worst", n)
            result["methods"]["random_best_of_20_worst"] = {
                "sets": [[chambers[c] for c in s] for s in rw_sets],
                "worst": [round(v, 4) for v in rw], "mean": [round(v, 4) for v in rm]}

    result["robustness"] = robustness(index)
    result["chambers"] = chambers
    result["geometry"] = load_geometry(chambers)
    result["sensor_ids"] = {
        rule_id: {obj: [[chambers[c] for c in s] for s in entry[obj]["sets"]]
                  for obj in ("worst", "mean")}
        for rule_id, entry in result["coverage"].items()}

    result["facts"] = facts(result, summaries, cases, sizes, rules, index)
    findings = published_findings()
    lines, problems = reconcile(result, findings)
    if skip_reconcile:
        # New data has its own numbers; the Walkerville findings text does not apply to it.
        print("\n".join(lines))
        problems = []
        lines = lines + ["(reconciliation skipped: source is not the Walkerville snapshot)"]
    result["reconciliation"] = {"lines": lines, "problems": problems,
                                "findings": {k: v for k, v in findings.items() if k != "_text"}}

    if check:
        print("\n".join(lines))
        if problems:
            sys.exit("reconciliation failed: " + ", ".join(problems))
        print("reconciliation passed")

    os.makedirs(OUT, exist_ok=True)
    geometry = result.pop("geometry")
    write_pair("scenario", result)
    write_pair("geometry", geometry)
    write_pair("config", cfg)
    print(f"wrote {os.path.relpath(OUT, ROOT)}/scenario, geometry, config (.json and .js)")


def write_pair(name, payload):
    """JSON for inspection and tests, and the same object as a script so the deck opens from file://."""
    text = json.dumps(payload, separators=(",", ":"))
    open(os.path.join(OUT, f"{name}.json"), "w", encoding="utf-8").write(text)
    varname = {"scenario": "SCENARIO", "geometry": "GEOMETRY", "config": "CONFIG"}[name]
    open(os.path.join(OUT, f"{name}.js"), "w", encoding="utf-8").write(
        f"// Generated by build/export_scenario.py. Do not edit by hand.\nwindow.{varname} = {text};\n")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true", help="reconcile with the findings text")
    ap.add_argument("--skip-reconcile", action="store_true",
                    help="for a source other than the Walkerville snapshot: print the figures, skip the findings check")
    args = ap.parse_args()
    build(args.check, args.skip_reconcile)
