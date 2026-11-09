// Scene-by-scene copy and camera cues for the Walkerville Simulation 3.5 guided client deck.
// Numbers come from demo/story-data.js (S.facts) and window.OSP_STATIC below, filled in with {{key}}.

window.OSP_STATIC = {
  project_no: 2669,
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
        <span>Project #{{project_no}} · {{uni_name}}</span>
      </div>
      <div class="w-body">
        <div class="w-eyebrow">Town of Walkerville · {{model_version}}</div>
        <h1>Where growth uses up pipe buffer, and where to place sensors first.</h1>
        <p class="w-sub">A guided walk-through of the team's {{model_version}} hydraulic study: which drainage regions run out of capacity first as 2041 infill homes arrive, why continuous level sensors outperform float switches when weather changes, and which five manholes cover the suburb.</p>
        <div class="w-actions">
          <button type="button" class="w-cta" data-go>Begin the walk-through <span aria-hidden="true">→</span></button>
          <span class="w-hint">Use <kbd>→</kbd> or <kbd>Space</kbd>, <kbd>T</kbd> for dark mode, <kbd>F</kbd> for fullscreen</span>
        </div>
      </div>
      <div class="w-foot">
        <div><b>Prepared by the team</b><span>Abraham Paul Jaison · Ashis Jose Kalathil · Deinmodeimas Siloko · Rijoy John · Satya Siddhartha · Wimukthiikawa</span></div>
        <div><b>Industry partner</b><span>SA Water · Capstone Project #{{project_no}}</span></div>
        <div><b>Data</b><span>Location SA · PlanSA · ABS · Walkerville GIS · EPA SWMM 5.2</span></div>
      </div>`,
  },

  // 1 · Problem: growth loads old pipes
  {
    id: "infill",
    act: "Problem",
    kicker: "1 · Growth on an ageing network",
    title: "New infill homes connect into century-old clay street pipes.",
    view: "all",
    style: "age",
    show: { basemap: 0.55, pipes: 1, homes: 0.65 },
    fx: "infill",
    legend: "age",
    stats: [
      ["{{median_pipe_year}}", "median pipe install year ({{pre1960_pct}}% laid before 1960)"],
      ["{{homes_2041}}", "new Walkerville dwellings projected by 2041", "accent"],
    ],
    html: `
      <p>Walkerville's <b>{{homes}}</b> connected properties drain through <b>{{network_km}} km</b> of gravity sewers that are <b>{{clay_pct}}%</b> vitrified clay and <b>{{small_pipe_pct}}%</b> narrow 150 mm street mains.</p>
      <p>Adding <b>{{homes_2041}}</b> projected infill dwellings by 2041 feeds extra sewage into those existing streets while rainwater already leaks in through ageing joints.</p>`,
  },

  // 2 · Problem: overflow records hide gradual growth
  {
    id: "overflow",
    act: "Problem",
    kicker: "2 · Why overflow records hide growth",
    title: "When a pipe fills, sewage backs up upstream long before a lid lifts.",
    view: "side",
    ms: 2100,
    style: "path",
    show: { basemap: 0.08, terrain: 0.85, pipes: 0.95, shafts: 0.95, flow: 1, pumps: 0.9 },
    fx: "fall",
    legend: "pumps",
    html: `
      <p>Gravity carries flow down a <b>{{path_fall_m}} m</b> fall across <b>{{path_km}} km</b>; once a downstream pipe reaches capacity, water banks up into upstream manholes first.</p>
      <p>Historical overflow logs mainly record sudden blockages and severe storms, hiding slow housing creep until pipe buffer is already gone.</p>`,
  },

  // 3 · Problem (Why before what): business case for when to start monitoring as homes are added
  {
    id: "room",
    act: "Problem",
    kicker: "3 · Business case: when to start monitoring",
    title: "Two of the eight drainage regions run out of pipe buffer before 2041.",
    view: "all",
    style: "stress",
    show: { basemap: 0.38, pipes: 1, chambers: 0.25 },
    fx: "stress",
    seg: [0, 1, 2],
    readout: true,
    legend: "stress",
    info: { params: "stress" },
    html: `
      <p>Before placing sensors, {{model_version}} checks how many new homes each of the <b>{{regions}}</b> drainage regions can take before a pipe along its path reaches <b>{{limit_bore}}%</b> of pipe height (<span class="chip declared" data-src="infiltration">{{limit_bore_dec}} of bore</span>, tested across <b>{{cap_draws}}</b> starting-level error draws).</p>
      <p>On a design-wet day, north-east regions <b>R1</b> and <b>R2</b> run out of buffer well inside their 2041 housing share and need monitoring first; four regions still have room left.</p>
      <div class="params">
        <div class="p"><b>R1 · Upper main (NE)</b><span><b>{{r1_range}} homes</b> to 0.7 limit (2041 share: {{r1_homes}}; +{{r1_rise}} mm / 100 homes)</span><span class="chip confirm" data-src="infiltration">runs out</span></div>
        <div class="p"><b>R2 · East branch</b><span><b>{{r2_range}} homes</b> to 0.7 limit (2041 share: {{r2_homes}}; +{{r2_rise}} mm / 100 homes)</span><span class="chip confirm" data-src="infiltration">runs out</span></div>
        <div class="p"><b>R4 · East &amp; R8 · Terrace</b><span>R4: <b>{{r4_range}}</b> (share {{r4_homes}}) · R8: <b>{{r8_range}}</b> (share {{r8_homes}})</span><span class="chip declared" data-src="infiltration">uncertain</span></div>
        <div class="p"><b>R3, R5, R6, R7</b><span>R3: {{r3_range}} · R5: {{r5_range}} · R6: {{r6_range}} · R7: {{r7_range}} homes</span><span class="chip checked" data-src="infiltration">room left</span></div>
      </div>`,
  },

  // 4 · The question: how many sensors, which type, where
  {
    id: "question",
    act: "Question",
    kicker: "4 · The monitoring question",
    title: "Where buffer is tight, how many sensors, which type, and at which manholes?",
    view: "tilt",
    ms: 1900,
    show: { basemap: 0.55, terrain: 0.45, pipes: 0.95, chambers: 1 },
    fx: "brief",
    stats: [
      ["{{sites}}", "modelled manholes ({{manholes_published}} published)"],
      ["{{regions}}", "drainage regions ({{homes_2041}} projected homes)", "accent"],
    ],
    html: `
      <p>Once growth pushes a region toward its pipe ceiling, operators need early warning before the first manhole surcharges.</p>
      <p>Across <b>{{sites}}</b> candidate manholes, the decision is how many devices to buy, whether to use continuous <span class="cite" data-src="levelsensor">level sensors</span> or <span class="cite" data-src="brieftype">float switches</span>, and where to place them.</p>`,
  },

  // 5 · Method 1: SWMM model, 8 regions, 7 build-out steps, 8 weather cases
  {
    id: "swmm",
    act: "Method",
    kicker: "5 · Hydraulic simulation",
    title: "{{model_version}} tests {{regions}} regions across {{steps}} build-out steps and {{cases}} weather cases.",
    view: "tilt2",
    ms: 1900,
    show: { basemap: 0.3, terrain: 0.55, pipes: 0.75, shafts: 0.55, water: 1 },
    fx: "rain",
    seg: [0, 1, 2],
    readout: true,
    legend: "water",
    stats: [
      ["{{regions}} × {{steps}} × {{cases}}", "regional growth grid ({{regions}} regions × {{steps}} steps × {{cases}} cases)"],
      ["{{suburb_runs}}", "whole-suburb runs across 7 build-out steps", "accent"],
    ],
    html: `
      <p>The team built an <span class="cite" data-src="swmmlevel">EPA SWMM 5.2</span> dynamic-wave model of <b>{{sites}}</b> manholes and <b>{{swmm_links}}</b> pipe links, scaling each of the <b>{{regions}}</b> regions across <b>{{steps}}</b> steps (10% to 300% of its 2041 housing share).</p>
      <p>Every step is settled across <b>{{cases}}</b> weather and leakage cases (one dry day and <b>{{wet_cases}}</b> wet-weather infiltration cases from <b>{{ii_design}}</b> to <b>{{ii_severe}} L/s per 100 m</b>).</p>`,
  },

  // 6 · Method 2: Early warning score before surcharge
  {
    id: "sees",
    act: "Method",
    kicker: "6 · Early-warning rule",
    title: "A sensor earns credit only if it rises {{rise_focus_mm}} mm at least one step before surcharge.",
    view: (V) => V.close(V.phase1(1), 240, { pitch: 60, bearing: -38 }),
    ms: 1900,
    show: { basemap: 0.28, terrain: 0.65, pipes: 0.9, chambers: 0.7, sensors: 1, resp: 1, spikes: 1 },
    fx: "sees",
    gauge: true,
    info: { gauge: "gauge" },
    html: `
      <p>Of the <b>{{sim3_seen_runs}}</b> growth runs credited to five sensors in the previous model, <b>{{sim3_late_runs}} ({{sim3_late_pct}}%)</b> already had a newly surcharged manhole.</p>
      <p>{{model_version}} scores whether a sensor rises <b>{{rise_focus_mm}} mm</b> above its normal baseline at least one build-out step <i>before</i> the first new surcharge (<b>{{plausible_overloads}}</b> plausible overloads by 100% build-out, <b>{{total_overloads}}</b> including stress steps).</p>`,
  },

  // 7 · Sim 3.5 Results: how many sensors, where, and what they catch
  {
    id: "answer",
    act: "Results",
    kicker: "7 · {{model_version}} sensor placement",
    title: "Five level sensors warn of {{warn_k5_weather}} of {{plausible_overloads}} plausible overloads on unseen weather.",
    view: "p1",
    ms: 1800,
    show: { basemap: 0.55, pipes: 0.9, chambers: 0.55, sensors: 1 },
    fx: "answer",
    legend: "plan1",
    info: { stats: "answerstats" },
    stats: [
      ["{{warn_k5_weather}} / {{plausible_overloads}}", "plausible overloads warned on unseen weather ({{warn_k5_plausible}} / {{plausible_overloads}} in-sample)", "accent"],
      ["{{detect_k5_worst}}%", "worst-case wet growth seen ({{detect_k5_mean}}% wet-case average)"],
    ],
    html: `
      <p>Three level sensors (<b>{{warn_k3_cost}}</b>) warn before all <b>{{warn_k3_plausible}} of {{plausible_overloads}}</b> plausible overloads on the runs they were chosen on.</p>
      <p>Five level sensors (<b>{{warn_k5_cost}}</b>) hold <b>{{warn_k5_weather}} of {{plausible_overloads}}</b> warnings on unseen weather (<b>{{warn_k5_region}} of {{plausible_overloads}}</b> on an unseen region) and detect <b>{{detect_k5_worst}}%</b> of wet-weather growth in the worst case (<b>{{detect_k5_mean}}%</b> average).</p>`,
  },

  // 8 · Sim 3.5 Results: which sensor covers which region
  {
    id: "roles",
    act: "Results",
    kicker: "8 · Regional coverage",
    title: "Each sensor sits where a drainage region feeds into the trunk main.",
    view: "p1",
    ms: 1700,
    show: { basemap: 0.45, terrain: 0.35, pipes: 0.95, chambers: 0.4, sensors: 1, flow: 0.65 },
    fx: "roles",
    legend: "plan1",
    html: `
      <p>Sensors 1 to 3 watch the north-east, east and central branches (<b>R1</b>, <b>R2/R4</b> and <b>R5</b>), catching every in-sample overload one build-out step early.</p>
      <p>Sensors 4 and 5 add the <b>R1–R2</b> trunk junction and south-west branch <b>R6</b>, lifting worst-case wet growth detection from <b>{{warn3_detect_worst}}%</b> to <b>{{warn5_detect_worst}}%</b> (and <b>{{detect_k5_worst}}%</b> with the detection-optimised five).</p>
      <div class="params">
        <div class="p"><b>1 · MH4449173</b><span><b>R1 (North-east)</b> · watches 48 upstream manholes ({{r1_homes}} projected homes)</span></div>
        <div class="p"><b>2 · MH4450531</b><span><b>R2 &amp; R4 (East)</b> · watches 40 branch manholes (72 projected homes; first pipe to hit 0.7)</span></div>
        <div class="p"><b>3 · MH4452541</b><span><b>R5 (Central)</b> · watches 19 branch manholes and central trunk backwater</span></div>
        <div class="p"><b>4 · MH4450922</b><span><b>R1–R2 Trunk (R7/R8)</b> · watches 134 upstream manholes below R1 and R2</span></div>
        <div class="p"><b>5 · MH4454629</b><span><b>R6 (South-west)</b> · watches 14 branch manholes ({{r6_homes}} projected homes)</span></div>
      </div>`,
  },

  // 9 · Sim 3.5 Results: level sensors vs float switches
  {
    id: "floats",
    act: "Results",
    kicker: "9 · Level sensors vs float switches",
    title: "On unseen weather, a {{float_25_count}}-float budget ({{float_25_bought}} floats bought) drops to {{float_25_unseen_wx}}% while one level sensor holds {{level_1_unseen_wx}}%.",
    view: "beats",
    ms: 1700,
    show: { basemap: 0.45, pipes: 0.85, chambers: 0.4, sensors: 1, trunk: 0.95 },
    fx: "beats",
    chart: "beats",
    legend: "beats",
    info: { chart: "beats" },
    html: `
      <p>At assumed prices of <b>{{level_price}}</b> per level sensor and <b>{{float_price}}</b> per float switch, a <b>{{float_25_count}}-float budget</b> (<b>{{float_25_cost}}</b>) buys <b>{{float_25_bought}} floats</b> ($22,000) that average <b>{{float_25_avg}}%</b> on the weather they were tuned on, but fall to <b>{{float_25_unseen_wx}}%</b> detection and <b>{{float_warn_unseen_wx}}%</b> warning on unseen weather.</p>
      <p>A float switch trips at one fixed height while normal water depth moves with rainfall; one level sensor (<b>{{level_price}}</b>) holds <b>{{level_1_unseen_wx}}%</b> on unseen weather and five (<b>{{warn_k5_cost}}</b>) hold <b>{{detect_k5_unseen_wx}}%</b>.</p>`,
  },

  // 10 · Sim 3.5 Results: how many sensors (1 to 10 frontier)
  {
    id: "howmany",
    act: "Results",
    kicker: "10 · How many sensors to install",
    title: "Three sensors cover in-sample warnings; five balance unseen weather and growth.",
    view: "plan",
    ms: 1700,
    show: { basemap: 0.5, pipes: 0.85, chambers: 0.45, sensors: 1, phase2: 0.95 },
    chart: "frontier",
    legend: "plan",
    info: { chart: "frontier" },
    html: `
      <p>Unseen-weather overload warning reaches <b>{{warn_k5_weather_all}}%</b> (<b>{{warn_k5_weather}} of {{plausible_overloads}}</b> plausible overloads) at three to six sensors, while worst-case wet growth detection climbs from <b>{{warn3_detect_worst}}%</b> at three sensors to <b>{{warn5_detect_worst}}%</b> at five.</p>
      <p>Adding five phase-2 sensors (ten in total) lifts unseen-weather warnings to <b>{{warn_k10_weather}} of {{plausible_overloads}} ({{warn_k10_weather_all}}%)</b> and worst-case growth detection to <b>{{warn10_detect_worst}}%</b>.</p>`,
  },

  // 11 · Sim 3.5 Results: unseen weather & region holdout
  {
    id: "holdout",
    act: "Results",
    kicker: "11 · Unseen weather and region check",
    title: "Left-out wet cases still see {{detect_k5_unseen_wx}}% of growth and {{warn_k5_weather}} of {{plausible_overloads}} warnings.",
    view: "p1",
    ms: 1600,
    show: { basemap: 0.45, pipes: 0.9, chambers: 0.4, sensors: 1 },
    chart: "holdout",
    legend: "plan1",
    info: { chart: "holdout" },
    html: `
      <p>When five level sensors are chosen on six wet cases and scored on the seventh left-out case, growth detection averages <b>{{detect_k5_unseen_wx}}%</b> (against <b>{{detect_k5_mean}}%</b> in-sample) and overload warning holds at <b>{{warn_k5_weather}} of {{plausible_overloads}}</b>.</p>
      <p>Holding out an entire drainage region leaves <b>{{detect_k5_unseen_reg}}%</b> growth detection and <b>{{warn_k5_region}} of {{plausible_overloads}}</b> plausible overload warnings (<b>{{warn_k5_region_all}}%</b> across all <b>{{total_overloads}}</b> overloads).</p>`,
  },

  // 12 · Greenfield: estates join only trunk mains of 225 mm or more
  {
    id: "greenfield",
    act: "Greenfield",
    kicker: "12 · Greenfield estates vs infill",
    title: "Greenfield estates join only trunk mains of {{trunk_min_mm}} mm or more.",
    view: (V) => V.close(V.phase1(3), 420, { pitch: 48, bearing: -24 }),
    ms: 1800,
    style: "size",
    show: { basemap: 0.35, terrain: 0.5, pipes: 1, chambers: 0.5, sensors: 0.9 },
    fx: "pipes",
    legend: "size",
    stats: [
      ["{{trunk_min_mm}} mm+", "minimum trunk diameter for greenfield estates", "accent"],
      ["{{trunk_pipe_pct}}%", "of Walkerville pipes are {{trunk_min_mm}} to 450 mm trunk mains"],
    ],
    html: `
      <p>Unlike infill housing that trickles into <b>{{small_pipe_pct}}%</b> of 150 mm street mains, a greenfield estate builds new internal sewers and joins the existing network only at a trunk main of <b>{{trunk_min_mm}} mm or larger</b>.</p>
      <p>Monitoring for a greenfield development therefore belongs on the receiving <b>{{trunk_min_mm}}–450 mm</b> trunk main rather than inside upstream 150 mm street branches.</p>`,
  },

  // 13 · Limits and what waits on real network data
  {
    id: "register",
    act: "Limits",
    kicker: "13 · Limits and what waits on real data",
    title: "Detection thresholds and pipe buffer wait on normal-day level records.",
    view: "all",
    ms: 1700,
    show: { basemap: 0.55, pipes: 0.85, chambers: 0.5, pumps: 0.85, sensors: 0.9 },
    fx: "register",
    legend: "pumps",
    info: { params: "register" },
    html: `
      <p>Tightening the rise rule from <b>{{rise_focus_mm}} mm</b> to <b>{{rise_strict_mm}} mm</b> cuts five-sensor unseen-weather warnings from <b>{{warn_k5_weather}} of {{plausible_overloads}}</b> to <b>{{warn25_k5_weather}} of {{plausible_overloads}}</b> (and <b>{{warn25_k5_region}} of {{plausible_overloads}}</b> on an unseen region).</p>
      <p>All figures come from uncalibrated steady-flow runs; field deployment waits on normal-day level logs, pipe capacity ratings, pump rates and overflow records.</p>
      <div class="params">
        <div class="p"><b>Rise rule ({{rise_focus_mm}} vs {{rise_strict_mm}} mm)</b><span>Moves unseen-weather warnings from {{warn_k5_weather}}/{{plausible_overloads}} to {{warn25_k5_weather}}/{{plausible_overloads}}; needs normal-day level logs</span><span class="chip confirm" data-src="levelsensor">confirm</span></div>
        <div class="p"><b>Pipe limit ({{limit_bore_dec}} of bore ± {{limit_err_mm}} mm)</b><span>Shifts R2, R7 and R8 outlook if tightened to 0.6; needs per-pipe capacity ratings</span><span class="chip declared" data-src="infiltration">declared</span></div>
        <div class="p"><b>Float clearance ({{float_margin_mm}} mm margin)</b><span>Cutting margin to 10 mm lifts floats to 25% / 59% in-sample, but unseen weather stays at 10%</span><span class="chip declared" data-src="alarm">declared</span></div>
        <div class="p"><b>Steady flows &amp; ideal pumps</b><span>Constant loads and pass-through pumps; needs hydrographs, pump rates and overflow history</span><span class="chip ideal" data-src="pumps">ideal</span></div>
      </div>`,
  },

  // 14 · Close
  {
    id: "close",
    act: "Close",
    kicker: "14 · Decision summary",
    title: "Start monitoring in R1 and R2; five level sensors cover Walkerville as it grows.",
    view: "plan",
    ms: 1800,
    show: { basemap: 0.55, pipes: 0.95, chambers: 0.4, sensors: 1, phase2: 0.85 },
    fx: "close",
    legend: "plan",
    stats: [
      ["{{warn_k3}} → {{plan_k1}}", "level sensors ({{warn_k3_cost}} in-sample; {{warn_k5_cost}} across unseen weather)", "accent"],
      ["R1 & R2", "first regions to monitor ({{r1_range}} and {{r2_range}} homes to 0.7 limit)"],
    ],
    html: `
      <p>North-east regions <b>R1</b> and <b>R2</b> use up their <b>{{limit_bore}}%</b> pipe buffer well within their 2041 housing share, giving a clear business case to begin monitoring there first with <b>{{warn_k3}} to {{plan_k1}}</b> continuous level sensors.</p>
      <p>The team's SWMM and placement pipeline is open and repeatable: once normal-day level logs and pipe ratings are plugged in, it re-solves sensor locations directly.</p>`,
  },
];
