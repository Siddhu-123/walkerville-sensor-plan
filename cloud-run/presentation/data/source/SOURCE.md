# Vendored source: Simulation 2.5 (Walkerville sample)

Copied from the public `gravity-sewer-osp` repository (https://github.com/AbrahamPaulJ/gravity-sewer-osp)
at commit `e6232db` (16 Oct 2026). These copies are pinned; re-copy them deliberately, and regenerate
`SHA256SUMS` when you do.

| Path here | Source in the sandbox repository |
|---|---|
| `grid_whole/<case>/summary.json` (5 cases) | `simulation_src/results/sim25/grid_whole/<case>/summary.json` |
| `robustness.json` | `simulation_src/results/sim25/grid_whole/robustness.json` |
| `geometry/manholes.json`, `geometry/mains.json` | `simulation_src/data/raw/` (ArcGIS snapshot, projected grid EPSG:28354) |
| `geometry/rising_structures.json`, `geometry/rising_mains.json` | `simulation_src/data/raw/` (same snapshot: pump station structures, layer 5, and rising mains, layer 8; read by `build/export_pumps.py`) |
| `config.js` | `config.js` (the settings the grid was run with) |
| `osp_data.js` | `data/osp_data.js` (every node's invert and cover level, pipe polylines and attributes; the story page's 3D view) |
| `findings_index.js` | `simulation25/data/index.js` (the page's findings text; used only by the reconciliation check) |

Not copied: the segment grid, the corridor runs, the daily-cycle runs, the SWMM inputs and the
pre-whole-area experiments. The deck does not use them.

The sandbox's own licence (MIT) covers its code. The network data belongs to its publishers and is
subject to their terms; check those terms before the deck leaves the project team.

Checksums: `SHA256SUMS` (run `sha256sum -c SHA256SUMS` from this folder to verify).
