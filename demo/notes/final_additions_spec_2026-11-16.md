# Final presentation additions (16 Nov 2026)

Add four scenes so the final presentation also covers the direct answer to the brief, what the plan costs, and what is handed over. That gives welcome + 14 scenes. Keep every rule in `design_fix_spec_2026-11-14.md` and `final_structure_spec_2026-11-15.md`: copy rules, scene schema, at most 3 `<li>`, one `<p class="note">` takeaway with one `<strong>`, at most 120 words, and "assumed" at most once per slide. Use only the `{{tokens}}` and facts listed here. Do not change `demo/sim4-facts.js`, `demo/engine.js` or `demo/sources.js`.

## New order (counter "01 / 14")

brief, problem, built, method, regions, sensors, type, holdup, **answer**, close, **cost**, **deliver**, **handover**, assumed

Acts:
- brief, problem: "The brief".
- built, method: "What we built".
- regions, sensors, type, holdup: "What we found".
- answer, close, cost: "Our recommendation".
- deliver, handover: "What we hand over".
- assumed: "For the next team".

## New scenes

All four use `view: "all"`, the same `show` object as `built`, no `fx`, no `chart`, no `stats`, no `info` and no `legend`. Each uses a `.params` table with the original `<span class="k">`, `<span class="v"></span>` and `<span class="s">` children, like `built`.

### answer
- act "Our recommendation"; kicker "The answer"; title "How many, which type, where".
- Lede `<p>`: "The three questions in the brief, answered from the model."
- Rows:
  - **How many:** "{{plan_k0}} level sensor covers a design wet day; {{plan_k1}} cover wetter weather."
  - **Which type:** "Level sensors. Float switches only warn of spills and saw {{float_worst}}% of growth in the worst case."
  - **Where:** "Monitor {{monitor_regions}} first, starting with Sensor 1 in R3; the five-sensor plan covers {{target_regions}}."
- Note: `<p class="note"><strong>Start with Sensor 1, then grow to {{plan_k1}} as budget allows.</strong></p>`

### cost (after close)
- act "Our recommendation"; kicker "Cost and benefit"; title "What each budget buys".
- Lede `<p>`: "Level sensors at {{level_price}} each (assumed); share of detectable growth seen, worst case first."
- Rows:
  - **{{cost_k1}}, 1 sensor:** "{{worst_k1}}% in the worst case, {{avg_k1}}% on average."
  - **{{cost_k3}}, 3 sensors:** "{{worst_k3}}% in the worst case, {{avg_k3}}% on average."
  - **{{cost_k5}}, 5 sensors:** "{{worst_k5}}% in the worst case, {{avg_k5}}% on average."
  - **Float switches only:** "{{float_cap_count}} switches ({{float_cap_cost}}) reach {{float_worst}}% in the worst case, {{float_avg}}% on average, and more switches add nothing."
- Note: `<p class="note">Beyond {{cost_k5}}, <strong>each extra sensor adds little</strong>: {{worst_k6}}% in the worst case at 6 sensors, {{worst_k8}}% at 8.</p>`

### deliver
- act "What we hand over"; kicker "Deliverables"; title "What the project delivers".
- Lede `<p>`: "Each deliverable in the project scope, and where it sits."
- Rows (`.k` is the deliverable, `.s` is where it is):
  - **D1 Literature review:** "The sensor review, the team compiled paper and a research library of 58 summarised papers."
  - **D2 Parameter catalogue:** "Network and placement parameters, with evidence for each."
  - **D3 and D4 Placement approach and pilot plan:** "Equal-home regions and the staged plan, applied to Walkerville."
  - **D5 Cost and information trade-off:** "Level sensors against float switches at each budget."
  - **D6 to D8 Guidelines, business case and handover:** add `<span class="chip confirm">to confirm</span>` inside `.v`; `.s` text: "Covered in the final report."
- Note: `<p class="note"><strong>D1 to D5 are in this presentation and the tools.</strong></p>`

### handover
- act "What we hand over"; kicker "Handover"; title "What the next team receives".
- Lede `<p>`: "Everything runs from public data and is kept on GitHub."
- Rows:
  - **Simulation tool:** `<a href="https://abrahampaulj.github.io/gravity-sewer-osp/simulation4/index.html" target="_blank" rel="noopener">An online simulation tool</a>` + " and its Python source."
  - **Walkerville model:** "An EPA SWMM 5.2 model of {{sites}} manholes and {{swmm_links}} pipes."
  - **Data warehouse:** "19 datasets with extraction scripts and an availability matrix."
  - **Research library:** `<a href="https://siddhu-123.github.io/waste_water_network_sensor-papers/" target="_blank" rel="noopener">58 summarised papers</a>` + " sorted by topic, with a PDF viewer."
- Note: `<p class="note"><strong>The next team starts from the same model, data and code.</strong></p>`

## Gate (`demo/notes/check_deck.sh`)
- Expect 15 scene objects (welcome + 14) and the new order above.
- Allow 4 to 6 acts.
- Update the success message to "scenes: 15 (welcome + 14)".
- Keep every other rule.
