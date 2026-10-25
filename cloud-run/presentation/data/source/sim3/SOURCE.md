# Vendored source: Simulation 3, infill grid (Walkerville sample)

The results behind the demo (`demo.html`), read by `build/export_sim3.py`. Simulation 3 is the
sandbox's final model: the same 328-manhole EPA SWMM network as Simulation 2.5, with every run
continued until no manhole's level moves more than 0.25 mm in 120 simulated minutes (ceiling
1,800 minutes), and growth spread through one of eight areas at a time.

Copied from the `gravity-sewer-osp` sandbox's Simulation 3 results (the grid behind the published
Simulation 3 page, https://abrahampaulj.github.io/gravity-sewer-osp/simulation3/, page commit
`60db306`, 23 Oct 2026). These copies are pinned; re-copy them deliberately, and regenerate
`SHA256SUMS` when you do.

| Path here | What it is |
|---|---|
| `<case>/summary.json` (8 cases) | The infill grid for one weather case: the eight areas, the seven build-out steps (10% to 300% of each area's share of the 2021 to 2041 projection), the baseline depths, alarms and run lengths, and every run's rise at each manhole (rises under 0.5 mm are not stored) |
| `analysis.json` | The sandbox's own analysis of the same grid (`sim3_analysis.py`): placements per rule, leave-one-case-out, first detection, the time rule, choke points, pump flows. `export_sim3.py` re-solves the placement itself and checks it against this file; the time rule and choke points are read from it |

Case folders: `ii<leakage>_flat_<uniform|weighted>_b<outside inflow factor>_sfree`, leakage in
L/s per 100 m of pipe: 0.00 (dry), 0.11 (design wet), 0.25 (beyond design), 0.40 (storm), and the
age-weighted and x1.5 outside-inflow variants at 0.11 and 0.25.

Not copied: the new-estate (greenfield) grids, the corridor runs and the risk weighting. The
demo names the greenfield run count only (`OSP_STATIC.greenfield_runs` in `demo/scenes.js`).

The sandbox's own licence (MIT) covers its code. The network data belongs to its publishers and is
subject to their terms; check those terms before the demo leaves the project team.

Checksums: `SHA256SUMS` (run `sha256sum -c SHA256SUMS` from this folder to verify).
