# Walkerville Sensor Plan

Client demo of the sensor placement plan for the Walkerville sewer network, built on an EPA SWMM simulation (Adelaide University capstone PG-S2-22, *Optimal Sensor Placement for Wastewater Network Monitoring*, for SA Water).

**Live demo:** https://siddhu-123.github.io/walkerville-sensor-plan/demo.html

The demo is a guided story on one map of Walkerville. It explains why infill growth needs watching, where we would put sensors to watch it, how we found those places, and what still waits on SA Water's data. Each scene is a camera move over the same map, from a 2D top view down to a 3D view of every manhole and pipe.

## The result in brief

- **Where pipe buffer runs out first (the why before the what):** Under Simulation 3.5's capacity check (0.7 of pipe bore across 400 starting-level error draws on a Design wet day), north-east regions **R1** (reaches 0.7 in 13 to 77 homes against a 110-home 2041 share) and **R2** (3 to 54 homes against a 55-home share) run out of room before 2041 and need monitoring first. **R4** (4 to 40 homes) and the **R8** Walkerville Terrace corridor (127 to 1,276 homes) can go either way, while **R3, R5, R6 and R7** keep room in hand.
- **Early warning before surcharge:** Simulation 3.5 scores whether a sensor rises 10 mm or more at least one build-out step *before* the first new manhole surcharge (13 plausible overloads by 100% of the 2041 housing projection across 7 wet weather cases, 25 including 150% and 300% stress steps). **Three level sensors** ($75,000) warn of all **13 of 13** in-sample overloads; **five level sensors** ($125,000) warn of **11 of 13** on unseen weather (88% of all 25) and **8 of 13** on an unseen region (72% of all 25), while detecting **86%** of wet-weather growth in the worst case (**91%** on average, **76%** on unseen weather, **66%** on an unseen region).
- **Level sensors vs float switches:** At assumed prices of $25,000 per level sensor and $1,000 per float switch, a **25-float budget** ($25,000) buys **22 floats** ($22,000) that average 47% in-sample but fall to **10%** growth detection and **0%** early warning on unseen weather because normal water depth shifts with rainfall, whereas **1 level sensor** ($25,000) holds **38%** detection (**51%** warning) and **5 level sensors** ($125,000) hold **76%** detection (**88%** warning).
- **Tested across regional growth and whole-suburb runs (+ 56 whole-suburb runs):** 8 drainage regions × 7 build-out steps (10% to 300% of the 485-dwelling 2041 projection) × 8 weather and infiltration cases (1 dry + 7 wet) on a 328-manhole, 890-link EPA SWMM 5.2 dynamic-wave model.
- **Draft for discussion:** The model is built from public data and is uncalibrated. Changing the rise rule from 10 mm to 25 mm reduces five-sensor unseen-weather warnings from 11 of 13 to 6 of 13; normal-day level logs and pipe ratings will settle those thresholds when real network data arrives.

Every figure on screen is filled from the generated data in `demo/story-data.js`, so the numbers above follow that file if it is regenerated.

## Run it

Open the live link above, or run it locally from this folder with any static server and open `demo.html`:

```
python -m http.server 8766        # python3 on macOS and Linux
```

Then go to http://localhost:8766/demo.html. Opening `demo.html` straight from disk also works, without the basemap's street tiles.

## Controls

| Action | How |
|---|---|
| Next / previous scene | Arrow keys, Page Up/Down, Space, mouse wheel, swipe, or the arrows at the bottom of the sidebar |
| First / last scene | Home / End |
| Jump to a section | Click a segment of the progress bar |
| Open a scene directly | Add `#scene-id` to the address, for example `demo.html#answer` |
| Full screen | `F` |
| Light / dark theme | `T`, or the Light/Dark button (remembered in this browser) |
| Manhole details | Hover a manhole on the map |
| Where a figure comes from | Hover a tag or citation, or click an ⓘ button, to see the backing page in the team's research library |

