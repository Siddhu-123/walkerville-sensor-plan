# Walkerville Sensor Plan

Client demo of the sensor placement plan for the Walkerville sewer network, built on an EPA SWMM simulation (Adelaide University capstone PG-S2-22, *Optimal Sensor Placement for Wastewater Network Monitoring*, for SA Water).

**Live demo:** https://siddhu-123.github.io/walkerville-sensor-plan/demo.html

The demo is a guided story on one map of Walkerville. It follows the six steps of **Simulation 4**: the network and growth question, how the network behaves on a design wet day today, adding the 2041 homes across equal-home regions, deciding which regions to monitor, placing 1 or 5 continuous level sensors (and comparing against float switches), and weighing the cost, limitations and data needed for a new suburb. Each scene is a camera move over the same map, from a 2D top view down to a 3D view of every manhole and pipe.

## The result in brief (Simulation 4)

- **The network and baseline wet weather (Steps 1–2):** Walkerville's **328** modelled manholes and **890** pipes drain **2,851** existing connected properties, with **485** new homes projected by 2041. Before any new homes are added, the model has **7** manholes surcharged (water above the pipe top, the warning sign before an overflow) and **0** spilling on a design wet day (0.11 L/s per 100 m), rising to **107** surcharged on a much wetter day (0.25 L/s per 100 m, Beyond design) and **141** in severe wet (0.40 L/s per 100 m).
- **Nine regions and 2041 growth (Step 3):** Simulation 4 cuts Walkerville into **8** regions holding near-equal numbers of existing homes (**233 to 418** homes each) using three rounds of spatial bisection (Kim et al., 2022), plus **R9**, the **485-home** Walkerville Terrace corridor overlapping them (**9** regions in total). Adding each region's 2041 homes on its own raises water by **10 mm** or more (assumed rule) in **R1, R3, R4, R7 and R9**, while **R2, R5, R6 and R8** stay below 10 mm on a design wet day. At 100% build-out on a design wet day, no manhole newly surcharges and none spills; across all **7** wet cases (**315** runs up to 100%), **50** runs show a new surcharge and **1** shows a new spill across **14** manholes (**11** region-weather overloads in total).
- **Region triage (Step 4):** At an assumed pipe limit of **0.7 of bore (70%)** on a design wet day, **Monitor R3** (reaches 0.7 in **2 to 59** homes against **54** projected) and **R7** (**6 to 71** homes against **55**), **Watch R1** (**12 to 78** vs **54**), **R4** (**15 to 79** vs **54**) and **R9** (**90 to 1,271** vs **485**), and **Leave R2** (**53 to beyond the top step** vs **49**), **R5** (**40**), **R6** (**60**) and **R8** (**71**, not reached). Not monitoring is a valid answer if a design wet day is the right test (**R5** alone keeps room in all 7 wet cases).
- **Sensor placement — 1 sensor vs 5 sensors (Step 5):**
  - If the design wet day is right, **1 level sensor** at **MH4450531** (**$25k** at assumed prices) listens to **R1, R3, R4, R7 and R9**, reacts at **14 new homes in R3 (+12.4 mm)**, and sees all **16 of 16 (100%)** growth runs on a design wet day (**8 of 11** overloads warned), but averages **53%** across the **7** wet cases (**0%** worst case, **55%** on unseen weather).
  - If the weather is unknown, **5 level sensors** (**MH4450531, MH4448345, MH4450922, MH4452994 and MH4428268**, **$125k** at assumed prices) see **94%** of target-region growth runs on average and **81%** in the worst wet case, warn of all **11 of 11** overloads, and hold **77%** on unseen weather (**10 of 11** warned) and **76%** on an unseen region (**10 of 11** warned, against **55%** for random responsive manholes and **33%** for any random manholes across **5,000** draws).
- **Level sensors vs float switches:** At assumed prices (**$25k** per level sensor, **$1k** per float switch, with a **25 mm** assumed float margin), floats reach only **35%** on average and **0%** in the worst wet case at *any* budget from **$25k to $200k** (**0%** on unseen weather, **4 of 11** warnings): **15 floats ($15k)** already hit that ceiling, and in age-weighted Design wet no float sees any run.
- **Cost, savings and limitations (Step 6):** Normal-day level records could confirm the design wet day and save up to **4 sensors (about $100k)** at assumed prices. Every figure is an uncalibrated model result; rules and prices are assumed, the region cut is a choice (though **4 of the 5** sensors match the earlier hand-picked cut), and sensors are modelled without long-term failure. Greenfield is not part of the Simulation 4 story.

Every Simulation 4 figure on screen is resolved from `demo/sim4-facts.js` (sourced from `demo/notes/sim4_source/sim4.js` and `demo/notes/sim4_source/regions.js`), while map scenes use the Walkerville network geometry in `demo/story-data.js`.

