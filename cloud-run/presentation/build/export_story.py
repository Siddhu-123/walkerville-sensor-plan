#!/usr/bin/env python3
"""Builds data/story.json (and .js), the data behind the story page (index.html).

Reads the vendored sources only (see data/source/SOURCE.md), plus the property-connection layer in
the repository's data/ folder, and the outputs of the two other build steps:

    python build/export_scenario.py --check      # scenario.json: the 8,200-run tables
    python build/prove_placement.py              # proof.json: optimum, baselines, held-out cases
    python build/export_story.py                 # story.json: 3D network, homes, responses, facts

Coordinates are metres on the SA Water layer's projected grid (EPSG:28354), shifted so the origin
is the south-west modelled manhole, the same origin geometry.json uses. Heights are metres AHD.
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import export_scenario as ex  # noqa: E402

REPO = os.path.dirname(ex.ROOT)
HOUSES = os.environ.get("OSP_DECK_HOUSES",
                        os.path.join(REPO, "data", "walkerville_inspection_prop.geojson"))
FOCUS_SIZE = 150          # dwellings in the response examples the page animates
MIN_RISE_MM = 2.0         # responses below this are left out of the page data (invisible on the map)
MATCH_TOL_M = 2.0


def read_script_object(path, name):
    text = open(path, encoding="utf-8").read()
    start = text.index(name + " = ") + len(name + " = ")
    return json.loads(text[start:text.rindex("}") + 1])


def pct(part, whole):
    return int(round(100.0 * part / whole)) if whole else 0


def main():
    scenario = json.load(open(os.path.join(ex.OUT, "scenario.json"), encoding="utf-8"))
    proof = json.load(open(os.path.join(ex.OUT, "proof.json"), encoding="utf-8"))
    cfg = ex.load_config()
    summaries = ex.load_summaries()
    cases = scenario["cases"]
    chambers = scenario["chambers"]
    index = {c: i for i, c in enumerate(chambers)}

    # origin: as export_scenario.load_geometry
    mh = json.load(open(os.path.join(ex.SRC, "geometry", "manholes.json"), encoding="utf-8"))
    pos = {int(f["attributes"]["ID"]): (f["geometry"]["x"], f["geometry"]["y"]) for f in mh["features"]}
    ox = min(pos[c][0] for c in chambers)
    oy = min(pos[c][1] for c in chambers)

    net = read_script_object(os.path.join(ex.SRC, "osp_data.js"), "OSP_DATA")["regions"]["walkerville"]
    nodes = net["nodes"]
    nn = len(nodes["x"])

    # each modelled chamber -> the depth layer's node at the same point
    node_of, worst_match = [], 0.0
    for c in chambers:
        x, y = pos[c]
        best = min(range(nn), key=lambda i: (nodes["x"][i] - x) ** 2 + (nodes["y"][i] - y) ** 2)
        d = math.hypot(nodes["x"][best] - x, nodes["y"][best] - y)
        if d > MATCH_TOL_M:
            sys.exit(f"chamber {c} has no depth node within {MATCH_TOL_M} m (nearest {d:.1f} m)")
        worst_match = max(worst_match, d)
        node_of.append(best)

    # pipes, each drawn from its upstream end to its downstream end
    pipes = []
    for i, (a, b) in enumerate(net["edges"]):
        line = net["polylines"][i]
        if math.hypot(line[0][0] - nodes["x"][a], line[0][1] - nodes["y"][a]) > \
           math.hypot(line[-1][0] - nodes["x"][a], line[-1][1] - nodes["y"][a]):
            line = line[::-1]
        flat = []
        for x, y in line:
            flat += [round(x - ox, 1), round(y - oy, 1)]
        pipes.append({"p": flat, "a": a, "b": b, "za": nodes["inv"][a], "zb": nodes["inv"][b],
                      "d": int(round(net["pipes"]["dia"][i] * 1000)), "y": net["pipes"]["year"][i],
                      "m": net["pipes"]["mat"][i]})

    # the outlet: the node of the largest group that no pipe leaves
    leaves = {a for a, _ in net["edges"]}
    ends = [b for _, b in net["edges"] if b not in leaves]
    outlet = min(ends, key=lambda i: nodes["inv"][i])

    # homes (property connection points), lon/lat -> EPSG:28354
    homes = []
    if os.path.exists(HOUSES):
        from pyproj import Transformer
        to_grid = Transformer.from_crs(4326, 28354, always_xy=True)
        for f in json.load(open(HOUSES, encoding="utf-8"))["features"]:
            lon, lat = f["geometry"]["coordinates"][:2]
            x, y = to_grid.transform(lon, lat)
            homes += [round(x - ox), round(y - oy)]

    # which chambers rise, and by how much, when FOCUS_SIZE dwellings connect at each site
    response = {}
    for case in cases:
        rows = {}
        for row in summaries[case["tag"]]["rows"]:
            if row["dwellings"] != FOCUS_SIZE:
                continue
            seen = [[index[int(m)], round(r, 1)] for m, r in row["rise_mm"].items() if r >= MIN_RISE_MM]
            rows[index[row["site"]]] = sorted(seen, key=lambda t: -t[1])
        response[str(case["id"])] = [rows.get(i, []) for i in range(len(chambers))]

    base_depth = {str(case["id"]): [round(summaries[case["tag"]]["baseline_depth_m"].get(str(c), 0.0), 3)
                                    for c in chambers] for case in cases}

    # ---------------------------------------------------------------- facts
    years = sorted(y for y in net["pipes"]["year"] if y and y > 1800)
    dias = net["pipes"]["dia"]
    mats = net["stats"]["pipe_attrs"]["material_counts"]
    covers = [v for v in nodes["cover"] if v and v > 0]
    loads = cfg["loads"]
    k1 = len(proof["plan"]["phase1"])
    kmax = proof["k_max"]
    opt = {o["k"]: o for o in proof["optimum"]}
    base = proof["baselines"]
    held = {h["case"]: h for h in proof["held_out"]}
    alone = {k["chamber"]: k["alone"] for k in proof["keep"]}
    case_ids = {c["label"]: i for i, c in enumerate(cases)}
    dry, wet, severe = case_ids["Dry"], case_ids["Design wet"], case_ids["Severe"]
    pools = proof["scenarios_per_case"]

    def share(v):
        return int(round(100 * v))

    def roles():
        """Each phase-1 sensor's job: which of dry, design wet and storm it sees most of on its own."""
        trio = [("Dry", dry), ("Design wet", wet), ("Severe", severe)]
        out = []
        for c in proof["plan"]["phase1"]:
            a = alone[c]
            label, i = max(trio, key=lambda t: a[t[1]])
            out.append({"chamber": c, "case": label, "share": share(a[i]),
                        "alone": {lab: share(a[j]) for lab, j in trio}})
        return out

    dry_small = [r for r in summaries[cases[dry]["tag"]]["rows"] if r["dwellings"] <= FOCUS_SIZE]
    dry_blind = sum(1 for r in dry_small if not r["alarm"])
    facts = {
        "pipes_total": len(net["edges"]),
        "network_km": round(sum(net["lengths"]) / 1000, 1),
        "manholes_published": net["stats"]["manholes_published"],
        "homes": len(homes) // 2,
        "people_per_connection": loads["people_per_connection"],
        "people_per_new_dwelling": loads["people_per_new_dwelling"],
        "litres_per_person_day": int(loads["litres_per_person_day"]),
        "peak_factor": loads["peak_factor"],
        "dwelling_peak_l_per_day": int(round(loads["people_per_new_dwelling"] * loads["litres_per_person_day"]
                                             * loads["peak_factor"])),
        "median_pipe_year": years[len(years) // 2],
        "oldest_pipe_year": years[0],
        "pre1960_pct": pct(sum(1 for y in years if y < 1960), len(years)),
        "small_pipe_pct": pct(sum(1 for d in dias if d <= 0.1501), len(dias)),
        "clay_pct": pct(mats.get("VC", 0), sum(mats.values())),
        "depth_median_m": round(net["stats"]["depth_median"], 1),
        "depth_p10_m": round(net["stats"]["depth_p10"], 1),
        "depth_p90_m": round(net["stats"]["depth_p90"], 1),
        "relief_m": int(round(max(covers) - min(covers))),
        "chamber_match_m": round(worst_match, 1),
        "detectable_total": sum(pools),
        "detectable_dry": pools[dry], "detectable_severe": pools[severe],
        "dry_alarm_blind_runs": dry_blind, "dry_small_runs": len(dry_small),
        "combos_k1": f"{math.comb(len(chambers), k1) / 1e9:.0f} billion",
        "plan_k1": k1, "plan_kmax": kmax,
        "plan_k1_worst": share(proof["plan"]["worst"][0]), "plan_k1_mean": share(proof["plan"]["mean"][0]),
        "plan_kmax_worst": share(proof["plan"]["worst"][-1]), "plan_kmax_mean": share(proof["plan"]["mean"][-1]),
        "opt_k1_worst": share(opt[k1]["worst"]), "opt_kmax_worst": share(opt[kmax]["worst"]),
        "opt_k1_proven": "proven" if opt[k1]["proven"] else "best found",
        "greedy_k1_worst": share(proof["greedy"]["worst"][k1 - 1]),
        "greedy_kmax_worst": share(proof["greedy"]["worst"][-1]),
        "greedy_k2_worst": share(proof["greedy"]["worst"][1]), "opt_k2_worst": share(opt[2]["worst"]),
        "trunk_k1_worst": share(base["deepest_flow"]["worst"][k1 - 1]),
        "exposed_k1_worst": share(base["most_exposed"]["worst"][k1 - 1]),
        "random_k1_worst": share(base["random_best_of_20"]["worst"][k1 - 1]),
        "trunk_kmax_worst": share(base["deepest_flow"]["worst"][-1]),
        "random_kmax_worst": share(base["random_best_of_20"]["worst"][-1]),
        "held_dry_unseen": share(held["Dry"][f"unseen_k{k1}"]), "held_dry_seen": share(held["Dry"][f"seen_k{k1}"]),
        "held_severe_unseen": share(held["Severe"][f"unseen_k{k1}"]),
        "held_severe_seen": share(held["Severe"][f"seen_k{k1}"]),
        "base_surcharged_severe": scenario["baseline"][str(severe)]["surcharged"],
        "base_alarm_dry": scenario["baseline"][str(dry)]["alarm"],
        "base_alarm_severe": scenario["baseline"][str(severe)]["alarm"],
        "per_case_k1": ", ".join(f"{cases[i]['label'].lower()} {share(v)}%"
                                 for i, v in enumerate(proof["plan"]["per_case_phase1"])),
    }
    facts["growth_focus_lps"] = round(FOCUS_SIZE * loads["people_per_new_dwelling"] * loads["litres_per_person_day"]
                                      * loads["peak_factor"] / 86400, 1)
    facts["kmax_gain"] = facts["plan_kmax_worst"] - facts["plan_k1_worst"]
    facts["greedy_gap_max"] = max(share(o["worst"]) - share(g) for o, g in zip(proof["optimum"], proof["greedy"]["worst"]))
    manning = cfg["pipes"]["manning_n_by_material"]
    facts["manning_clay"] = f'{manning["VC"]:.3f}'
    facts["manning_pvc"] = f'{manning["PVCU"]:.3f}'
    words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"]
    facts["plan_k1_word"] = words[k1] if k1 < len(words) else str(k1)
    facts["plan_k1_Word"] = facts["plan_k1_word"].capitalize()
    ii = {c["label"]: c.get("ii") for c in scenario["cases"]}
    facts["ii_design"] = ii.get("Design wet")
    facts["ii_severe"] = ii.get("Severe")
    for f in ("runs", "cases", "sites", "sizes", "alarm_mm", "rise_focus_mm", "size_focus"):
        facts[f] = scenario["facts"][f]

    story = {
        "origin_epsg28354": [ox, oy],
        "pipes": pipes,
        "nodes": {"x": [round(v - ox, 1) for v in nodes["x"]], "y": [round(v - oy, 1) for v in nodes["y"]],
                  "inv": nodes["inv"], "cover": nodes["cover"], "mh": nodes["mh"]},
        "outlet": outlet,
        "chambers": [{"id": c, "n": node_of[i], "x": round(pos[c][0] - ox, 1), "y": round(pos[c][1] - oy, 1),
                      "inv": nodes["inv"][node_of[i]], "cover": nodes["cover"][node_of[i]]}
                     for i, c in enumerate(chambers)],
        "homes": homes,
        "focus_size": FOCUS_SIZE,
        "response": response,
        "base_depth": base_depth,
        "base_alarm": {k: v["alarm_chambers"] for k, v in scenario["baseline"].items()},
        "base_surcharged": {k: v["surcharged_chambers"] for k, v in scenario["baseline"].items()},
        "cases": [{"id": c["id"], "label": c["label"], "note": c.get("note", "")} for c in cases],
        "plan": {"phase1": proof["plan"]["phase1"], "phase2": proof["plan"]["phase2"],
                 "per_case_phase1": proof["plan"]["per_case_phase1"],
                 "per_case_full": proof["plan"]["per_case_full"], "roles": roles()},
        "alt_sets": {"trunk": base["deepest_flow"]["set"][:k1], "exposed": base["most_exposed"]["set"][:k1]},
        "curves": {"optimum": [o["worst"] for o in proof["optimum"]],
                   "optimum_mean": [o["mean"] for o in proof["optimum"]],
                   "greedy": proof["greedy"]["worst"],
                   "trunk": base["deepest_flow"]["worst"], "exposed": base["most_exposed"]["worst"],
                   "random": base["random_best_of_20"]["worst"]},
        "held_out": proof["held_out"],
        "facts": facts,
    }
    text = json.dumps(story, separators=(",", ":"))
    out = os.path.join(ex.OUT, "story")
    open(out + ".json", "w", encoding="utf-8").write(text)
    open(out + ".js", "w", encoding="utf-8").write(
        "// Generated by build/export_story.py. Do not edit by hand.\nwindow.OSP_STORY = " + text + ";\n")
    print(json.dumps(facts, indent=1))
    print(f"chamber match worst {worst_match:.2f} m; outlet node {outlet}; homes {len(homes) // 2}; "
          f"wrote {os.path.relpath(out, ex.ROOT)}.json and .js ({len(text) // 1024} KB)")


if __name__ == "__main__":
    main()