The "Open Simulation 3.5" link at the top right opens the Simulation 3.5 workbench in the [gravity-sewer-osp sandbox](https://abrahampaulj.github.io/gravity-sewer-osp/simulation35/index.html).

## What the demo covers

A welcome page, then 14 scenes in seven sections:

| Section | Scenes (`#id`) | What it says |
|---|---|---|
| **Problem** | `infill`, `overflow`, `room` | Growth adds 485 infill homes to century-old clay pipes; sewage backs up upstream before any overflow is logged; checking 0.7 pipe buffer across the 8 regions shows R1 and R2 run out of room first while four regions retain buffer. |
| **Question** | `question` | Where buffer runs out, how many sensors to deploy, whether to use continuous level sensors or float switches, and at which of the 328 manholes. |
| **Method** | `swmm`, `sees` | The regional EPA SWMM 5.2 runs across 8 regions, 7 build-out steps and 8 weather cases (+ 56 whole-suburb runs), and why Simulation 3.5 scores a 10 mm rise at least one step before surcharge. |
| **Results** | `answer`, `roles`, `floats`, `howmany`, `holdout` | Why 3 level sensors cover in-sample warnings and 5 cover unseen weather (11 of 13 plausible overloads, 86% worst-case wet growth seen); which region each sensor covers; why level sensors beat float switches on unseen weather (76% vs 10%); the 1-to-10 sensor frontier; and unseen weather and region holdouts. |
| **Greenfield** | `greenfield` | Greenfield estates build new internal pipes and connect only to trunk mains of 225 mm or more (24% of the network). |
| **Limits** | `register` | How the 10 mm vs 25 mm rise rule, 0.7 bore limit, float clearance and steady-flow assumptions affect the answer, and what waits on normal-day level records. |
| **Close** | `close` | Business case summary: start monitoring in R1 and R2 with 3 to 5 level sensors, and re-run the open pipeline once field records arrive. |

## What's in this repository

| Path | What it is |
|---|---|
| `demo.html` | The page shell: map, sidebar, progress bar and controls |
| `demo/scenes.js` | All scene copy. Numbers are `{{fact}}` tokens, filled from `story-data.js`, from figures the engine measures on load, or from the sourced constants in `OSP_STATIC` |
| `demo/engine.js` | The map engine: draws the network on a canvas with a perspective camera (2D and 3D are the same drawing at different pitch), runs each scene's animation, charts and the interactive test |
| `demo/story-data.js` | Generated network, simulation results and facts. Do not edit by hand (see below) |
| `demo/pump-data.js` | Generated pump stations and rising mains, drawn on the "Gravity does the work" scene. Do not edit by hand (see below) |
| `demo/sources.js` | Where each tag and citation comes from: the library page, the quoted line, and the ⓘ text for charts and tables |
| `demo/basemap.js`, `demo/basemap-data.js` | The vintage MapLibre basemap under the network, with bundled Adelaide water, parks, land use and roads |
| `demo/demo.css`, `demo/welcome.css` | Styles, including the dark theme |
| `demo/notes/capstone_facts.md` | Verbatim quotes, with sources, from the project request, scoping documents, sensor review and meeting log, used to keep the copy faithful to them |
| `vendor/` | MapLibre GL JS |
| `cloud-run/presentation/` | The build pipeline (see its [README](cloud-run/presentation/README.md)) |

## Where the data comes from

- **Network:** SA Water's sewer records as republished by the Town of Walkerville on ArcGIS Online ("SA Water Sewer June 2021"): gravity mains, manholes, property connection points and 1 m contours. Manhole lid levels are reconstructed from the contours where not surveyed. Flow entering from pipes outside the council is sized from SA Water's statewide gravity-main layer on the SA Government geodata server. The `#data` scene lists each source.
- **Simulation results:** EPA SWMM simulation from the [gravity-sewer-osp](https://github.com/AbrahamPaulJ/gravity-sewer-osp) sandbox, pinned with checksums in `cloud-run/presentation/data/source/` (see `SOURCE.md` there).
- **Regenerating `story-data.js`:** run the steps in [`cloud-run/presentation/README.md`](cloud-run/presentation/README.md). `export_scenario.py --check` reconciles the figures, `prove_placement.py` compares the plan with the alternatives and held-out cases (greedy by default; OSP_PLAN=optimum runs the exact integer program), `export_story.py` writes the story data, `export_pumps.py` writes the pump stations (`demo/pump-data.js`) on the same origin, and `check_copy.py --story` confirms every token resolves.
- **Basemap:** © OpenStreetMap contributors, © CARTO. A hosted copy loads CARTO's vector tiles. On `localhost` the page looks for local tiles in `data/tiles/`, which is not in this repository, so a fresh clone run locally shows the bundled water, parks and roads but no detailed street tiles.

## Limits to keep in mind

- Walkerville is a public **sample network**, not the confirmed pilot area.
- The hydraulic model is **uncalibrated**: steady busiest-hour flows, declared leakage rates, and detection thresholds still to be confirmed with SA Water's level records.
- Growth is modelled as **infill** in an established suburb. For the pilot area, each growth scenario will be split into infill and greenfield parts.
- There is **no field validation** yet; recommended sites are to be checked against overflow and blockage history once it is shared.

The "What is assumed, and what removes it" scene (`#register`) lists each assumption and the data that would replace it.

## Project team

Adelaide University capstone PG-S2-22, with SA Water (Vineeth Maruvada and Adel) and academic supervisor Karamjit Kaur.

Abraham Paul Jaison · Ashis Jose Kalathil · Rijoy John · Satya Siddhartha Balanagu · Wimukthi Rajapaksha
