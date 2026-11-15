# Design fix spec: return the Sim 4 deck to the original design language (14 Nov 2026)

The October deck on `main` is the design reference. Read it with `git show main:demo/scenes.js`, `git show main:demo/engine.js`, `git show main:demo/demo.css` and `git show main:demo/welcome.css`. Keep every Sim 4 number and `{{token}}` that the copy still needs. Do not change `demo/sim4-facts.js`, `demo/sim4-regions.js` or `demo/notes/sim4_source/`.

## Scene format (shared contract)

Use the original scene schema only:
- `act`, `kicker`, `title`, `html`, `chart`, `after`, `info: { chart: "<key>" }`, `legend`, `fx`, `view`, `show`.
- `html` holds one lede `<p>` and at most 3 short `<li>` bullets.
- `after` holds one `<p class="note">` takeaway.
- `<strong>` wraps only the single takeaway clause. No mid-sentence `<b>` on numbers.
- A `.params` table uses the original `<span class="k">` / `<span class="s">` children. Use it on at most one slide.
- Stats (`<div class="stats">`) appear on at most 3 slides: problem, regions and close. Each stat has one number and a short sentence-case caption. No stats on chart slides.
- Chips are evidence-status chips only (measured / sourced / declared / checked / to confirm), as on `main`. No topic chips ("Sim 4", "triage", "plan", "future work", "holdout", "limits", "method", "wet cases").

## Acts and kickers (8 scenes + welcome; counter reads "01 / 08")

| id | act | kicker | title |
|---|---|---|---|
| problem | The question | Wet weather | Wet weather already fills pipes, before any new homes |
| changed | Our approach | Since October | What changed since the October demo |
| regions | The answer | Priority regions | Where to monitor first on a design wet day |
| sensors | The answer | How many | One sensor for a design wet day, five for wetter weather |
| type | Why it holds | Sensor types | Float switches alone miss growth in some weather |
| holdup | Why it holds | Unseen weather | How the plan holds on weather it never saw |
| assumed | What's next | What to check | Wet-weather records are the next step |
| close | What's next | The first step | Start with Sensor 1 in R3, then grow to five |

## Copy rules
- Write in the original deck's voice: plain, short, confident engineering-student English.
- No meta commentary. Don't narrate model versions ("Simulation 4 calls this…", "the October deck's five, the 6 November Sim 3.5 five…").
- On slides, call it "the model". "Simulation 4" appears only in source entries and ⓘ cards.
- Write "assumed" once per slide at most, on the first assumed value. The ⓘ card carries the rest.
- Never write "SA Water said". No cost ratio. No em dashes. Write "Adelaide University".
- Terminology:
  - "Design wet", "Beyond design" and "Severe" are button labels only. In prose write "a design wet day", "beyond-design wet weather" and "severe wet weather".
  - Write "Sensor 1" on slides. In ⓘ cards, give the full form once: "Sensor 1 (manhole 4450531)".
  - Write "level sensors" and "float switches". Use "staged plan", not "ladder" or "nested list". Use "separately chosen mix", not "free mix".
  - Give the worst case first, then the average, and label both every time ("81% in the worst case, 94% on average"). Never write a bare "81% / 94%".
  - Write ranges with "to". Use "percentage points", not "pts". Write "Do et al. (2023)" and "Kim et al. (2022)".
  - Write the limit as "70% of pipe depth (assumed)" on first use, then "the 0.7 limit". Never mix it up with surcharge (water above the pipe top).
- Keep all the honesty content from `fix_spec_2026-11-14.md` (S1-A to S2-J). Each item can sit in a bullet, the takeaway note or the ⓘ card; the ⓘ card is preferred for detail.
- Data fixes:
  - Sensor 1 has 4 stand-ins with the same score; the nearest 3 are MH4450391, MH4450137 and MH4449796.
  - "11 of 11 overloads warned" is already reached by 2 sensors. Don't present it as a reason for 5.
  - The 6 and 10 sensor figures come from Sim 4's "Fewest sensors by weather covered" table, not from the 1-to-8 staged plan chart.

## Welcome
- Restore the original markup and classes from `main` (`welcome-top`, `welcome-kicker`, `welcome-heading`, `welcome-greeting`, `welcome-start`, "Start" button with "or press →", `welcome-footer`, `meta-block`, `team-grid`).
- Greeting: 2 sentences on wet weather and where to place level sensors in Walkerville.
- The team grid lists Abraham Paul Jaison, Ashis Jose Kalathil, Rijoy John, Satya Siddhartha Balanagu and Wimukthi Rajapaksha. Label: "Project Team · Capstone PG-S2-22".

## Engine and CSS (engine.js, demo.css, welcome.css, demo.html)
- Render act + separator + kicker in `.kicker` as on `main`. Restore `#actname` and the padded counter. Group the progress segments by act.
- Restore the original sheet width `clamp(400px, 38vw, 580px)`, the 12 px stat margin and the staggered card entrance animations.
- Remove the leftover `.p`, `.w-*` and `[aria-pressed]` styling. Weather pills use the original `.on` state; keep `aria-pressed` as an attribute only.
- The ⓘ button attaches to the chart (`info.chart`), as on `main`. Drop the 26 px gap band in the middle of the card.
- Charts follow the original language:
  - Responsive width capped at 380 px, no horizontal scroll, original draw/bar/pop animations.
  - Black for the plan, muted grey for alternatives and rust only for a drop. Use direct labels instead of top legends, and add "%" to every value.
  - `ladder`: worst-case line in black, average line muted, 25 mm average as a dashed muted line, direct end labels, and one marker at 5 sensors.
  - `type`: horizontal bars like the original `beats` chart. Show the $75k comparison only (staged level plan, float switches only, separately chosen mix), worst case.
  - `holdout`: short labels ("Chosen with all weather", "Weather left out", "Region left out", "Random responsive", "Random any"), and a plot width of at least 60% of the chart.
- Map labels:
  - On sensors / holdup / assumed, show numbered markers only.
  - On close, label "Sensor 1" and show 2 to 5 as plain numbered markers.
  - On type, label only the level and float sites being compared.
- Legends:
  - `problem`: "Surcharged manhole".
  - `triage`: "Monitor", "Watch", "Room on a design wet day".
  - `sensors`: "Level sensors 1 to 5".
  - `type`: "Level sensor", "Float switch".
  - No legend line without a swatch.
- Top-right link text: "Open the simulation tool ↗".
- Region labels use the original label family on `main`. Explain the R9 overlap once in the regions ⓘ card.

## Gate
`zsh demo/notes/check_deck.sh` prints OK. `node --check` passes on every demo JS file. Check by hand that no card scrolls at 1280×800 or 1024×768.
