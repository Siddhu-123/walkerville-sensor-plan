#!/usr/bin/env python3
"""Builds demo/story-data.js, the data behind the demo (demo.html), from the Simulation 3 results.

Reads the vendored Simulation 3 infill grid (data/source/sim3/, see SOURCE.md there) and takes the
network drawing (pipes, manholes, homes, outlet) from data/story.json, which export_story.py built
from the same 328-manhole network. Writes demo/story-data.js and data/story3.json.

    pip install numpy pulp highspy
    python presentation/build/export_sim3.py           # about a minute: 30 exact solves
    python presentation/build/export_sim3.py --check   # also fail unless the plan matches analysis.json

The growth question (Simulation 3, family A): new homes spread through one of eight areas, at seven
build-out steps from 10% to 300% of the area's share of the 2021 to 2041 projection, under eight
weather cases: 56 growth scenarios a case. A scenario is detectable when some manhole rises
RULE_MM or more; a plan sees it when one of its sensors does. The plan is the exact optimum
(HiGHS) of the worst case over the eight cases, ties broken on the average; one at a time (greedy)
is kept beside it for comparison.
"""
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import export_scenario as ex  # noqa: E402
import prove_placement as pp  # noqa: E402

SRC3 = os.path.join(ex.SRC, "sim3")
DEMO = os.path.join(os.path.dirname(ex.ROOT), "..", "demo")
RULE_MM = 10.0
PHASE1_K, K_MAX = 5, 10
FOCUS_STEP = 1.0          # 100% build-out: the step the map's examples show
MIN_RISE_MM = 2.0         # responses below this are left out of the page data (invisible on the map)
ALARM_MM = 150

# Case order on the page: the three the demo has always shown first (dry, design wet, storm), then
# beyond design, then the four variants. Tags are the grid's own folder names.
CASES = [
    ("ii0.00_flat_uniform_b1_sfree", "Dry", "Dry day", "Sewage only, no leakage into the pipes."),
    ("ii0.11_flat_uniform_b1_sfree", "Design wet", "Design wet",
     "Leakage at the level that just meets the utility's design rating for these pipes."),
    ("ii0.40_flat_uniform_b1_sfree", "Severe", "Storm", "A heavy wet period, well past the design rating."),
    ("ii0.25_flat_uniform_b1_sfree", "Beyond design", "Beyond design",
     "Leakage between the design rating and the storm case."),
    ("ii0.11_flat_weighted_b1_sfree", "Design wet + older pipes leak more", "Leaky old pipes",
     "Design-wet leakage, shifted toward the older pipes."),
    ("ii0.11_flat_uniform_b1.5_sfree", "Design wet + outside inflow x1.5", "Extra inflow",
     "Design wet, with half as much again arriving from outside the area."),
    ("ii0.25_flat_weighted_b1_sfree", "Beyond design + older pipes leak more", "Beyond, old pipes",
     "Beyond-design leakage, shifted toward the older pipes."),
    ("ii0.25_flat_uniform_b1.5_sfree", "Beyond design + outside inflow x1.5", "Beyond, extra inflow",
     "Beyond-design leakage, with half as much again arriving from outside the area."),
]
# Short area names for labels; the long names are the grid's own (regions[].name).
SHORT = {"R1": "Upper main line", "R2": "East branch", "R3": "Near-outlet branch",
         "R4": "Small east branch", "R5": "Central branch", "R6": "South-west branch",
         "R7": "Rest of the suburb", "R8": "Walkerville Terrace corridor"}


TIE_BREAK = 1e-4  # the mean share is at most 1, so this never outweighs one scenario (>= 1/36) in the worst case


