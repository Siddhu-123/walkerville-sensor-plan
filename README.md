# Walkerville Sensor Plan

Client demo of the sensor placement plan for the Walkerville sewer network, built on Simulation 3, our final EPA SWMM model (Adelaide University capstone PG-S2-22, *Optimal Sensor Placement for Wastewater Network Monitoring*, for SA Water).

**Live demo (Simulation 3, this branch):** https://abrahampaulj.github.io/walkerville-sensor-plan/demo.html

**Previous demo (Simulation 2.5, `main`):** https://siddhu-123.github.io/walkerville-sensor-plan/demo.html

The demo is a guided story on one map of Walkerville. It explains why infill growth needs watching, where we would put sensors to watch it, how we found those places, and what still waits on SA Water's data. Each scene is a camera move over the same map, from a 2D top view down to a 3D view of every manhole and pipe.

## The result in brief

- **Five level sensors now, five more later.** The first five see 83% of detectable growth in the weather case where they do worst, and 88% on average across the eight weather cases. Adding the next five lifts this to 94% and 98%, as high as the best possible set of ten.
- **The five are the best set of five,** found and proven by an exact solver (integer programming, HiGHS) among every possible set of five of the 328 manholes. Choosing one at a time, as the earlier prototype did, reaches 67% with five.
- **Tested on 456 simulated runs:** infill growth spread through eight areas of Walkerville, at seven sizes from 10% to 300% of each area's share of the state's 2041 projection, under eight weather and leakage cases. Each run continues until no manhole's level is still moving.
- **What the runs show:** infill growth shows in wet weather far more than on dry days; some areas show at a quarter of their growth and three never show in a single reading; comparing the same hour over many days brings small rises out; and the tightest manholes are not the growth watchers.
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
| Try your own growth | On the "Grow any area" scene, click a manhole to grow its area, and pick the weather and how much of the 2041 growth arrives |
| Where a figure comes from | Hover a tag or citation, or click an ⓘ button, to see the backing page in the team's research library |

