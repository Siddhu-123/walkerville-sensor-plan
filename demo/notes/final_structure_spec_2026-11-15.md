# Final presentation structure (15 Nov 2026)

This deck is the team's final presentation to the client. It shows what was built, what was found, the recommendation, and what the next team should work on. There are no team-contribution slides.

Keep the design language, scene schema, copy rules and terminology from `design_fix_spec_2026-11-14.md`, and every honesty item from `fix_spec_2026-11-14.md`. Every number must be an existing `{{token}}` in `demo/sim4-facts.js` or a fact listed below with its source.

## Structure (welcome + 10 scenes; counter "01 / 10")

| # | id | act | kicker | title (10 words or fewer) | map |
|---|---|---|---|---|---|
| 1 | brief | The brief | What we were asked | How many sensors, which type, and where | `view: "all"`, pipes and chambers |
| 2 | problem | The brief | Why it matters | (keep current) | keep current |
| 3 | built | What we built | Deliverables | Four things built for this project | `view: "all"` |
| 4 | method | What we built | The method | (rewrite of the current `changed` scene, no "since October") | keep `changed` map |
| 5 | regions | What we found | Priority regions | (keep) | keep |
| 6 | sensors | What we found | How many | (keep) | keep |
| 7 | type | What we found | Sensor types | (keep) | keep |
| 8 | holdup | What we found | Unseen weather | (keep) | keep |
| 9 | close | Our recommendation | The first step | (keep the current close scene) | keep |
| 10 | assumed | For the next team | What to work on next | What the next team should work on | keep `assumed` map |

The order matters: the recommendation comes before "For the next team", and `assumed` is the last scene.

## New and rewritten content

**brief:** The source is `request.pdf`, the project brief. Link it with the `briefwatch` / `brieftype` / `briefwithin` sources.
- Lede: the brief asks for the optimal sensor locations and number of sensors for a sewer network, with recommendations based on the results.
- Bullets:
  - The focus is growth: new homes adding load to trunk sewers, seen early enough to act before an overflow.
  - Two device types are compared: continuous level sensors and float switches (threshold alarms).
  - The study is desk-based: no installation or field validation. Use `briefwithin`.
- Takeaway: "Tested on Walkerville's sewer network."

**built:** A `.params` table (original `.k` / `.s` markup), one row per artefact. This slide replaces the stats/params limit for this scene only, so allow `.params` on `built` and `assumed`.
- **Sensor review:** a literature review of level, flow and float sensors and of placement methods. Finding: no single best sensor, and level is not flow.
- **Parameter catalogue:** the network and placement parameters the method needs, with the evidence for each.
- **Data availability matrix:** 19 public sewer datasets checked for use in the tool.
- **Walkerville model and simulation tool:**
  - An EPA SWMM 5.2 model of {{sites}} manholes and {{swmm_links}} pipes.
  - Simulation 4 online, with growth and wet-weather cases. Link `https://abrahampaulj.github.io/gravity-sewer-osp/simulation4/index.html`.
- Takeaway: "Each finding that follows comes from this model."

**method:** Same facts as the current `changed` scene: regions adapted from Kim et al. (2022), growth multipliers 0.1 to 3, and the staged 1-to-{{plan_kmax}} plan.
- Title: "Group homes into regions, then add sensors one at a time".
- Remove every reference to October or earlier versions.

**assumed** → "What the next team should work on":
- Lede: every figure comes from an uncalibrated model. Mention the 10 mm rule (assumed) once.
- `.params` rows:
  - **Wet-weather level records:** they settle 1 sensor versus 5. Keep the 6 / 10 sensors facts here.
  - **Calibrate the model** against measured levels. Name the assumed rules: 10 mm, 25 mm, the 0.7 limit and the prices.
  - **Source the {{homes_2041}}-home projection.**
  - **Sensor failure and precision:** sensors are assumed never to fail, and one run shifts a score by {{run_noise_min}} to {{run_noise_max}} percentage points.
  - **Another suburb:** needs its pipe map, home projections, pump rates and weather cases.
- Takeaway: "**Wet-weather records are the first thing to collect.**"

## Engine / gate
- `check_deck.sh` expects welcome + 10 scenes, 5 acts, and allows `.params` on `built` and `assumed`.
- No engine change is expected. `brief` and `built` use plain map views. If a scene needs a missing `fx`, use none.
