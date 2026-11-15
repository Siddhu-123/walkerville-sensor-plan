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
        <p class="welcome-greeting">Wet weather already fills Walkerville's sewers, and new homes keep connecting to them. We work out how many level sensors the network needs, and where, so growth shows before it causes an overflow.</p>
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

  // 1 · The brief · What we were asked
  {
    id: "brief",
    act: "The brief",
    kicker: "What we were asked",
    title: "How many sensors, which type, and where",
    view: "all",
    ms: 1400,
    show: { basemap: 0.48, pipes: 0.9, chambers: 0.55 },
    html: `<p>The <span class="cite" data-src="request">project brief</span> asks for the optimal sensor locations and number of sensors for a sewer network, with recommendations based on the results.</p>
      <ul>
        <li>The focus is growth: new homes adding load to trunk sewers, seen early enough to act before an overflow (<span class="cite" data-src="briefwatch">scope</span>).</li>
        <li>Two device types are compared: continuous level sensors and <span class="cite" data-src="brieftype">float switches</span> (threshold alarms).</li>
        <li>The study is desk-based: no installation or field validation <span class="chip sourced" data-src="briefwithin">sourced</span>.</li>
      </ul>`,
    after: `<p class="note"><strong>Tested on Walkerville's sewer network.</strong></p>`,
  },

  // 2 · The brief · Why it matters
  {
    id: "problem",
    act: "The brief",
    kicker: "Why it matters",
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

  // 3 · What we built · Deliverables
  {
    id: "built",
    act: "What we built",
    kicker: "Deliverables",
    title: "Four things built for this project",
    view: "all",
    ms: 1400,
    show: { basemap: 0.48, pipes: 0.9, chambers: 0.45 },
    info: { params: "built" },
    html: `<p>Four pieces of work feed the recommendation.</p>
      <div class="params">
        <div><span class="k">Sensor review</span><span class="v"></span><span class="s">A review of radar, ultrasonic and LiDAR level sensors, flow meters, float switches and placement methods. No single sensor suits every task; only level sensors and float switches were modelled.</span></div>
        <div><span class="k">Parameter catalogue</span><span class="v"></span><span class="s">The network and placement parameters the method needs, with the evidence for each.</span></div>
        <div><span class="k">Data availability matrix</span><span class="v"></span><span class="s">19 datasets (pipes, rainfall, census and more) checked for use in the tool.</span></div>
        <div><span class="k">Walkerville model and simulation tool</span><span class="v"></span><span class="s">An EPA SWMM 5.2 model of {{sites}} manholes and {{swmm_links}} pipes, and <a href="https://abrahampaulj.github.io/gravity-sewer-osp/simulation4/index.html" target="_blank" rel="noopener">an online simulation tool</a> with growth and wet-weather cases.</span></div>
      </div>`,
    after: `<p class="note"><strong>Each finding that follows comes from this model.</strong></p>`,
  },

  // 4 · What we built · The method
  {
    id: "method",
    act: "What we built",
    kicker: "The method",
    title: "Group homes into regions, then add sensors one at a time",
    view: "all",
    ms: 1400,
    style: "age",
    show: { basemap: 0.55, pipes: 1, homes: 0.65 },
    fx: "infill",
    info: { params: "method" },
    html: `<p>The model divides Walkerville into {{equal_regions}} regions of similar size ({{region_homes_min}} to {{region_homes_max}} homes each) adapted from <span class="cite" data-src="kim2022">Kim et al. (2022)</span>, plus R9 along Walkerville Terrace.</p>
      <ul>
        <li>Kim et al. (2022) placed samplers for disease surveillance. The model cuts at pipe ends, keeps loops and lets a manhole sit in two regions.</li>
        <li>Growth is tested at 0.1, 0.25, 0.5, 0.75, 1, 1.5 and 3 times each region's 2041 projection across {{wet_cases}} wet cases.</li>
        <li>Sensors are added one by one in a 1-to-{{plan_kmax}} staged plan <span class="chip checked" data-src="sim4">checked</span>.</li>
      </ul>`,
    after: `<p class="note">Testing to 3 times 2041 growth shows where spare room runs out, so <strong>regions are ranked before siting sensors</strong>.</p>`,
  },

  // 5 · What we found · Priority regions
  {
    id: "regions",
    act: "What we found",
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

  // 6 · What we found · How many
  {
    id: "sensors",
    act: "What we found",
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

  // 7 · What we found · Sensor types
  {
    id: "type",
    act: "What we found",
    kicker: "Sensor types",
    title: "Float switches warn of spills; only level sensors show growth",
    view: "beats",
    ms: 1400,
    show: { basemap: 0.45, pipes: 0.85, chambers: 0.4, sensors: 1, trunk: 0.95 },
    fx: "beats",
    chart: "type",
    legend: "type",
    info: { chart: "type" },
    html: `<p>Level sensors ({{level_price}} each, assumed) and <span class="cite" data-src="brieftype">float switches</span> ({{float_price}} each) were compared on the same runs <span class="chip declared" data-src="sim4">declared</span>.</p>
      <ul>
        <li>A float switch counts only if it sits {{float_margin_mm}} mm above normal depth and stays quiet on a design wet day.</li>
        <li>Alone, {{float_cap_count}} float switches ({{float_cap_cost}}) stall at {{float_worst}}% in the worst case, {{float_avg}}% on average.</li>
        <li>Float switches are <span class="cite" data-src="levelsensor">spill alarms</span>: each switches at one set height and cannot show a rise building up.</li>
      </ul>`,
    after: `<p class="note">Even set {{float_margin_mm}} mm above normal depth, <strong>float switches alone see {{float_worst}}% of growth in the worst case</strong>.</p>`,
  },

  // 8 · What we found · Unseen weather
  {
    id: "holdup",
    act: "What we found",
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
    after: `<p class="note">Sensors 1 and 3 stayed in every five-sensor plan the team tested. <strong>The plan has to be chosen across all the weather it will face.</strong></p>`,
  },

  // 9 · Recommendation · The answer
  {
    id: "answer",
    act: "Recommendation",
    kicker: "The answer",
    title: "How many, which type, where",
    view: "all",
    ms: 1400,
    show: { basemap: 0.48, pipes: 0.9, chambers: 0.45 },
    html: `<p>The three questions in the brief, answered from the model.</p>
      <div class="params">
        <div><span class="k">How many</span><span class="v"></span><span class="s">{{plan_k0}} level sensor covers a design wet day; {{plan_k1}} cover wetter weather.</span></div>
        <div><span class="k">Which type</span><span class="v"></span><span class="s">Level sensors. Float switches only warn of spills and saw {{float_worst}}% of growth in the worst case.</span></div>
        <div><span class="k">Where</span><span class="v"></span><span class="s">Monitor {{monitor_regions}} first, starting with Sensor 1 in R3; the five-sensor plan covers {{target_regions}}.</span></div>
      </div>`,
    after: `<p class="note"><strong>Start with Sensor 1, then grow to {{plan_k1}} as budget allows.</strong></p>`,
  },

  // 10 · Recommendation · The first step
  {
    id: "close",
    act: "Recommendation",
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

  // 11 · Recommendation · Cost and benefit
  {
    id: "cost",
    act: "Recommendation",
    kicker: "Cost and benefit",
    title: "What each budget buys",
    view: "all",
    ms: 1400,
    show: { basemap: 0.48, pipes: 0.9, chambers: 0.45 },
    html: `<p>Level sensors at {{level_price}} each (assumed); share of detectable growth seen, worst case first.</p>
      <div class="params">
        <div><span class="k">{{cost_k1}}, 1 sensor</span><span class="v"></span><span class="s">{{worst_k1}}% in the worst case, {{avg_k1}}% on average.</span></div>
        <div><span class="k">{{cost_k3}}, 3 sensors</span><span class="v"></span><span class="s">{{worst_k3}}% in the worst case, {{avg_k3}}% on average.</span></div>
        <div><span class="k">{{cost_k5}}, 5 sensors</span><span class="v"></span><span class="s">{{worst_k5}}% in the worst case, {{avg_k5}}% on average.</span></div>
        <div><span class="k">Float switches only</span><span class="v"></span><span class="s">{{float_cap_count}} switches ({{float_cap_cost}}) reach {{float_worst}}% in the worst case, {{float_avg}}% on average, and more switches add nothing.</span></div>
      </div>`,
    after: `<p class="note">Beyond {{cost_k5}}, <strong>each extra sensor adds little</strong>: {{worst_k6}}% in the worst case at 6 sensors, {{worst_k8}}% at 8.</p>`,
  },

  // 12 · Handover · Project scope
  {
    id: "deliver",
    act: "Handover",
    kicker: "Project scope",
    title: "What the project delivers",
    view: "all",
    ms: 1400,
    show: { basemap: 0.48, pipes: 0.9, chambers: 0.45 },
    html: `<p>Each deliverable in the project scope, and where it sits.</p>
      <div class="params">
        <div><span class="k">D1 Literature review</span><span class="v"></span><span class="s">The sensor review, the team compiled paper and a research library of 58 summarised papers.</span></div>
        <div><span class="k">D2 Parameter catalogue</span><span class="v"></span><span class="s">Network and placement parameters, with evidence for each.</span></div>
        <div><span class="k">D3 and D4 Placement approach and pilot plan</span><span class="v"></span><span class="s">Equal-home regions and the staged plan, applied to Walkerville.</span></div>
        <div><span class="k">D5 Cost and information trade-off</span><span class="v"></span><span class="s">Level sensors against float switches at each budget.</span></div>
        <div><span class="k">D6 to D8 Guidelines, business case and handover</span><span class="v"><span class="chip confirm">to confirm</span></span><span class="s">Covered in the final report.</span></div>
      </div>`,
    after: `<p class="note"><strong>D1 to D5 are in this presentation and the tools.</strong></p>`,
  },

  // 13 · Handover · Files and tools
  {
    id: "handover",
    act: "Handover",
    kicker: "Files and tools",
    title: "What the next team receives",
    view: "all",
    ms: 1400,
    show: { basemap: 0.48, pipes: 0.9, chambers: 0.45 },
    html: `<p>The tool, model and library are public on GitHub.</p>
      <div class="params">
        <div><span class="k">Simulation tool</span><span class="v"></span><span class="s"><a href="https://abrahampaulj.github.io/gravity-sewer-osp/simulation4/index.html" target="_blank" rel="noopener">An online simulation tool</a> and its Python source.</span></div>
        <div><span class="k">Walkerville model</span><span class="v"></span><span class="s">An EPA SWMM 5.2 model of {{sites}} manholes and {{swmm_links}} pipes.</span></div>
        <div><span class="k">Data warehouse</span><span class="v"></span><span class="s">19 datasets and an availability matrix.</span></div>
        <div><span class="k">Research library</span><span class="v"></span><span class="s"><a href="https://siddhu-123.github.io/waste_water_network_sensor-papers/" target="_blank" rel="noopener">58 summarised papers</a> sorted by topic, with a PDF viewer.</span></div>
      </div>`,
    after: `<p class="note"><strong>The next team starts from the same model, data and code.</strong></p>`,
  },

  // 14 · For the next team · What to work on next
  {
    id: "assumed",
    act: "For the next team",
    kicker: "What to work on next",
    title: "What the next team should work on",
    view: "all",
    ms: 1400,
    show: { basemap: 0.55, pipes: 0.85, chambers: 0.5, sensors: 1 },
    legend: "sensors",
    info: { params: "assumed" },
    html: `<p>Every figure comes from an uncalibrated model with a {{rise_focus_mm}} mm rise rule (assumed).</p>
      <div class="params">
        <div><span class="k">Wet-weather level records</span><span class="v"><span class="chip confirm" data-src="infiltration">to confirm</span></span><span class="s">They settle {{plan_k0}} sensor versus {{plan_k1}} ({{sensors_90pct_all_wet}} sensors cover 90% of all {{wet_cases}} wet cases; {{sensors_100pct_all_wet}} cover 100%).</span></div>
        <div><span class="k">Calibrate the model</span><span class="v"><span class="chip declared" data-src="sim4">declared</span></span><span class="s">Test the {{rise_focus_mm}} and {{rise_strict_mm}} mm rules, the {{limit_bore_dec}} limit and the {{float_margin_mm}} mm float height on measured levels; replace prices with quotes.</span></div>
        <div><span class="k">Source the {{homes_2041}}-home projection</span><span class="v"><span class="chip confirm" data-src="sim4">to confirm</span></span><span class="s">Its source is still needed.</span></div>
        <div><span class="k">Sensor failure and precision</span><span class="v"><span class="chip confirm" data-src="sim4">to confirm</span></span><span class="s">The model assumes sensors never fail, and one run shifts a score by {{run_noise_min}} to {{run_noise_max}} percentage points.</span></div>
        <div><span class="k">Another suburb</span><span class="v"></span><span class="s">Needs its pipe map, home projections, pump rates and weather cases.</span></div>
      </div>`,
    after: `<p class="note"><strong>Wet-weather records are the first thing to collect.</strong></p>`,
  },
];
