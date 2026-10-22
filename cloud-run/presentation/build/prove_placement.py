#!/usr/bin/env python3
"""Compare the recommended sensor plan with baselines and held-out weather cases.

The default greedy mode chooses chambers in greedy order for the 25 mm rise rule,
maximising the worst share across the five weather cases. It does not compute an
exact optimum or need PuLP. Held-out plans use greedy on the other four cases.

Optional OSP_PLAN=optimum mode uses an exact integer program (HiGHS via PuLP) to
compare every sensor count, choose phase 1 and its best additions, and choose
held-out plans. This mode needs pulp and highspy.

Both modes score the plan, deepest-flow and most-exposed chambers, and the best
of 20 random sets on the same 8,200 simulations. They also report each recommended
sensor's individual share per case and write data/proof.json (and .js).

    python presentation/build/prove_placement.py  # greedy, the default
    pip install pulp highspy                     # optional exact mode only
    OSP_PLAN=optimum python presentation/build/prove_placement.py
"""
import json
import os
import sys
import time

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import export_scenario as ex  # noqa: E402

RULE_ID = "r25"
OBJECTIVE = "worst"
TIME_LIMIT_S = 120
PHASE1_K = 5
PLAN_METHOD = os.environ.get('OSP_PLAN', 'greedy')


def setup():
    cfg = ex.load_config()
    sim = cfg["simulation"]
    sizes = [int(d) for d in sim["growth_dwellings"]] + [int(sim["stress_dwellings"])]
    k_max = int(sim.get("max_sensors", ex.MAX_SENSORS_FALLBACK))
    summaries = ex.load_summaries()
    cases = ex.case_list(cfg, summaries)
    chambers = ex.chamber_list(summaries[cases[0]["tag"]])
    index = {c: i for i, c in enumerate(chambers)}
    rule = {"id": RULE_ID, "mm": float(RULE_ID[1:])}
    mats = ex.matrices(ex.pools_for(summaries, cases, sizes, rule, index), len(chambers))
    return cfg, summaries, cases, chambers, index, mats, k_max


def shares(mats, chosen):
    if not chosen:
        return [0.0] * len(mats)
    return [float(np.any(m[:, chosen], axis=1).sum()) / m.shape[0] for m in mats]


TIE_BREAK = 1e-4  # mean share is at most 1, so this never outweighs one scenario (>= 1/1042) in the worst case


def optimum(mats, k, fixed=()):
    """Max over k-sets of the worst case's share; among equal worst cases, the best mean.
    Identical scenario rows are merged with a weight. `fixed` chambers are forced into the set."""
    import pulp
    n = mats[0].shape[1]
    prob = pulp.LpProblem("maxmin_coverage", pulp.LpMaximize)
    x = [prob.add_variable(f"x{j}", cat="Binary") for j in range(n)]
    t = prob.add_variable("t", 0, 1)
    case_shares = []
    prob += pulp.lpSum(x) == k
    for j in fixed:
        prob += x[j] == 1
    for c, m in enumerate(mats):
        rows, weights = np.unique(m, axis=0, return_counts=True)
        terms = []
        for r, (row, w) in enumerate(zip(rows, weights)):
            y = prob.add_variable(f"y{c}_{r}", 0, 1)
            prob += y <= pulp.lpSum(x[j] for j in np.flatnonzero(row))
            terms.append(int(w) * y)
        prob += t * m.shape[0] <= pulp.lpSum(terms)
        case_shares.append(pulp.lpSum(terms) * (1.0 / (m.shape[0] * len(mats))))
    prob += t + TIE_BREAK * pulp.lpSum(case_shares)
    solver = pulp.HiGHS(msg=False, timeLimit=TIME_LIMIT_S)
    start = time.time()
    status = prob.solve(solver)
    chosen = [j for j in range(n) if x[j].value() and x[j].value() > 0.5]
    proven = status.status == pulp.LpSolveStatus.Optimal
    bound = status.best_bound if status.best_bound is not None else None
    return chosen, proven, bound, round(time.time() - start, 1)


def top_by(score, k):
    """The k chambers with the highest score (ties to the lower index, as the builder does)."""
    return [int(i) for i in np.argsort(-np.asarray(score), kind="stable")[:k]]