## Run it

Open the live link above, or run it locally from this folder with any static server and open `demo.html`:

```
python3 -m http.server 8766
```

Then go to http://localhost:8766/demo.html. Opening `demo.html` straight from disk also works, without the basemap's street tiles.

## Controls

| Action | How |
|---|---|
| Next / previous scene | Arrow keys, Page Up/Down, Space, mouse wheel, swipe, or the arrows at the bottom of the sidebar |
| First / last scene | Home / End |
| Jump to a section | Click a segment of the progress bar |
| Open a scene directly | Add `#scene-id` to the address, for example `demo.html#sensor5` |
| Full screen | `F` |
| Light / dark theme | `T`, or the Light/Dark button (remembered in this browser) |
| Manhole details | Hover a manhole on the map |
| Where a figure comes from | Hover a tag or citation, or click an `i` button, to see the backing page in the team's research library |

The "Open Simulation 4" link at the top right opens the Simulation 4 workbench in the [gravity-sewer-osp sandbox](https://abrahampaulj.github.io/gravity-sewer-osp/simulation4/index.html).

## What the demo covers

A welcome page, then 13 scenes across Simulation 4's six steps and recommendation:

| Section | Scenes (`#id`) | What it says |
|---|---|---|
| **Step 1 · Network** | `infill`, `overflow` | 890 pipes and 328 manholes draining 2,851 homes with 485 new homes coming by 2041; why water rising above the pipe top (surcharge) is the warning sign before an overflow. |
| **Step 2 · Today** | `today` | Before any new homes, 7 manholes are surcharged on a design wet day (0 spill) and 107 on a much wetter day. |
| **Step 3 · Growth** | `regions`, `growth` | 8 equal-home regions (233 to 418 homes, Kim et al. 2022 spatial bisection) plus R9 Walkerville Terrace corridor (485-home anchor); R1, R3, R4, R7 and R9 rise 10 mm or more on Design wet while R2, R5, R6 and R8 do not. |
| **Step 4 · Triage** | `triage` | At an assumed 0.7 bore limit on Design wet: Monitor R3 and R7, Watch R1, R4 and R9, and Leave R2, R5, R6 and R8. |
| **Step 5 · Sensors** | `sensor1`, `sensor5`, `holdout`, `floats` | 1 sensor (MH4450531, $25k) sees 16 of 16 Design wet runs but 53% across 7 wet cases; 5 sensors ($125k) see 94% average, 81% worst, 11 of 11 warnings, and 77% on unseen weather; floats stall at 35% average and 0% worst at any budget. |
| **Step 6 · Cost & Limits** | `cost`, `limits` | $25k vs $125k at assumed prices (normal-day records could save up to 4 sensors, ~$100k); limitations (no calibration, assumed rules and prices, region cut is a choice, sensors never fail) and what a new suburb must supply. |
| **Recommendation** | `close` | Monitor R3 and R7 first; start with MH4450531 ($25k assumed) and normal-day logging or deploy the 5-sensor ladder ($125k assumed) for unknown weather. |

## What's in this repository

| Path | What it is |
|---|---|
| `demo.html` | The page shell: map, sidebar, progress bar and controls |
| `demo/sim4-facts.js` | Simulation 4 constants, sensor ladder, role descriptions and chart series resolved as `{{fact}}` tokens |
| `demo/scenes.js` | All scene copy and camera cues for the 13-scene Simulation 4 deck |
| `demo/engine.js` | The map engine: draws the network on a canvas with a perspective camera, resolves `{{tokens}}` from `sim4-facts.js` / `story-data.js` / `OSP_STATIC`, and renders charts and animations |
| `demo/story-data.js` | Generated network geometry and baseline depth arrays. Do not edit by hand |
| `demo/pump-data.js` | Generated pump stations and rising mains. Do not edit by hand |
| `demo/sources.js` | Where each tag and citation comes from: the library page, the quoted line, and the `i` text for charts and tables |
| `demo/basemap.js`, `demo/basemap-data.js` | The vintage MapLibre basemap under the network, with bundled Adelaide water, parks, land use and roads |
| `demo/demo.css`, `demo/welcome.css` | Styles, including the dark theme |
| `demo/notes/sim4_source/` | Source-of-truth Simulation 4 exports (`sim4.js` and `regions.js`) |
| `vendor/` | MapLibre GL JS |

## Project team

Adelaide University capstone PG-S2-22, with SA Water (Vineeth Maruvada and Adel) and academic supervisor Karamjit Kaur.

Abraham Paul Jaison · Ashis Jose Kalathil · Rijoy John · Satya Siddhartha Balanagu · Wimukthi Rajapaksha
