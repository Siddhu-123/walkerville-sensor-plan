// Scene-by-scene copy and camera cues for the Walkerville guided client deck.
// Numbers come from demo/sim4-facts.js (window.OSP_SIM4.facts) and window.OSP_STATIC below, filled in with {{key}}.

window.OSP_STATIC = {
  uni_name: "Adelaide University",
};

window.OSP_SCENES = [
  {
    id: "welcome",
    welcome: true,
    act: "",
    view: "region",
    fx: "welcome",
    ms: 1400,
    show: { basemap: 0.72, pipes: 0.9, chambers: 0.35 },
    html: `<div class="welcome-top">
        <div class="welcome-kicker">{{uni_name}} · SA Water</div>
        <h1 class="welcome-heading welcome-topic">Optimal sensor placement for wastewater network monitoring</h1>
        <p class="welcome-greeting">Wet weather already fills Walkerville's sewers before any new homes connect, while 2041 infill growth adds no new surcharge on a design wet day. We test {{sites}} manholes and {{swmm_links}} pipes across {{regions}} regions to find where {{plan_k0}} to {{plan_k1}} level sensors catch growth early.</p>
        <div class="welcome-start">
          <button class="start-btn" type="button" data-go><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5 L10.5 6 L3 10.5 Z" /></svg>Start</button>
          <span class="welcome-hint">or press →</span>
        </div>
      </div>
      <footer class="welcome-footer">
        <div class="meta-block"><span class="meta-label">SA Water &amp; Academic Supervision</span><span class="meta-value">Vineeth Maruvada &amp; Adel (SA Water) · Karamjit Kaur (Supervisor)</span></div>
        <div class="meta-block"><span class="meta-label">Project Team · Capstone PG-S2-22</span><div class="team-grid"><span>Abraham Paul Jaison</span><span>Ashis Jose Kalathil</span><span>Rijoy John</span><span>Satya Siddhartha Balanagu</span><span>Wimukthi Rajapaksha</span></div></div>
      </footer>`,
  },

  // 1 · The question · Wet weather
  {
    id: "problem",
    act: "The question",
    kicker: "Wet weather",
    title: "Wet weather already fills pipes, before any new homes",
    view: "all",
    ms: 1400,
    show: { basemap: 0.45, pipes: 0.9, chambers: 0.55 },
    fx: "problem",
    readout: true,
    legend: "problem",
    info: { params: "problem" },
    stats: [
      ["{{base_surcharged_design}}", "manholes surcharged today on a design wet day"],
      ["{{warn_total}}", "region-weather overloads, all in wetter weather"],
    ],
    html: `<p>In the <span class="cite" data-src="swmmlevel">EPA SWMM 5.2</span> model of Walkerville, rain and groundwater already push water above the pipe top (surcharge).</p>
      <ul>
        <li>Today, {{base_surcharged_design}} manholes surcharge on a design wet day, {{base_surcharged_wetter}} in beyond-design wet weather and {{base_surcharged_severe}} in severe wet weather.</li>
        <li>On a design wet day, 2041 growth newly surcharges no manhole.</li>
        <li>All {{warn_total}} overloads ({{new_surcharge_rows}} surcharged runs, {{new_spill_rows}} spill across {{wet_runs_100}} wet runs) come from wetter weather <span class="chip checked" data-src="sim4">checked</span>.</li>
      </ul>`,
    after: `<p class="note"><strong>Wet weather is the first pressure to measure.</strong></p>`,
  },

  // 2 · Our approach · Since October
  {
    id: "changed",
    act: "Our approach",
    kicker: "Since October",
    title: "What changed since the October demo",
    view: "all",
    ms: 1400,
    style: "age",
    show: { basemap: 0.55, pipes: 1, homes: 0.65 },
    fx: "infill",
    info: { params: "changed" },
    html: `<p>The model replaces hand-picked zones with {{equal_regions}} regions of similar size ({{region_homes_min}} to {{region_homes_max}} homes each) adapted from <span class="cite" data-src="kim2022">Kim et al. (2022)</span>, plus R9 along Walkerville Terrace.</p>
      <ul>
        <li>Kim et al. (2022) placed samplers for disease surveillance. The model cuts at pipe ends, keeps loops and lets a manhole sit in two regions.</li>
        <li>Growth is tested at 0.1, 0.25, 0.5, 0.75, 1, 1.5 and 3 times each region's 2041 projection across {{wet_cases}} wet cases.</li>
        <li>Sensors are added one by one in a 1-to-{{plan_kmax}} staged plan <span class="chip checked" data-src="sim4">checked</span>.</li>
      </ul>`,
    after: `<p class="note">Testing to 3 times 2041 growth shows where spare room runs out, so <strong>regions are ranked before siting sensors</strong>.</p>`,
  },

  // 3 · The answer · Priority regions
  {
    id: "regions",
    act: "The answer",
    kicker: "Priority regions",
    title: "Where to monitor first on a design wet day",
    view: "all",
    ms: 1400,
    show: { basemap: 0.42, pipes: 1, chambers: 0.45 },
    fx: "regions",
    legend: "triage",
    info: { params: "regions" },
    stats: [
      ["2", "regions to monitor first on a design wet day (R3 and R7)"],
      ["1", "region with room left in all {{wet_cases}} wet cases (R5)"],
    ],
    html: `<p>Region triage checks when pipes pass {{limit_bore}}% of pipe depth (assumed) on a design wet day, while the five-sensor staged plan scores all {{wet_cases}} wet cases <span class="chip declared" data-src="sim4">declared</span>.</p>
      <ul>
        <li>Monitor {{monitor_regions}} first ({{r3_range}} and {{r7_range}} homes to the {{limit_bore_dec}} limit); watch {{watch_regions}} ({{r9_homes}}-home R9 anchor).</li>
        <li>R1 (Watch) runs out in 3 of {{wet_cases}} wet cases, just as R3 does.</li>
        <li>Of {{leave_regions}}, only R5 keeps room in all {{wet_cases}} wet cases; R8 is already over the {{limit_bore_dec}} limit in 4 of {{wet_cases}}.</li>
      </ul>`,
    after: `<p class="note">Ranges pass 2041 because tests run to 3 times 2041; <strong>only R5 stays clear in every wet case</strong>.</p>`,
  },

  // 4 · The answer · How many
  {
    id: "sensors",
    act: "The answer",
    kicker: "How many",
    title: "One sensor for a design wet day, five for wetter weather",
    view: "p1",
    ms: 1400,
    show: { basemap: 0.48, pipes: 0.92, chambers: 0.45, sensors: 1 },
    fx: "ladder",
    chart: "ladder",
    legend: "sensors",
    info: { chart: "sensors" },
    html: `<p>At a {{rise_focus_mm}} mm rise rule (assumed), Sensor 1 ({{cost_k1}}) reacts at {{sensor_1_reacts}} and sees {{design_wet_k1_seen}} of {{design_wet_runs}} runs on a design wet day.</p>
      <ul>
        <li>Five level sensors ({{cost_k5}}) see {{worst_k5}}% in the worst case, {{avg_k5}}% on average across all wet weather.</li>
        <li>At {{rise_strict_mm}} mm, five sensors see {{rule25_worst_k5}}% in the worst case, {{rule25_avg_k5}}% on average.</li>
        <li>Stonyfell normal levels vary 20 to 75 mm (<span class="cite" data-src="levelsensor">Do et al. (2023)</span>) <span class="chip sourced" data-src="levelsensor">sourced</span>.</li>
      </ul>`,
    after: `<p class="note"><strong>Telling {{rise_focus_mm}} mm of growth from daily variation is untested</strong>; an exact solver reaches {{exact_worst_k5}}% in the worst case, {{exact_avg_k5}}% on average.</p>`,
  },

  // 5 · Why it holds · Sensor types
  {
    id: "type",
    act: "Why it holds",
    kicker: "Sensor types",
    title: "Float switches alone miss growth in some weather",
    view: "beats",
    ms: 1400,
    show: { basemap: 0.45, pipes: 0.85, chambers: 0.4, sensors: 1, trunk: 0.95 },
    fx: "beats",
    chart: "type",
    legend: "type",
    info: { chart: "type" },
    html: `<p>Level sensors ({{level_price}} each, assumed) with <span class="cite" data-src="brieftype">float switches</span> ({{float_price}} each) were compared on the same runs <span class="chip declared" data-src="sim4">declared</span>.</p>
      <ul>
        <li>A float switch counts only if it sits {{float_margin_mm}} mm above normal depth, stays quiet on a design wet day.</li>
        <li>Alone, {{float_cap_count}} float switches ({{float_cap_cost}}) stall at {{float_worst}}% in the worst case, {{float_avg}}% on average.</li>
        <li>At {{cost_k3}}, a separately chosen mix of 2 level sensors and 6 float switches ({{mix_75k_cost}}) sees {{mix_75k_worst}}% in the worst case, {{mix_75k_avg}}% on average, vs {{worst_k3}}% in the worst case, {{avg_k3}}% on average for 3 level sensors.</li>
      </ul>`,
    after: `<p class="note">At {{cost_k3}}, <strong>a mix of both types sees more in the worst case than level sensors alone</strong>.</p>`,
  },

  // 6 · Why it holds · Unseen weather
  {
    id: "holdup",
    act: "Why it holds",
    kicker: "Unseen weather",
    title: "How the plan holds on weather it never saw",
    view: "p1",
    ms: 1400,
    show: { basemap: 0.5, pipes: 0.85, chambers: 0.45, sensors: 1 },
    fx: "holdout",
    chart: "holdout",
    legend: "sensors",
    info: { chart: "holdup" },
    html: `<p>Chosen with all weather cases, five level sensors see {{worst_k5}}% in the worst case, {{avg_k5}}% on average <span class="chip checked" data-src="sim4">checked</span>.</p>
      <ul>
        <li>With weather left out, average coverage is {{unseen_wx_k5}}%; with a region left out, it is {{unseen_reg_k5}}%.</li>
        <li>Both beat random picks of responsive manholes ({{random_resp_k5}}%) and any manholes ({{random_any_k5}}%).</li>
        <li>With the age-weighted design wet case left out, even {{plan_kmax}} sensors see 0% of it.</li>
      </ul>`,
    after: `<p class="note">Sensors 1 and 3 have been in every five-sensor plan since October. <strong>The plan has to be chosen across all the weather it will face.</strong></p>`,
  },

  // 7 · What's next · What to check
  {
    id: "assumed",
    act: "What's next",
    kicker: "What to check",
    title: "Wet-weather records are the next step",
    view: "all",
    ms: 1400,
    show: { basemap: 0.55, pipes: 0.85, chambers: 0.5, sensors: 1 },
    legend: "sensors",
    info: { params: "assumed" },
    html: `<p>Every figure comes from an uncalibrated model using a {{rise_focus_mm}} mm rise rule (assumed). Wet-weather level records decide between {{plan_k0}} sensor and {{plan_k1}}.</p>
      <div class="params">
        <div><span class="k">Wet-weather records</span><span class="v"><span class="chip confirm" data-src="infiltration">to confirm</span></span><span class="s">Settles {{plan_k0}} sensor vs {{plan_k1}} ({{sensors_90pct_all_wet}} sensors cover 90% of all {{wet_cases}} wet cases; {{sensors_100pct_all_wet}} cover 100%).</span></div>
        <div><span class="k">Rules and uptime</span><span class="v"><span class="chip declared" data-src="sim4">declared</span></span><span class="s">Uses {{rise_focus_mm}} mm and {{rise_strict_mm}} mm rules, the {{limit_bore_dec}} limit and {{level_price}} / {{float_price}} prices; sensors never fail.</span></div>
        <div><span class="k">Noise and {{homes_2041}} homes</span><span class="v"><span class="chip confirm" data-src="sim4">to confirm</span></span><span class="s">One run shifts scores by {{run_noise_min}} to {{run_noise_max}} percentage points so {{avg_k5}}% and {{avg_k4}}% are effectively equal; the {{homes_2041}}-home source is needed.</span></div>
      </div>`,
    after: `<p class="note">To repeat this for another suburb: <strong>its pipe map, home projections, pump rates and weather cases.</strong></p>`,
  },

  // 8 · What's next · The first step
  {
    id: "close",
    act: "What's next",
    kicker: "The first step",
    title: "Start with Sensor 1 in R3, then grow to five",
    view: "p1",
    ms: 1400,
    show: { basemap: 0.55, pipes: 0.95, chambers: 0.4, sensors: 1 },
    fx: "plan",
    legend: "sensors",
    info: { params: "close" },
    stats: [
      ["{{plan_k0}}", "level sensor in R3 for a design wet day ({{cost_k1}})"],
      ["{{plan_k1}}", "level sensors across Walkerville for wetter weather ({{cost_k5}})"],
    ],
    html: `<p>Start with Sensor 1 in R3 to watch {{monitor_regions}} and {{watch_regions}} while recording wet-weather levels <span class="chip checked" data-src="sim4">checked</span>.</p>
      <ul>
        <li>Sensor 1 has 4 nearby stand-ins with the same score and catches {{design_wet_k1_seen}} of {{design_wet_runs}} runs on a design wet day.</li>
        <li>If records show wetter inflow, add Sensors 2 to 5 in the staged plan ({{cost_k5}}) for {{worst_k5}}% in the worst case, {{avg_k5}}% on average.</li>
        <li>Two sensors already warn of {{warn_k5}} of {{warn_total}} overloads.</li>
      </ul>`,
    after: `<p class="note"><strong>One sensor tests the design wet day now, and stays in place if the plan grows to five.</strong></p>`,
  },
];
