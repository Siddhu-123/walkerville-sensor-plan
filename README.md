# Walkerville Sensor Plan

Client demo of the Simulation 2.5 sensor placement plan for the Walkerville sewer network (Adelaide University capstone PG-S2-22, *Optimal Sensor Placement for Wastewater Network Monitoring*, for SA Water).

**Live demo:** https://siddhu-123.github.io/walkerville-sensor-plan/demo.html

The demo is a guided story on one map of Walkerville. It explains why infill growth needs watching, where we would put sensors to watch it, how we found those places, and what still waits on SA Water's data. Each scene is a camera move over the same map, from a 2D top view down to a 3D view of every manhole and pipe.

## The result in brief

- **Five level sensors now, five more later.** The first five see 61% of detectable growth in the weather case where they do worst, and 72% on average across the five weather cases. Adding the next five lifts this to 75% and 81%.
- **The five are the proven best five** on the simulations: the set was solved exactly, not picked one at a time.
- **Tested on 8,200 simulated futures:** new homes added at every manhole of a 328-manhole EPA SWMM model, at several growth sizes, under five weather and leakage cases.
- **Draft for discussion.** The model is built from public data and is uncalibrated. The same steps re-run on the pilot network when SA Water's data is released.

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
| Try your own growth | On the "Connect 150 homes anywhere" scene, click a manhole |
| Where a figure comes from | Hover a tag or citation, or click an ⓘ button, to see the backing page in the team's research library |

The "Open the simulation tool" link at the top right opens the Simulation 2.5 workbench in the [gravity-sewer-osp sandbox](https://abrahampaulj.github.io/gravity-sewer-osp/simulation25/index.html).

## What the demo covers

A welcome page, then 32 scenes in nine sections:

| Section | Scenes (`#id`) | What it says |
|---|---|---|
| **Why watch growth** | `title`, `growth`, `infill`, `downhill`, `overflow`, `stages`, `why` | A sewer grows two ways, greenfield and infill. Infill adds homes to century-old pipes, and every new home loads every pipe below it. The spill appears above the pipe at fault. Growth shows in stages that a level sensor can see years before a spill, while overflow records mostly show blockages. |
| **The question** | `today`, `question`, `brief` | How sites are chosen today, the three things SA Water needs to know (where, how many, how well), and the brief and scope. |
| **Our approach** | `approach`, `capacity` | The approach we adopted (simulate growth in EPA SWMM, then choose the sensors that see the most of it), and why we started with a Manning's-equation capacity check and moved to simulation: a sensor measures water level, and only a hydraulic model computes how high water backs up at each manhole. |
| **The answer** | `answer`, `roles` | The five recommended manholes, and the kind of day each one watches. |
| **How we found it** | `path`, `swmm`, `whatif`, `cases`, `stress` | The three models we built and the one we kept, why EPA SWMM, the 8,200 growth runs, the five weather cases, and where pipes are already under strain. |
| **Why it holds** | `howmany`, `beats`, `holdout`, `tryit` | Why five, how the plan beats the obvious choices, how it holds on weather it never saw, and an interactive "connect 150 homes" test. |
| **Below the street** | `below`, `fall`, `pipes`, `load`, `rain`, `sees` | In 3D: manhole depths, slope, pipe size and material, the load of one new home, groundwater and rain, and how a sensor detects growth (a rise of 25 mm or more above its normal level). |
| **What's next** | `register`, `close` | What is assumed and what data removes each assumption, and the phased plan. |
| **References** | `references` | Every work cited in the scenes, in Harvard (author-date) style. Citations in the text use the same author-date form. |

## What's in this repository

| Path | What it is |
|---|---|
| `demo.html` | The page shell: map, sidebar, progress bar and controls |
| `demo/scenes.js` | All scene copy. Numbers are `{{fact}}` tokens, filled from `story-data.js`, from figures the engine measures on load, or from the sourced constants in `OSP_STATIC` |
| `demo/engine.js` | The map engine: draws the network on a canvas with a perspective camera (2D and 3D are the same drawing at different pitch), runs each scene's animation, charts and the interactive test |
| `demo/story-data.js` | Generated network, simulation results and facts. Do not edit by hand (see below) |
| `demo/sources.js` | Where each tag and citation comes from: the library page, the quoted line, and the ⓘ text for charts and tables |
| `demo/basemap.js`, `demo/basemap-data.js` | The vintage MapLibre basemap under the network, with bundled Adelaide water, parks, land use and roads |
| `demo/demo.css`, `demo/welcome.css` | Styles, including the dark theme |
| `demo/notes/capstone_facts.md` | Verbatim quotes, with sources, from the project request, scoping documents, sensor review and meeting log, used to keep the copy faithful to them |
| `vendor/` | MapLibre GL JS |
| `cloud-run/presentation/` | The build pipeline and the detailed slide deck the demo grew from (see its [README](cloud-run/presentation/README.md)) |

## Where the data comes from

- **Network:** SA Water's public Walkerville sewer layers (ArcGIS snapshot), with manhole lid levels reconstructed from 1 m contours where not surveyed.
- **Simulation results:** Simulation 2.5 from the [gravity-sewer-osp](https://github.com/AbrahamPaulJ/gravity-sewer-osp) sandbox, pinned with checksums in `cloud-run/presentation/data/source/` (see `SOURCE.md` there).
- **Regenerating `story-data.js`:** run the steps in [`cloud-run/presentation/README.md`](cloud-run/presentation/README.md). `export_scenario.py --check` reconciles the figures, `prove_placement.py` proves the optimum, `export_story.py` writes the story data, and `check_copy.py --story` confirms every token resolves.
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