def optimum(mats, k, fixed=(), time_limit=120):
    """Max over k-sets of the worst case's share; among equal worst cases, the best mean (the same
    integer program as prove_placement.optimum, written for PuLP 3). Identical scenario rows merge
    with a weight; `fixed` chambers are forced in. Returns (chosen, proven, seconds)."""
    import time
    import pulp
    n = mats[0].shape[1]
    prob = pulp.LpProblem("maxmin_coverage", pulp.LpMaximize)
    x = [pulp.LpVariable(f"x{j}", cat="Binary") for j in range(n)]
    t = pulp.LpVariable("t", 0, 1)
    case_shares = []
    prob += pulp.lpSum(x) == k
    for j in fixed:
        prob += x[j] == 1
    for c, m in enumerate(mats):
        rows, weights = np.unique(m, axis=0, return_counts=True)
        terms = []
        for r, (row, w) in enumerate(zip(rows, weights)):
            y = pulp.LpVariable(f"y{c}_{r}", 0, 1)
            prob += y <= pulp.lpSum(x[j] for j in np.flatnonzero(row))
            terms.append(int(w) * y)
        prob += t * m.shape[0] <= pulp.lpSum(terms)
        case_shares.append(pulp.lpSum(terms) * (1.0 / (m.shape[0] * len(mats))))
    prob += t + TIE_BREAK * pulp.lpSum(case_shares)
    start = time.time()
    status = prob.solve(pulp.HiGHS(msg=False, timeLimit=time_limit))
    chosen = [j for j in range(n) if x[j].value() and x[j].value() > 0.5]
    secs = round(time.time() - start, 1)
    return chosen, pulp.LpStatus[status] == "Optimal" and secs < time_limit, secs


def load():
    summaries = {}
    for tag, *_ in CASES:
        summaries[tag] = json.load(open(os.path.join(SRC3, tag, "summary.json"), encoding="utf-8"))
    analysis = json.load(open(os.path.join(SRC3, "analysis.json"), encoding="utf-8"))
    geo = json.load(open(os.path.join(ex.OUT, "story.json"), encoding="utf-8"))
    return summaries, analysis, geo