def main():
    if PLAN_METHOD not in ("greedy", "optimum"):
        raise ValueError(f"unknown OSP_PLAN: {PLAN_METHOD}")
    cfg, summaries, cases, chambers, index, mats, k_max = setup()
    n = len(chambers)
    order, g_worst, g_mean = ex.greedy(mats, k_max, OBJECTIVE)

    # 1. optional exact optimum and the recommended plan
    opt = []
    phase1_k = PHASE1_K
    if PLAN_METHOD == "optimum":
        for k in range(1, k_max + 1):
            chosen, proven, bound, secs = optimum(mats, k)
            s = shares(mats, chosen)
            opt.append({"k": k, "worst": round(min(s), 4), "mean": round(sum(s) / len(s), 4),
                        "proven": proven, "bound": None if bound is None else round(min(bound, 1.0), 4), "seconds": secs, "set": [chambers[c] for c in chosen]})
            print(f"k={k}: optimum worst {min(s):.4f} ({'proven' if proven else 'time limit'}, {secs}s)"
                  f"  greedy {g_worst[k - 1]:.4f}")

        # the proven-best phase 1, then the best additions to it
        p1 = next(o for o in opt if o["k"] == phase1_k)
        p1_idx = [index[c] for c in p1["set"]]
        p2_idx, p2_proven, _, _ = optimum(mats, k_max, fixed=p1_idx)
        added = [c for c in p2_idx if c not in p1_idx]
    else:
        p1_idx = order[:phase1_k]
        added = order[phase1_k:k_max]
        p2_proven = None
    plan_order = p1_idx + added
    plan_rows = [shares(mats, plan_order[:k]) for k in range(phase1_k, k_max + 1)]
    plan = {"phase1": [chambers[c] for c in p1_idx], "phase2": [chambers[c] for c in added],
            "phase2_proven": p2_proven,
            "worst": [round(min(r), 4) for r in plan_rows], "mean": [round(sum(r) / len(r), 4) for r in plan_rows],
            "per_case_phase1": [round(v, 4) for v in shares(mats, p1_idx)],
            "per_case_full": [round(v, 4) for v in shares(mats, plan_order)]}
    print(f"plan: phase 1 {plan['phase1']} worst {plan['worst'][0]}, full {plan['worst'][-1]} "
          + (f"(unconstrained best {opt[-1]['worst']})" if opt else "(greedy)"))

    # 2. the obvious picks
    design = next(c for c in cases if c["label"] == "Design wet")
    depth_today = [summaries[design["tag"]]["baseline_depth_m"].get(str(c), 0.0) for c in chambers]
    single = ex.single_sensor_heat(mats)["mean"]
    _, r_worst, r_mean = ex.random_best_of_20(mats, k_max, OBJECTIVE, n)
    baselines = {}
    for name, score in (("deepest_flow", depth_today), ("most_exposed", single)):
        rows = [shares(mats, top_by(score, k)) for k in range(1, k_max + 1)]
        baselines[name] = {"worst": [round(min(s), 4) for s in rows],
                           "mean": [round(sum(s) / len(s), 4) for s in rows],
                           "set": [chambers[c] for c in top_by(score, k_max)]}
    baselines["random_best_of_20"] = {"worst": [round(v, 4) for v in r_worst],
                                      "mean": [round(v, 4) for v in r_mean]}

    # 3. leave one case out: choose without the case the plan is scored on
    held = []
    for c in range(len(mats)):
        train = [m for i, m in enumerate(mats) if i != c]
        row = {"case": cases[c]["label"]}
        if PLAN_METHOD == "greedy":
            train_order, _, _ = ex.greedy(train, k_max, OBJECTIVE)
        for k in (PHASE1_K, k_max):
            if PLAN_METHOD == "optimum":
                chosen, _, _, _ = optimum(train, k)
            else:
                chosen = train_order[:k]
            row[f"unseen_k{k}"] = round(shares([mats[c]], chosen)[0], 4)
            row[f"seen_k{k}"] = round(shares([mats[c]], plan_order[:k])[0], 4)
        held.append(row)
        print(f"held out {row['case']}: k={PHASE1_K} {row[f'unseen_k{PHASE1_K}']} vs "
              f"{row[f'seen_k{PHASE1_K}']} seen, k={k_max} {row[f'unseen_k{k_max}']} vs {row[f'seen_k{k_max}']}")

    # 4. what each recommended sensor sees on its own, per case
    keep = [{"chamber": chambers[c], "alone": [round(float(m[:, c].mean()), 4) for m in mats]}
            for c in plan_order]
    for name in ("deepest_flow", "most_exposed", "random_best_of_20"):
        b = baselines[name]
        print(f"{name}: k=5 worst {b['worst'][4]} mean {b['mean'][4]}, k=10 worst {b['worst'][-1]}")

    result = {
        "rule": RULE_ID, "objective": OBJECTIVE, "k_max": k_max, "method": PLAN_METHOD,
        "scenarios_per_case": [int(m.shape[0]) for m in mats],
        "greedy": {"worst": [round(v, 4) for v in g_worst], "mean": [round(v, 4) for v in g_mean],
                   "set": [chambers[c] for c in order]},
        "optimum": opt, "plan": plan, "baselines": baselines, "held_out": held, "keep": keep,
    }
    out = os.path.join(ex.OUT, "proof")
    text = json.dumps(result, separators=(",", ":"))
    open(out + ".json", "w", encoding="utf-8").write(text)
    open(out + ".js", "w", encoding="utf-8").write(
        "// Generated by build/prove_placement.py. Do not edit by hand.\nwindow.OSP_PROOF = " + text + ";\n")
    print(f"wrote {os.path.relpath(out, ex.ROOT)}.json and .js")


if __name__ == "__main__":
    main()