The "Open the simulation tool" link at the top right opens Simulation 3 in the [gravity-sewer-osp sandbox](https://abrahampaulj.github.io/gravity-sewer-osp/simulation3/index.html), where every area, weather case, rule and the new-estate runs can be explored.

## What the demo covers

A welcome page, then 38 scenes in ten sections:

| Section | Scenes (`#id`) | What it says |
|---|---|---|
| **Why watch growth** | `title`, `growth`, `infill`, `downhill`, `overflow`, `stages`, `why` | A sewer grows two ways, greenfield and infill. Infill adds homes to century-old pipes, and every new home loads every pipe below it. The spill appears above the pipe at fault. Growth shows in stages that a level sensor can see years before a spill, while overflow records mostly show blockages. |
| **The question** | `today`, `question`, `brief` | How sites are chosen today, the three things SA Water needs to know (where, how many, how well), and the brief and scope. |
| **Our approach** | `approach`, `capacity` | The approach we adopted (simulate growth in EPA SWMM, then choose the sensors that see the most of it), and why we started with a Manning's-equation capacity check and moved to simulation: a sensor measures water level, and only a hydraulic model computes how high water backs up at each manhole. |
| **The answer** | `answer`, `roles` | The five recommended manholes, and the part of the suburb each one watches. |
| **How we found it** | `path`, `data`, `swmm`, `areas`, `whatif`, `cases`, `stress` | The four models and why Simulation 3 replaced 2.5, where the dataset comes from, why EPA SWMM, the eight growth areas and how growth is sized, the 456 runs, the eight weather cases, and where pipes are already under strain. |
| **What the runs show** | `wetsignal`, `firstseen`, `timerule`, `chokes` | Infill growth shows in wet weather; how early each area shows, and which never do; how comparing many days brings small rises out; and why the tightest manholes are a different job from growth watching. |
| **Why it holds** | `howmany`, `beats`, `holdout`, `tryit` | Why five, how the plan beats one-at-a-time and the obvious choices, how it holds on weather it never saw, and an interactive "grow any area" test. |
| **Below the street** | `below`, `fall`, `pipes`, `load`, `rain`, `sees` | In 3D: manhole depths, slope, pipe size and material, the load of new homes, groundwater and rain, and how a sensor detects growth (a rise of 10 mm or more above its normal level). |
| **What's next** | `register`, `close` | What is assumed and what data removes each assumption, and the phased plan. |
| **References** | `references` | Every work cited in the scenes, in Harvard (author-date) style. Citations in the text use the same author-date form. |

## What's in this repository

| Path | What it is |
|---|---|
| `demo.html` | The page shell: map, sidebar, progress bar and controls |
| `demo/scenes.js` | All scene copy. Numbers are `{{fact}}` tokens, filled from `story-data.js`, from figures the engine measures on load, or from the sourced constants in `OSP_STATIC` |
| `demo/engine.js` | The map engine: draws the network on a canvas with a perspective camera (2D and 3D are the same drawing at different pitch), runs each scene's animation, charts and the interactive test |
| `demo/story-data.js` | Generated network, Simulation 3 results and facts (`export_sim3.py`). Do not edit by hand (see below) |
| `demo/pump-data.js` | Generated pump stations and rising mains, drawn on the "Gravity does the work" scene. Do not edit by hand (see below) |
| `demo/sources.js` | Where each tag and citation comes from: the library page, the quoted line, and the ⓘ text for charts and tables |
| `demo/basemap.js`, `demo/basemap-data.js` | The vintage MapLibre basemap under the network, with bundled Adelaide water, parks, land use and roads |
| `demo/demo.css`, `demo/welcome.css` | Styles, including the dark theme |
| `demo/notes/capstone_facts.md` | Verbatim quotes, with sources, from the project request, scoping documents, sensor review and meeting log, used to keep the copy faithful to them |
| `vendor/` | MapLibre GL JS |
| `cloud-run/presentation/` | The build pipeline (see its [README](cloud-run/presentation/README.md)) |

## Where the data comes from

- **Network:** SA Water's sewer records as republished by the Town of Walkerville on ArcGIS Online ("SA Water Sewer June 2021"): gravity mains, manholes, property connection points and 1 m contours. Manhole lid levels are reconstructed from the contours where not surveyed. Flow entering from pipes outside the council is sized from SA Water's statewide gravity-main layer on the SA Government geodata server. The `#data` scene lists each source.
- **Simulation results:** Simulation 3 from the [gravity-sewer-osp](https://github.com/AbrahamPaulJ/gravity-sewer-osp) sandbox (the infill grid: eight areas, seven sizes, eight weather cases), pinned with checksums in `cloud-run/presentation/data/source/sim3/` (see `SOURCE.md` there). The Simulation 2.5 grid beside it still feeds the network drawing and the detailed deck.
- **Regenerating `story-data.js`:** from `cloud-run/`, `python presentation/build/export_sim3.py --check` (needs `numpy`, `pulp`, `highspy`; about a minute). It solves the exact plan for 1 to 10 sensors, the alternatives and the held-out cases, checks the plan against the sandbox's own `analysis.json`, stops if a claim the copy makes in words no longer holds, and writes `demo/story-data.js`. Then `python presentation/build/check_copy.py --demo` confirms every token resolves, and `python presentation/build/demo_smoke.py [shots]` walks every scene in Chromium. The network drawing comes from `data/story.json` (`export_story.py`) and the pump stations from `export_pumps.py`, unchanged.
- **Basemap:** © OpenStreetMap contributors, © CARTO. A hosted copy loads CARTO's vector tiles. On `localhost` the page looks for local tiles in `data/tiles/`, which is not in this repository, so a fresh clone run locally shows the bundled water, parks and roads but no detailed street tiles.

## Limits to keep in mind

- Walkerville is a public **sample network**, not the confirmed pilot area.
- The hydraulic model is **uncalibrated**: steady busiest-hour flows, declared leakage rates, and detection thresholds still to be confirmed with SA Water's level records. The day-to-day spread behind the "comparing days" scene is assumed.
- The plan is built on **infill** spread through eight areas drawn by drainage, not zoning, sized from the state projection and added all at once on today's network. New estates at one manhole were run too and are in the simulation tool, not in this walk-through.
- The overflow (relief) pipes still take their published inlet levels, so one relief pipe returns everyday flow to a pump well; the "honest limits" scene lists it.
- There is **no field validation** yet; recommended sites are to be checked against overflow and blockage history once it is shared.

The "What is assumed, and what removes it" scene (`#register`) lists each assumption and the data that would replace it.

## Project team

Adelaide University capstone PG-S2-22, with SA Water (Vineeth Maruvada and Adel) and academic supervisor Karamjit Kaur.

Abraham Paul Jaison · Ashis Jose Kalathil · Rijoy John · Satya Siddhartha Balanagu · Wimukthi Rajapaksha