def main(check):
    summaries, analysis, geo = load()
    first = summaries[CASES[0][0]]
    chambers = [c["id"] for c in geo["chambers"]]
    if chambers != first["candidates"]:
        raise SystemExit("the Simulation 3 candidates are not the drawn network's 328 manholes, in order")
    index = {c: i for i, c in enumerate(chambers)}
    n = len(chambers)
    regions = first["regions"]
    ladder = first["ladder"]
    rid = {r["id"]: k for k, r in enumerate(regions)}

    # ---------------------------------------------------------------- scenario matrices
    # One row per (area, step), in the grid's order; a row is detectable when some manhole sees it.
    keys = [(r["id"], s) for r in regions for s in ladder]
    rises = {}       # tag -> (area, step) -> {chamber index: mm}
    dwell = {}
    for tag, *_ in CASES:
        rows = {}
        for row in summaries[tag]["rows"]:
            rows[(row["region"], row["step"])] = {index[int(m)]: v for m, v in row["rise_mm"].items()}
            dwell[(row["region"], row["step"])] = row["dwellings"]
        missing = [k for k in keys if k not in rows]
        if missing:
            raise SystemExit(f"{tag}: missing scenarios {missing[:3]}")
        rises[tag] = rows
    mats, scen = [], []
    for tag, *_ in CASES:
        seen = [[j for j, v in rises[tag][k].items() if v >= RULE_MM] for k in keys]
        live = [s for s in range(len(keys)) if seen[s]]
        m = np.zeros((len(live), n), dtype=bool)
        for r, s in enumerate(live):
            m[r, seen[s]] = True
        mats.append(m)
        scen.append(live)
    detectable = [int(m.shape[0]) for m in mats]
    print("detectable per case:", detectable, "of", len(keys))

    # ---------------------------------------------------------------- plans
    g_order, g_worst, g_mean = ex.greedy(mats, K_MAX, "worst")
    opt = []
    for k in range(1, K_MAX + 1):
        chosen, proven, secs = optimum(mats, k)
        s = pp.shares(mats, chosen)
        opt.append({"k": k, "worst": round(min(s), 4), "mean": round(sum(s) / len(s), 4), "proven": proven,
                    "set": [chambers[c] for c in chosen]})
        print(f"k={k}: exact worst {min(s):.4f} mean {sum(s) / len(s):.4f} ({'proven' if proven else 'time limit'},"
              f" {secs}s); one at a time {g_worst[k - 1]:.4f}")
    p1 = [index[c] for c in opt[PHASE1_K - 1]["set"]]
    # The optimum can tie. When the published analysis's five score exactly the same, show those, so the
    # demo's pins are the Simulation 3 page's pins.
    published = [index[c] for c in analysis["rules"]["rise10"]["exact"][PHASE1_K - 1]["chosen"]]
    a, b = pp.shares(mats, published), pp.shares(mats, p1)
    if sorted(published) != sorted(p1) and abs(min(a) - min(b)) < 1e-9 and abs(sum(a) - sum(b)) < 1e-9:
        print(f"tie at k={PHASE1_K}: {[chambers[c] for c in p1]} and the published {[chambers[c] for c in published]}"
              " score the same; using the published set")
        p1 = sorted(published)
    p2_all, p2_proven, _ = optimum(mats, K_MAX, fixed=p1)
    p2 = [c for c in p2_all if c not in p1]
    plan_order = p1 + p2
    full = pp.shares(mats, plan_order)
    print(f"phase 1 {[chambers[c] for c in p1]}; with phase 2 worst {min(full):.4f} "
          f"(best ten unconstrained {opt[-1]['worst']})")

    # the published analysis (sim3_analysis.py) as the control: same rule, same cases, same optimum
    ref = {e["k"]: e for e in analysis["rules"]["rise10"]["exact"]}
    for k in (PHASE1_K, K_MAX):
        a, b = ref[k], opt[k - 1]
        same = abs(a["worst"] - b["worst"]) < 1e-3 and abs(a["average"] - b["mean"]) < 1e-3
        print(f"control k={k}: analysis {a['worst']:.4f}/{a['average']:.4f}, here {b['worst']:.4f}/{b['mean']:.4f}"
              f" -> {'match' if same else 'DIFFERENT'}; sets {'equal' if sorted(a['chosen']) == sorted(b['set']) else 'differ'}")
        if check and not same:
            raise SystemExit("plan does not match analysis.json")
    gref = analysis["rules"]["rise10"]["greedy"]["curve"]
    gsame = all(abs(gref[i]["worst"] - g_worst[i]) < 1e-3 for i in range(K_MAX))
    print("control one at a time:", "match" if gsame else "DIFFERENT")
    if check and not gsame:
        raise SystemExit("one-at-a-time curve does not match analysis.json")

    # the obvious picks, scored the same way
    design = CASES[1][0]
    depth_today = [summaries[design]["baseline_depth_m"].get(str(c), 0.0) for c in chambers]
    single = ex.single_sensor_heat(mats)["mean"]
    _, r_worst, r_mean = ex.random_best_of_20(mats, K_MAX, "worst", n)
    alt = {}
    for name, score in (("deepest_flow", depth_today), ("most_exposed", single)):
        rows = [pp.shares(mats, pp.top_by(score, k)) for k in range(1, K_MAX + 1)]
        alt[name] = {"worst": [round(min(s), 4) for s in rows], "set": [chambers[c] for c in pp.top_by(score, K_MAX)]}

    # leave one case out, with the same optimiser
    held = []
    for c in range(len(mats)):
        train = [m for i, m in enumerate(mats) if i != c]
        row = {"case": CASES[c][1]}
        for k in (PHASE1_K, K_MAX):
            chosen, _, _ = optimum(train, k)
            row[f"unseen_k{k}"] = round(pp.shares([mats[c]], chosen)[0], 4)
            row[f"seen_k{k}"] = round(pp.shares([mats[c]], plan_order[:k])[0], 4)
        held.append(row)
        print(f"held out {row['case']}: {row[f'unseen_k{PHASE1_K}']} vs {row[f'seen_k{PHASE1_K}']}")

    # ---------------------------------------------------------------- what each sensor watches
    def area_hits(ch):
        """Per area: how many of its detectable scenarios (all cases) this chamber sees."""
        hits = [0] * len(regions)
        for c, m in enumerate(mats):
            for r, s in enumerate(scen[c]):
                if m[r, ch]:
                    hits[rid[keys[s][0]]] += 1
        return hits
    roles = []
    for ch in p1:
        hits = area_hits(ch)
        order = sorted(range(len(regions)), key=lambda k: -hits[k])
        main = order[0]
        # a second area counts only when this sensor sees it nearly as often (the trunk sensor)
        also = [k for k in order[1:] if hits[k] >= 0.8 * hits[main]][:2]
        roles.append({"chamber": chambers[ch], "main": main, "also": also, "hits": hits})
        print(f"sensor {chambers[ch]}: {[(regions[k]['id'], hits[k]) for k in order if hits[k]]}")

    # ---------------------------------------------------------------- first build-out step seen
    def first_step(tag, area, chosen=None):
        for s in ladder:
            r = rises[tag][(area, s)]
            pool = r.items() if chosen is None else ((j, r.get(j, 0)) for j in chosen)
            if any(v >= RULE_MM for _, v in pool):
                return s
        return None
    first_any = [[first_step(tag, r["id"]) for tag, *_ in CASES] for r in regions]
    first_plan = [[first_step(tag, r["id"], p1) for tag, *_ in CASES] for r in regions]

    # the wet-weather signal: the largest rise anywhere at full build-out, dry against design wet
    def top_rise(tag, area, step=FOCUS_STEP):
        r = rises[tag][(area, step)]
        return round(max(r.values()), 1) if r else 0.0
    wet_signal = [{"dry": top_rise(CASES[0][0], r["id"]), "wet": top_rise(design, r["id"])} for r in regions]

    # ---------------------------------------------------------------- page data
    response = {}
    for c, (tag, *_rest) in enumerate(CASES):
        per_area = []
        for r in regions:
            steps = []
            for s in ladder:
                l = [[j, round(v, 1)] for j, v in rises[tag][(r["id"], s)].items() if v >= MIN_RISE_MM]
                steps.append(sorted(l, key=lambda t: -t[1]))
            per_area.append(steps)
        response[str(c)] = per_area

    base = {}
    for c, (tag, *_rest) in enumerate(CASES):
        b = summaries[tag]["baseline"]
        base[str(c)] = {"alarm": sorted(index[int(m)] for m in b["alarm"]),
                        "surcharged": sorted(index[int(m)] for m in b["surcharged"]),
                        "depth": [round(summaries[tag]["baseline_depth_m"].get(str(ch), 0.0), 3) for ch in chambers]}

    tr = analysis["time_rule"][design]
    time_rule = [{"best": index[tr[r["id"]]["best_candidate"]] if tr[r["id"]].get("best_candidate") else None,
                  "rise": round(tr[r["id"]]["rise_mm"], 1), "days": tr[r["id"]]["days"]} for r in regions]

    chokes = analysis["choke_points"]
    sensors = set(chambers[c] for c in plan_order)

    # ---------------------------------------------------------------- facts
    share = lambda v: int(round(100 * v))  # noqa: E731
    k1, km = opt[PHASE1_K - 1], opt[K_MAX - 1]
    held_by = {h["case"]: h for h in held}
    rl = analysis["run_length"]
    dry_tag = CASES[0][0]
    dry_alarm_new = sum(1 for row in summaries[dry_tag]["rows"] if row["alarm"])
    facts = {
        "runs": sum(len(s["rows"]) + 1 for s in summaries.values()),
        "growth_runs": sum(len(s["rows"]) for s in summaries.values()),
        "cases": len(CASES), "areas": len(regions), "steps": len(ladder), "sites": n,
        "scenarios_per_case": len(keys),
        "step_low_pct": int(round(100 * ladder[0])), "step_high_pct": int(round(100 * ladder[-1])),
        "anchor_dwellings": int(first["anchor_dwellings"]),
        "council_connections": int(first["council_connections"]),
        "rise_focus_mm": int(RULE_MM), "alarm_mm": ALARM_MM,
        "detectable_total": sum(detectable), "detectable_dry": detectable[0], "detectable_wet": detectable[1],
        "detectable_severe": detectable[2],
        "plan_k1": PHASE1_K, "plan_kmax": K_MAX,
        "plan_k1_worst": share(k1["worst"]), "plan_k1_mean": share(k1["mean"]),
        "plan_kmax_worst": share(min(full)), "plan_kmax_mean": share(sum(full) / len(full)),
        "opt_kmax_worst": share(km["worst"]),
        "kmax_gain": share(km["worst"]) - share(k1["worst"]),
        "greedy_k1_worst": share(g_worst[PHASE1_K - 1]), "greedy_kmax_worst": share(g_worst[-1]),
        "greedy_gap_k1": share(k1["worst"]) - share(g_worst[PHASE1_K - 1]),
        "random_k1_worst": share(r_worst[PHASE1_K - 1]),
        "trunk_k1_worst": share(alt["deepest_flow"]["worst"][PHASE1_K - 1]),
        "exposed_k1_worst": share(alt["most_exposed"]["worst"][PHASE1_K - 1]),
        "held_dry_unseen": share(held_by["Dry"][f"unseen_k{PHASE1_K}"]),
        "held_dry_seen": share(held_by["Dry"][f"seen_k{PHASE1_K}"]),
        **{f"held_{c}_{w}": share(held[c][f"{w}_k{PHASE1_K}"]) for c in range(len(CASES)) for w in ("seen", "unseen")},
        "held_drops": sum(1 for h in held if h[f"unseen_k{PHASE1_K}"] < h[f"seen_k{PHASE1_K}"] - 0.05),
        "settle_tol_mm": first["run_length"]["settle"]["tol_mm"],
        "settle_window_min": first["run_length"]["settle"]["window_min"],
        "run_min_minutes": int(rl["min_minutes"]), "run_max_minutes": int(rl["max_minutes"]),
        "runs_unconverged": rl["unconverged"],
        "dry_alarm_new": dry_alarm_new,
        "dry_top_low": min(w["dry"] for w in wet_signal), "dry_top_high": max(w["dry"] for w in wet_signal),
        "wet_top_high": max(w["wet"] for w in wet_signal),
        "chokes_listed": len(chokes),
        "chokes_in_alarm": sum(1 for c in chokes if c["already_in_alarm_cases"] > 0),
        "chokes_seeing_growth": sum(1 for c in chokes if c["n_regions_seen"] > 0),
        "chokes_sensors": sum(1 for c in chokes if c["manhole"] in sensors),
        "phase2_matches_best": int(share(min(full)) == share(km["worst"])),
        # sensors that see any growth on their own in design wet weather
        "wet_active": sum(1 for ch in p1 if mats[1][:, ch].any()),
        "wet_idle": sum(1 for ch in p1 if not mats[1][:, ch].any()),
        "ii_design": summaries[CASES[1][0]]["case"]["ii"], "ii_severe": summaries[CASES[2][0]]["case"]["ii"],
        "ii_beyond": summaries[CASES[3][0]]["case"]["ii"],
    }
    # the network itself is unchanged from the build that drew it (export_story.py)
    for k in ("pipes_total", "network_km", "manholes_published", "homes", "people_per_connection",
              "people_per_new_dwelling", "litres_per_person_day", "peak_factor", "dwelling_peak_l_per_day",
              "median_pipe_year", "oldest_pipe_year", "pre1960_pct", "small_pipe_pct", "clay_pct",
              "depth_median_m", "depth_p10_m", "depth_p90_m", "relief_m", "manning_clay", "manning_pvc"):
        facts[k] = geo["facts"][k]
    r1 = next(row for row in summaries[design]["rows"] if row["region"] == "R1" and row["step"] == FOCUS_STEP)
    facts["r1_full_homes"] = int(round(r1["dwellings"]))
    facts["r1_full_lps"] = round(r1["added_lps"], 1)
    blind = [k for k, row in enumerate(first_any) if all(v is None for v in row[:2])]
    facts["blind_names"] = " and ".join([", ".join(SHORT[regions[k]["id"]].lower() for k in blind[:-1]),
                                         SHORT[regions[blind[-1]]["id"]].lower()]) if len(blind) > 1 else \
        (SHORT[regions[blind[0]]["id"]].lower() if blind else "none")
    for c, (tag, label, short, _note) in enumerate(CASES):
        b = base[str(c)]
        facts[f"base_alarm_{c}"] = len(b["alarm"])
        facts[f"base_surcharged_{c}"] = len(b["surcharged"])
    facts["base_surcharged_severe"] = facts["base_surcharged_2"]
    facts["base_alarm_dry"] = facts["base_alarm_0"]
    facts["base_alarm_severe"] = facts["base_alarm_2"]
    words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"]
    facts["plan_k1_word"] = words[PHASE1_K]
    facts["plan_k1_Word"] = facts["plan_k1_word"].capitalize()
    for k in ("areas", "cases"):
        facts[k + "_word"] = words[facts[k]] if facts[k] < len(words) else str(facts[k])
        facts[k + "_Word"] = facts[k + "_word"].capitalize()
    for k, r in enumerate(regions):
        facts[f"wet_{r['id']}"] = wet_signal[k]["wet"]
        facts[f"dry_{r['id']}"] = wet_signal[k]["dry"]
    facts["blind_areas"] = sum(1 for row in first_any if all(v is None for v in row[:2]))

    story = {k: geo[k] for k in ("origin_epsg28354", "pipes", "nodes", "outlet", "chambers", "homes")}
    story.update({
        "sim": 3,
        "rule_mm": RULE_MM,
        "ladder": ladder,
        "focus_step": ladder.index(FOCUS_STEP),
        "cases": [{"id": c, "label": label, "short": short, "note": note,
                   "ii": summaries[tag]["case"]["ii"], "age": summaries[tag]["case"]["age"],
                   "bfac": summaries[tag]["case"]["bfac"]}
                  for c, (tag, label, short, note) in enumerate(CASES)],
        "regions": [{"id": r["id"], "name": r["name"], "short": SHORT[r["id"]],
                     "manholes": [index[m] for m in r["manholes"]], "homes": r["dwellings"],
                     "nominal": r["nominal_dwellings"], "km": round(r["length_m"] / 1000, 1),
                     "added": [round(dwell[(r["id"], s)]) for s in ladder]} for r in regions],
        "response": response,
        "base_depth": {k: v["depth"] for k, v in base.items()},
        "base_alarm": {k: v["alarm"] for k, v in base.items()},
        "base_surcharged": {k: v["surcharged"] for k, v in base.items()},
        "detectable": detectable,
        "plan": {"phase1": [chambers[c] for c in p1], "phase2": [chambers[c] for c in p2],
                 "phase2_proven": p2_proven,
                 "per_case_phase1": [round(v, 4) for v in pp.shares(mats, p1)],
                 "per_case_full": [round(v, 4) for v in full], "roles": roles},
        "alt_sets": {"trunk": alt["deepest_flow"]["set"][:PHASE1_K], "exposed": alt["most_exposed"]["set"][:PHASE1_K],
                     "greedy": [chambers[c] for c in g_order[:PHASE1_K]]},
        "curves": {"optimum": [o["worst"] for o in opt], "optimum_mean": [o["mean"] for o in opt],
                   "greedy": [round(v, 4) for v in g_worst], "greedy_mean": [round(v, 4) for v in g_mean],
                   "trunk": alt["deepest_flow"]["worst"], "exposed": alt["most_exposed"]["worst"],
                   "random": [round(v, 4) for v in r_worst]},
        "held_out": held,
        "first_seen": {"any": first_any, "plan": first_plan},
        "wet_signal": wet_signal,
        "time_rule": time_rule,
        "chokes": [{"ch": index[c["manhole"]], "headroom": c["headroom_mm_min"],
                    "alarm_cases": c["already_in_alarm_cases"], "areas_seen": c["n_regions_seen"]} for c in chokes],
        "facts": facts,
    })
    # claims the copy states in words, not tokens: stop the build if the data stops supporting them
    claims = {"no choke point sees an area's growth first": facts["chokes_seeing_growth"] == 0,
              "no choke point is a sensor site": facts["chokes_sensors"] == 0,
              "phase 2 reaches the best set of ten": facts["phase2_matches_best"] == 1,
              "the five sit below R1, R2, R5 and R8 (roles scene)":
                  sorted({regions[r["main"]]["id"] for r in roles}) == ["R1", "R2", "R5", "R8"],
              "R1 and R2 first show at 25% in design wet (firstseen scene)":
                  first_any[rid["R1"]][1] == 0.25 and first_any[rid["R2"]][1] == 0.25,
              "every sensor idle in design wet sees growth in beyond design (roles scene)":
                  all(mats[3][:, ch].any() for ch in p1 if not mats[1][:, ch].any())}
    for claim, ok in claims.items():
        print(f"copy claim: {claim}: {'holds' if ok else 'NO LONGER HOLDS, re-read scenes.js'}")
    if check and not all(claims.values()):
        raise SystemExit("a claim in the copy no longer holds")
    text = json.dumps(story, separators=(",", ":"))
    open(os.path.join(ex.OUT, "story3.json"), "w", encoding="utf-8").write(text)
    out = os.path.normpath(os.path.join(DEMO, "story-data.js"))
    open(out, "w", encoding="utf-8").write(
        "// Generated by cloud-run/presentation/build/export_sim3.py from the Simulation 3 results. Do not edit by hand.\n"
        "window.OSP_STORY = " + text + ";\n")
    print(json.dumps(facts, indent=1))
    print(f"wrote {out} ({len(text) // 1024} KB)")


if __name__ == "__main__":
    main("--check" in sys.argv)
