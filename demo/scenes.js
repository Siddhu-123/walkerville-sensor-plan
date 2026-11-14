// Scene-by-scene copy and camera cues for the Walkerville Simulation 4 guided client deck.
// Numbers come from demo/sim4-facts.js (window.OSP_SIM4.facts) and window.OSP_STATIC below, filled in with {{key}}.

window.OSP_STATIC = {
  uni_name: "Adelaide University",
};

window.OSP_SCENES = [
  {
    id: "welcome",
    welcome: true,
    view: "region",
    ms: 0,
    show: { basemap: 0.72, pipes: 0.9, chambers: 0.35 },
    fx: "welcome",
    html: `
      <div class="w-top">
        <span>Optimal Sensor Placement · Wastewater Networks</span>
        <span>Capstone PG-S2-22 · {{uni_name}}</span>
      </div>
      <div class="w-body">
        <div class="w-eyebrow">Town of Walkerville · {{model_version}}</div>
        <h1>Where to watch Walkerville's sewers as it grows</h1>
        <p class="w-sub">Wet weather already surcharges Walkerville's pipes before any new homes connect, while 2041 housing growth newly surcharges no manhole on a design wet day. This {{model_version}} study across {{sites}} manholes and {{swmm_links}} pipes tests where to place {{plan_k0}} or {{plan_k1}} continuous level sensors across {{regions}} regions.</p>
        <div class="w-actions">
          <button type="button" class="w-cta" data-go>Begin the walk-through <span aria-hidden="true">→</span></button>
          <span class="w-hint">Use <kbd>→</kbd> or <kbd>Space</kbd>, <kbd>T</kbd> for dark mode, <kbd>F</kbd> for fullscreen</span>
        </div>
      </div>
      <div class="w-foot">
        <div><b>Prepared by the team</b><span>Abraham Paul Jaison, Ashis Jose Kalathil, Rijoy John, Satya Siddhartha Balanagu, Wimukthi Rajapaksha</span></div>
        <div><b>Industry partner</b><span>SA Water · Capstone PG-S2-22</span></div>
        <div><b>Data</b><span>Location SA · PlanSA · ABS · Walkerville GIS · EPA SWMM 5.2</span></div>
      </div>`,
  },

  // 1 · Problem
  {
    id: "problem",
    act: "Problem",
    kicker: "Problem",
    title: "Wet weather already fills pipes, before any new homes",
    view: "all",
    ms: 1400,
    show: { basemap: 0.45, pipes: 0.9, chambers: 0.55 },
    fx: "problem",
    seg: [0, 1, 2],
    readout: true,
    legend: "problem",
    info: { params: "problem" },
    stats: [
      ["{{base_surcharged_design}} / {{base_surcharged_wetter}} / {{base_surcharged_severe}}", "manholes surcharged today (Design wet / Beyond / Severe)", "accent"],
      ["0 on Design wet", "new surcharges from 2041 growth ({{warn_total}} overloads in wetter cases)"],
    ],
    html: `
      <p>Before any 2041 homes connect across Walkerville's <b>{{swmm_links}}</b> pipes and <b>{{sites}}</b> manholes (<span class="cite" data-src="sim4">EPA SWMM 5.2</span>), wet weather surcharges <b>{{base_surcharged_design}}</b> manholes on a design wet day, <b>{{base_surcharged_wetter}}</b> beyond design, and <b>{{base_surcharged_severe}}</b> in severe weather.</p>
      <div class="params">
        <div class="p"><b>Wet weather matters more than growth</b><span>On a design wet day, 2041 growth newly surcharges no manhole. All <b>{{warn_total}}</b> overloads (<b>{{new_surcharge_rows}}</b> of <b>{{wet_runs_100}}</b> wet runs surcharging, <b>{{new_spill_rows}}</b> spilling) come from wetter cases.</span><span class="chip checked" data-src="sim4">Sim 4</span></div>
      </div>`,
  },

  // 2 · Since October
  {
    id: "changed",
    act: "Since October",
    kicker: "Since October",
    title: "What changed since the October demo",
    view: "all",
    ms: 1400,
    style: "age",
    show: { basemap: 0.55, pipes: 1, homes: 0.65 },
    fx: "infill",
    info: { params: "changed" },
    stats: [
      ["{{equal_regions}} + 1", "equal-home regions plus R9 corridor ({{region_homes_min}} to {{region_homes_max}} homes)", "accent"],
      ["{{wet_runs_100}}", "wet-weather growth runs up to 2041 across {{wet_cases}} wet cases"],
    ],
    html: `
      <p><span class="cite" data-src="sim4">{{model_version}}</span> replaces hand-picked zones with <b>{{equal_regions}}</b> regions adapted from <span class="cite" data-src="kim2022">Kim et al. (2022)</span> plus <b>R9</b> along Walkerville Terrace, and builds a nested 1-to-8 sensor ladder.</p>
      <div class="params">
        <div class="p"><b>Adapted from Kim et al. (2022)</b><span>Cuts at pipe ends instead of manholes, includes loops, and lets a manhole sit in two regions (Kim et al. chose sites for disease surveillance, not capacity). Growth was tested at 0.1, 0.25, 0.5, 0.75, 1, 1.5 and 3 times each region's 2041 figure.</span><span class="chip declared" data-src="kim2022">method</span></div>
      </div>`,
  },

  // 3 · Regions
  {
    id: "regions",
    act: "Regions",
    kicker: "Regions",
    title: "Two regions to monitor, three to watch, four with room",
    view: "all",
    ms: 1400,
    show: { basemap: 0.42, pipes: 1, chambers: 0.45 },
    fx: "regions",
    legend: "triage",
    info: { params: "regions" },
    stats: [
      ["{{monitor_regions}}", "monitor on Design wet (R3: {{r3_range}}; R7: {{r7_range}} homes)", "accent"],
      ["R5 only", "keeps room in all {{wet_cases}} wet cases"],
    ],
    html: `
      <p>Triage uses the design wet case only (assumed <b>{{limit_bore_dec}}</b> bore limit), while the five-sensor plan uses all <b>{{wet_cases}}</b> wet cases. Homes-to-limit ranges pass 2041 because growth was tested up to 3 times 2041.</p>
      <div class="params">
        <div class="p"><b>Monitor {{monitor_regions}} · Watch {{watch_regions}}</b><span>R1 (Watch) runs out in 3 of 7 cases, as R3 does. R9 uses the <b>{{r9_homes}}-home</b> anchor (<span class="cite" data-src="sim4">Sim 4</span>).</span><span class="chip confirm" data-src="sim4">triage</span></div>
        <div class="p"><b>Leave {{leave_regions}} (Design wet only)</b><span>Only <b>R5</b> keeps room in all 7 wet cases; <b>R8</b> is already over the limit in 4 of 7.</span><span class="chip declared" data-src="sim4">wet cases</span></div>
      </div>`,
  },

  // 4 · Sensors
  {
    id: "sensors",
    act: "Sensors",
    kicker: "Sensors",
    title: "One sensor for the design day, five for wetter weather",
    view: "p1",
    ms: 1400,
    show: { basemap: 0.48, pipes: 0.92, chambers: 0.45, sensors: 1 },
    fx: "ladder",
    chart: "ladder",
    legend: "sensors",
    info: { params: "sensors" },
    stats: [
      ["{{worst_k5}}% / {{avg_k5}}%", "5-sensor worst / average at 10 mm ({{rule25_worst_k5}}% / {{rule25_avg_k5}}% at 25 mm)", "accent"],
      ["{{warn_k5}} of {{warn_total}}", "overloads warned (1 sensor: {{design_wet_k1_seen}} of {{design_wet_runs}} Design wet, {{avg_k1}}% avg)"],
    ],
    html: `
      <p>At the assumed <b>{{rise_focus_mm}} mm</b> rise rule, <b>{{plan_k0}}</b> sensor ({{cost_k1}} assumed) reacts +12.4 mm at 14 homes in R3 and sees <b>{{design_wet_k1_seen}} of {{design_wet_runs}}</b> Design wet runs (<b>{{avg_k1}}%</b> across <b>{{wet_cases}}</b> wet cases); <b>{{plan_k1}}</b> nested sensors ({{cost_k5}} assumed) see <b>{{worst_k5}}% / {{avg_k5}}%</b>.</p>
      <div class="params">
        <div class="p"><b>25 mm rule &amp; Stonyfell variation</b><span>At <b>{{rise_strict_mm}} mm</b>, 5 sensors see <b>{{rule25_worst_k5}}%</b> worst / <b>{{rule25_avg_k5}}%</b> average. Stonyfell normal levels vary <b>20 to 75 mm</b> (<span class="cite" data-src="levelsensor">Do et al., 2023</span>); telling 10 mm of growth from daily variation is untested.</span><span class="chip declared" data-src="sim4">assumed</span></div>
      </div>`,
  },

  // 5 · Which type
  {
    id: "type",
    act: "Which type",
    kicker: "Which type",
    title: "Floats alone miss growth in some weather",
    view: "beats",
    ms: 1400,
    show: { basemap: 0.45, pipes: 0.85, chambers: 0.4, sensors: 1, trunk: 0.95 },
    fx: "beats",
    chart: "type",
    legend: "type",
    info: { params: "type" },
    stats: [
      ["{{float_worst}}% / {{float_avg}}%", "floats-only worst / average ({{float_cap_count}} floats, {{float_cap_cost}} assumed)"],
      ["{{mix_75k_worst}}% vs {{worst_k3}}%", "worst case at $75k: 2 level + 6 floats ($56k) vs 3 level", "accent"],
    ],
    html: `
      <p>We compared continuous level sensors (<b>{{level_price}}</b> assumed) and <span class="cite" data-src="brieftype">float switches</span> (<b>{{float_price}}</b> assumed). Floats only count if they sit <b>{{float_margin_mm}} mm</b> above normal (assumed), stay quiet on Design wet, and growth lifts water past them.</p>
      <div class="params">
        <div class="p"><b>Floats alone vs a $75k mix</b><span>Floats on their own stall at <b>{{float_avg}}%</b> average and <b>{{float_worst}}%</b> worst case. In a mix, <b>{{cost_k3}}</b> buys <b>{{mix_75k_bought}} ({{mix_75k_cost}})</b> and reaches <b>{{mix_75k_worst}}%</b> worst case, against <b>{{worst_k3}}%</b> for 3 level sensors.</span><span class="chip declared" data-src="sim4">assumed</span></div>
      </div>`,
  },

  // 6 · Does it hold up
  {
    id: "holdup",
    act: "Does it hold up",
    kicker: "Does it hold up",
    title: "Held-out weather and regions still beat random picks",
    view: "p1",
    ms: 1400,
    show: { basemap: 0.5, pipes: 0.85, chambers: 0.45, sensors: 1 },
    fx: "holdout",
    chart: "holdout",
    legend: "sensors",
    info: { params: "holdup" },
    stats: [
      ["{{unseen_wx_k5}}% / {{unseen_reg_k5}}%", "unseen weather / unseen region (from {{avg_k5}}% in-sample)", "accent"],
      ["{{random_resp_k5}}% / {{random_any_k5}}%", "random responsive / random any manholes ({{random_draws}} draws)"],
    ],
    html: `
      <p>In-sample <b>{{avg_k5}}%</b> falls to <b>{{unseen_wx_k5}}%</b> on unseen weather and <b>{{unseen_reg_k5}}%</b> on an unseen region ({{model_version}} calls this a little generous because R9 overlaps other regions), beating random responsive (<b>{{random_resp_k5}}%</b>) and random any (<b>{{random_any_k5}}%</b>) picks.</p>
      <div class="params">
        <div class="p"><b>Age-weighted holdout &amp; sensor stability</b><span>With the age-weighted design wet case held out, even 8 sensors see <b>0%</b> of it. Sensors 1 and 3 appear in the October deck's five, the 6 November Sim 3.5 five, and {{model_version}}'s five.</span><span class="chip checked" data-src="sim4">holdout</span></div>
      </div>`,
  },

  // 7 · What we assumed
  {
    id: "assumed",
    act: "What we assumed",
    kicker: "What we assumed",
    title: "What we assumed, and the data that would settle it",
    view: "all",
    ms: 1400,
    show: { basemap: 0.55, pipes: 0.85, chambers: 0.5, sensors: 1 },
    legend: "sensors",
    info: { params: "assumed" },
    stats: [
      ["{{run_noise_min}}–{{run_noise_max}} pts", "score shift per run (94% and 92% tie within noise)"],
      ["{{sensors_90pct_all_wet}} / {{sensors_100pct_all_wet}} sensors", "for 90% / 100% across all {{wet_cases}} wet cases", "accent"],
    ],
    html: `
      <p>Every figure is an uncalibrated model result. Wet-weather level records (not normal-day records) would decide between <b>{{plan_k0}}</b> sensor and <b>{{plan_k1}}</b>; reaching 100% of all <b>{{wet_cases}}</b> wet cases takes <b>{{sensors_100pct_all_wet}}</b> sensors (90% takes <b>{{sensors_90pct_all_wet}}</b>).</p>
      <div class="params">
        <div class="p"><b>Sensors never fail &amp; 485-home source</b><span>Rules ({{rise_focus_mm}} mm, {{rise_strict_mm}} mm, {{limit_bore_dec}} bore) and prices are assumed; sensors never fail here, and the source for the <b>{{homes_2041}}-home</b> anchor (<span class="cite" data-src="sim4">Sim 4</span>) is still needed.</span><span class="chip ideal" data-src="sim4">limits</span></div>
        <div class="p"><b>Future work · New suburb inputs</b><span>Pipes and manholes, outlets, homes now and projected, pump rates, weather cases, and utility rules and prices.</span><span class="chip checked" data-src="sim4">future work</span></div>
      </div>`,
  },

  // 8 · Recommendation
  {
    id: "close",
    act: "Recommendation",
    kicker: "Recommendation",
    title: "Start with one sensor in R3, then grow to five",
    view: "p1",
    ms: 1400,
    show: { basemap: 0.55, pipes: 0.95, chambers: 0.4, sensors: 1 },
    fx: "plan",
    legend: "sensors",
    info: { params: "close" },
    stats: [
      ["{{plan_k0}} → {{plan_k1}}", "level sensors ({{cost_k1}} to {{cost_k5}} at assumed prices)", "accent"],
      ["{{monitor_regions}}", "monitor first; watch {{watch_regions}} (leave {{leave_regions}} on Design wet)"],
    ],
    html: `
      <p>Monitor <b>{{monitor_regions}}</b> and watch <b>{{watch_regions}}</b> first, noting that only <b>R5</b> keeps room in all <b>{{wet_cases}}</b> wet cases. Start with <b>Sensor 1</b> in R3 (<b>{{cost_k1}}</b> assumed) and record wet-weather levels to test the design wet case.</p>
      <div class="params">
        <div class="p"><b>Grow to {{plan_k1}} level sensors ({{cost_k5}} assumed) for wetter weather</b><span>Adding Sensors 2 to 5 reaches <b>{{worst_k5}}%</b> worst case and <b>{{avg_k5}}%</b> average (10 mm assumed rule) and warns of all <b>{{warn_k5}} of {{warn_total}}</b> overloads (<b>{{sensors_90pct_all_wet}}</b> sensors for 90% of all wet cases, <b>{{sensors_100pct_all_wet}}</b> for 100%).</span><span class="chip checked" data-src="sim4">plan</span></div>
      </div>`,
  },
];
