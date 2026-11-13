// Scene-by-scene copy and camera cues for the Walkerville Simulation 4 guided client deck.
// Numbers come from demo/sim4-facts.js (window.OSP_SIM4.facts) and window.OSP_STATIC below, filled in with {{key}}.

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
        <h1>Where growth uses up pipe capacity, and where to place sensors first.</h1>
        <p class="w-sub">A guided walk-through of the team's {{model_version}} hydraulic study across {{sites}} manholes and {{swmm_links}} pipes: which of the {{regions}} regions need monitoring as {{homes_2041}} new homes arrive by 2041, how {{plan_k0}} or {{plan_k1}} continuous level sensors perform across wet weather, and why float switches fall short.</p>
        <div class="w-actions">
          <button type="button" class="w-cta" data-go>Begin the walk-through <span aria-hidden="true">→</span></button>
          <span class="w-hint">Use <kbd>→</kbd> or <kbd>Space</kbd>, <kbd>T</kbd> for dark mode, <kbd>F</kbd> for fullscreen</span>
        </div>
      </div>
      <div class="w-foot">
        <div><b>Prepared by the team</b><span>Abraham Paul Jaison, Ashis Jose Kalathil, Rijoy John, Satya Siddhartha Balanagu, Wimukthi Rajapaksha</span></div>
        <div><b>Industry partner</b><span>SA Water · Capstone Project #{{project_no}}</span></div>
        <div><b>Data</b><span>Location SA · PlanSA · ABS · Walkerville GIS · EPA SWMM 5.2</span></div>
      </div>`,
  },

  // 1 · Step 1: The network
  {
    id: "infill",
    act: "Step 1 · Network",
    kicker: "1 · Step 1: The network",
    title: "{{swmm_links}} pipes and {{sites}} manholes, with {{homes_2041}} new homes coming by 2041.",
    view: "all",
    style: "age",
    show: { basemap: 0.55, pipes: 1, homes: 0.65 },
    fx: "infill",
    legend: "age",
    stats: [
      ["{{swmm_links}} / {{sites}}", "{{swmm_links}} pipes and {{sites}} manholes serving {{homes}} connections"],
      ["{{homes_2041}}", "new Walkerville homes projected by 2041", "accent"],
    ],
    html: `
      <p><b>What we did:</b> We modelled Walkerville's <b>{{swmm_links}}</b> gravity sewer pipes and <b>{{sites}}</b> manholes in <span class="cite" data-src="swmmlevel">EPA SWMM 5.2</span> across <b>{{homes}}</b> existing property connections, with <b>{{homes_2041}}</b> new homes coming by 2041.</p>
      <p><b>The question:</b> As infill housing connects into the suburb's pipes, what data shows growth using up pipe capacity, and at which manholes should a manager collect it?</p>`,
  },

  // 2 · Step 1b: Why level monitoring before surcharge matters
  {
    id: "overflow",
    act: "Step 1 · Network",
    kicker: "2 · Step 1: Reading the warning sign",
    title: "Surcharge—water rising above the pipe top—is the warning sign before an overflow.",
    view: "side",
    ms: 2100,
    style: "path",
    show: { basemap: 0.08, terrain: 0.85, pipes: 0.95, shafts: 0.95, flow: 1, pumps: 0.9 },
    fx: "fall",
    legend: "pumps",
    html: `
      <p><b>How the network behaves:</b> Sewage drains by gravity toward the suburb outlet (assisted by <b>{{modelled_pumps}}</b> modelled pump stations). Once a downstream pipe fills, water backs up into upstream manholes before any lid spills at the street.</p>
      <p><b>The warning sign:</b> A manhole is <i>surcharged</i> when water rises above the pipe top. {{model_version}} tests whether sensors detect a <b>{{rise_focus_mm}} mm</b> water-level rise (assumed rule, also checked at <b>{{rise_strict_mm}} mm</b>) and warn at least one build-out step before a manhole newly surcharges.</p>`,
  },

  // 3 · Step 2: A design wet day, today
  {
    id: "today",
    act: "Step 2 · Today",
    kicker: "3 · Step 2: A design wet day, today",
    title: "Before any new homes, {{base_surcharged_design}} manholes surcharge on a design wet day and {{base_surcharged_wetter}} on a much wetter day.",
    view: "tilt2",
    ms: 1900,
    show: { basemap: 0.3, terrain: 0.55, pipes: 0.75, shafts: 0.55, water: 1 },
    fx: "rain",
    seg: [0, 1, 2],
    readout: true,
    legend: "water",
    stats: [
      ["{{base_surcharged_design}}", "manholes surcharged today on a design wet day ({{base_spilled_design}} spill)"],
      ["{{base_surcharged_wetter}}", "manholes surcharged today on a much wetter day", "accent"],
    ],
    html: `
      <p><b>What we did:</b> Before adding any 2041 homes, we ran the baseline network across <b>{{cases}}</b> weather cases: one dry day and <b>{{wet_cases}}</b> wet-weather rainwater leakage cases (<span class="cite" data-src="infiltration">{{ii_design}} to {{ii_severe}}</span>).</p>
      <p><b>The result:</b> On a design wet day today, the model already has <b>{{base_surcharged_design}}</b> manholes surcharged and <b>{{base_spilled_design}}</b> spilling. On a much wetter day, it has <b>{{base_surcharged_wetter}}</b> surcharged, so wet weather alone already matters.</p>`,
  },

  // 4 · Step 3a: How the 9 regions are cut
  {
    id: "regions",
    act: "Step 3 · Growth",
    kicker: "4 · Step 3: Cutting the suburb into {{regions}} regions",
    title: "Eight equal-home regions plus the Walkerville Terrace corridor test growth region by region.",
    view: "tilt",
    ms: 1900,
    show: { basemap: 0.55, terrain: 0.45, pipes: 0.95, chambers: 1 },
    fx: "brief",
    stats: [
      ["{{equal_regions}} + 1", "{{equal_regions}} equal-home regions (Kim et al., 2022) plus R9 corridor", "accent"],
      ["{{region_homes_min}}–{{region_homes_max}}", "existing homes in each of the {{equal_regions}} branch cuts"],
    ],
    html: `
      <p><b>What we did:</b> Instead of hand-picked boundaries, {{model_version}} cuts Walkerville into <b>{{equal_regions}}</b> regions holding near-equal numbers of existing homes using three rounds of spatial bisection (<span class="cite" data-src="kim2022">Kim et al., 2022</span>), plus <b>R9</b>, the Walkerville Terrace corridor overlapping them (<b>{{regions}}</b> regions in total).</p>
      <p><b>How the cut works:</b> Each round cuts at the pipe that leaves the most nearly equal number of homes on either side. Because a cut takes a whole pipe branch, the <b>{{equal_regions}}</b> regions hold <b>{{region_homes_min}} to {{region_homes_max}}</b> existing homes rather than <b>{{region_homes_ideal}}</b> each.</p>`,
  },

  // 5 · Step 3b: Add the 2041 homes
  {
    id: "growth",
    act: "Step 3 · Growth",
    kicker: "5 · Step 3: Add the 2041 homes",
    title: "Five regions raise water {{rise_focus_mm}} mm or more; four do not, and no manhole newly surcharges on a design wet day.",
    view: (V) => V.close(V.phase1(0), 260, { pitch: 60, bearing: -38 }),
    ms: 1900,
    show: { basemap: 0.28, terrain: 0.65, pipes: 0.9, chambers: 0.7, sensors: 1, resp: 1, spikes: 1 },
    fx: "sees",
    gauge: true,
    info: { gauge: "gauge" },
    html: `
      <p><b>What we did:</b> Each region's 2041 homes are added on their own, step by step up to full 2041 build-out, with <b>{{wet_runs_100}}</b> wet-case runs.</p>
      <p><b>The result:</b> On a design wet day, <b>{{target_regions}}</b> raise the water <b>{{rise_focus_mm}} mm</b> or more (assumed rule) in at least one manhole, often downstream where their flow joins the main; <b>{{quiet_regions}}</b> do not. At full 2041 build-out on a design wet day, no manhole newly surcharges and none spills (across all <b>{{wet_cases}}</b> wet cases, <b>{{new_surcharge_rows}}</b> of <b>{{wet_runs_100}}</b> runs show a new surcharge and <b>{{new_spill_rows}}</b> a new spill, giving <b>{{warn_total}}</b> overloads).</p>`,
  },

  // 6 · Step 4: Decide where to look (Triage)
  {
    id: "triage",
    act: "Step 4 · Triage",
    kicker: "6 · Step 4: Decide where to look",
    title: "Monitor {{monitor_regions}}, watch {{watch_regions}}, and leave {{leave_regions}}.",
    view: "all",
    style: "stress",
    show: { basemap: 0.38, pipes: 1, chambers: 0.25 },
    fx: "stress",
    seg: [0, 1, 2],
    readout: true,
    legend: "stress",
    info: { params: "stress" },
    html: `
      <p><b>What we did:</b> On a design wet day, we checked how many new homes each region takes before a pipe reaches an assumed limit of <b>{{limit_bore_dec}} of bore ({{limit_bore}}%)</b>.</p>
      <p><b>The result:</b> Monitor <b>{{monitor_regions}}</b> (likely to reach the pipe limit by 2041), watch <b>{{watch_regions}}</b> (could go either way), and leave <b>{{leave_regions}}</b> (room left). Not monitoring is a valid answer if a design wet day is the right test.</p>
      <div class="params">
        <div class="p"><b>Monitor · R3 &amp; R7 (runs out)</b><span>R3: <b>{{r3_range}} homes</b> to 0.7 limit (2041: {{r3_homes}}) · R7: <b>{{r7_range}} homes</b> (2041: {{r7_homes}})</span><span class="chip confirm" data-src="infiltration">monitor</span></div>
        <div class="p"><b>Watch · R1 &amp; R4 (uncertain)</b><span>R1: <b>{{r1_range}} homes</b> (2041: {{r1_homes}}) · R4: <b>{{r4_range}} homes</b> (2041: {{r4_homes}})</span><span class="chip declared" data-src="infiltration">watch</span></div>
        <div class="p"><b>Watch · R9 Terrace corridor</b><span>R9: <b>{{r9_range}} homes</b> to 0.7 limit (2041 anchor: {{r9_homes}} homes across {{r9_existing}} existing)</span><span class="chip declared" data-src="infiltration">watch</span></div>
        <div class="p"><b>Leave · R2, R5, R6 &amp; R8 (room left)</b><span>R2: {{r2_range}} (2041: {{r2_homes}}) · R5 ({{r5_homes}}), R6 ({{r6_homes}}), R8 ({{r8_homes}}): {{r5_range}}</span><span class="chip checked" data-src="infiltration">leave</span></div>
      </div>`,
  },

  // 7 · Step 5a: Place sensors, if the design day is right (k = 1)
  {
    id: "sensor1",
    act: "Step 5 · Sensors",
    kicker: "7 · Step 5a: Place sensors, if the design day is right",
    title: "One sensor at {{sensor_1_id}} ({{cost_k1}}) sees all {{design_wet_k1_seen}} of {{design_wet_runs}} growth runs on a design wet day, but {{avg_k1}}% across all {{wet_cases}} wet cases.",
    view: (V) => V.close(V.phase1(0), 420, { pitch: 46, bearing: -24 }),
    ms: 1800,
    show: { basemap: 0.52, pipes: 0.92, chambers: 0.55, sensors: 1 },
    fx: "sensor1",
    legend: "plan1",
    stats: [
      ["{{design_wet_k1_seen}} / {{design_wet_runs}}", "target-region growth runs seen on a design wet day ({{design_wet_k1_pct}}%)", "accent"],
      ["{{avg_k1}}%", "average across all {{wet_cases}} wet cases ({{worst_k1}}% worst case, {{warn_k1}} of {{warn_total}} warned)"],
    ],
    html: `
      <p><b>What we did:</b> We asked for the fewest continuous <span class="cite" data-src="levelsensor">level sensors</span> needed to watch the five target regions (<b>{{target_regions}}</b>) if a design wet day is the right test.</p>
      <p><b>The result:</b> Just <b>{{plan_k0}} sensor</b> at manhole <b>{{sensor_1_id}}</b> (<b>{{cost_k1}}</b> at assumed prices) listens to <b>{{target_regions}}</b> on a design wet day, reacts to <b>{{sensor_1_reacts}}</b>, and sees all <b>{{design_wet_k1_seen}} of {{design_wet_runs}} ({{design_wet_k1_pct}}%)</b> growth runs. In other wet weather it falls short: <b>{{avg_k1}}%</b> on average across the <b>{{wet_cases}}</b> wet cases (<b>{{worst_k1}}%</b> worst case, <b>{{unseen_wx_k1}}%</b> on unseen weather).</p>`,
  },

  // 8 · Step 5b: Place sensors, if the weather is unknown (k = 5)
  {
    id: "sensor5",
    act: "Step 5 · Sensors",
    kicker: "8 · Step 5b: Place sensors, if the weather is unknown",
    title: "Five level sensors ({{cost_k5}}) see {{avg_k5}}% on average, {{worst_k5}}% in the worst case, and warn of all {{warn_k5}} of {{warn_total}} overloads.",
    view: "p1",
    ms: 1800,
    show: { basemap: 0.48, terrain: 0.35, pipes: 0.95, chambers: 0.45, sensors: 1, flow: 0.65 },
    fx: "roles",
    legend: "plan1",
    info: { stats: "answerstats" },
    stats: [
      ["{{worst_k5}}% / {{avg_k5}}%", "worst-case / average growth seen across {{wet_cases}} wet cases", "accent"],
      ["{{warn_k5}} of {{warn_total}}", "overloads warned before surcharge ({{unseen_wx_k5}}% seen on unseen weather)"],
    ],
    html: `
      <p><b>The result for unknown weather:</b> Keeping <b>{{sensor_1_id}}</b> and adding <b>{{save_sensors}}</b> more level sensors (<b>{{cost_k5}}</b> at assumed prices) sees <b>{{avg_k5}}%</b> of target-region growth runs on average and <b>{{worst_k5}}%</b> in the worst wet case, and warns of all <b>{{warn_k5}} of {{warn_total}}</b> overloads.</p>
      <div class="params">
        <div class="p"><b>1 · {{sensor_1_id}} (Design wet)</b><span>Listens to {{target_regions}}; reacts at {{sensor_1_reacts}}. Without it: 62% worst / 85% avg (4 stand-ins)</span></div>
        <div class="p"><b>2 · {{sensor_2_id}} (Wetter weather)</b><span>R1 in 5/7 and R4 in 5/7 wet cases; under 10 mm on Design wet. Without it: 38% worst / 79% avg, 9/11 warned (0 stand-ins)</span></div>
        <div class="p"><b>3 · {{sensor_3_id}} (Age-weighted)</b><span>Reacts at {{sensor_3_reacts}}; only sensor here seeing age-weighted Design wet; surcharged before growth (worth a site check). Without it: 0% worst / 80% avg (3 stand-ins)</span></div>
        <div class="p"><b>4 · {{sensor_4_id}} (Sits in R2)</b><span>Catches through-flow from R9 (4/7 wet cases) and R3 (2/7). Without it: 56% worst / 88% avg (23 stand-ins)</span></div>
        <div class="p"><b>5 · {{sensor_5_id}} (Wetter weather)</b><span>R1 in 1/7 and R4 in 1/7 wet cases. Without it: 69% worst / 92% avg (0 stand-ins)</span></div>
      </div>`,
  },

  // 9 · Step 5c: The 1-to-8 ladder and unseen weather / region holdout
  {
    id: "holdout",
    act: "Step 5 · Sensors",
    kicker: "9 · Step 5: The sensor ladder and holdout checks",
    title: "Chosen without the weather or region tested, {{plan_k1}} sensors still see {{unseen_wx_k5}}% and {{unseen_reg_k5}}% of growth.",
    view: "plan",
    ms: 1700,
    show: { basemap: 0.5, pipes: 0.85, chambers: 0.45, sensors: 1, phase2: 0.95 },
    chart: "frontier",
    legend: "plan",
    info: { chart: "frontier" },
    html: `
      <p><b>The 1-to-8 ladder:</b> Adding sensors one by one lifts worst / average wet-case coverage from <b>{{worst_k1}}% / {{avg_k1}}%</b> (1 sensor, <b>{{cost_k1}}</b>) and <b>{{worst_k2}}% / {{avg_k2}}%</b> (2 sensors, <b>{{cost_k2}}</b>, <b>{{warn_total}} of {{warn_total}}</b> warned) to <b>{{worst_k3}}% / {{avg_k3}}%</b> (3, <b>{{cost_k3}}</b>), <b>{{worst_k4}}% / {{avg_k4}}%</b> (4, <b>{{cost_k4}}</b>), <b>{{worst_k5}}% / {{avg_k5}}%</b> (5, <b>{{cost_k5}}</b>), and <b>{{worst_k8}}% / {{avg_k8}}%</b> at 8 sensors (<b>{{cost_k8}}</b>). At least <b>{{tied_sets_k5}}</b> five-sensor sets tie for best on Design wet, so read this list as one good choice, not the only one.</p>
      <p><b>How it holds up:</b> On weather they were not chosen for, <b>{{plan_k1}}</b> sensors see <b>{{unseen_wx_k5}}%</b> (<b>{{unseen_wx_warn_k5}} of {{warn_total}}</b> warned). On an unseen region they see <b>{{unseen_reg_k5}}%</b> (<b>{{unseen_reg_warn_k5}} of {{warn_total}}</b> warned) against <b>{{random_resp_k5}}%</b> for random responsive manholes and <b>{{random_any_k5}}%</b> for any random manholes across <b>{{random_draws}}</b> draws.</p>`,
  },

  // 10 · Level sensors vs float switches (Sim 4 budget table)
  {
    id: "floats",
    act: "Step 5 · Sensors",
    kicker: "10 · Level sensors vs float switches",
    title: "Floats reach only {{float_avg}}% on average and {{float_worst}}% in the worst case at any budget.",
    view: "beats",
    ms: 1700,
    show: { basemap: 0.45, pipes: 0.85, chambers: 0.4, sensors: 1, trunk: 0.95 },
    fx: "beats",
    chart: "beats",
    legend: "beats",
    info: { chart: "beats" },
    html: `
      <p><b>What we tested:</b> We compared continuous level sensors at <b>{{level_price}}</b> each against <span class="cite" data-src="brieftype">float switches</span> at <b>{{float_price}}</b> each (both prices assumed) from <b>{{cost_k1}} to {{cost_k8}}</b>. A float counts when it sits at least <b>{{float_margin_mm}} mm</b> (assumed) above normal depth, stays quiet on a design wet day, and growth lifts water past it.</p>
      <p><b>The result:</b> Floats reach only <b>{{float_avg}}%</b> on average and <b>{{float_worst}}%</b> in the worst wet case at <i>any</i> budget (and <b>{{float_unseen_wx}}%</b> on unseen weather): <b>{{float_cap_count}} floats ({{float_cap_cost}})</b> already hit that ceiling, and in age-weighted Design wet no float sees any run. A free mix buys level sensors only at every budget except <b>{{cost_k3}}</b> (<b>{{mix_75k_bought}}, {{mix_75k_cost}}</b>: <b>{{mix_75k_worst}}% / {{mix_75k_avg}}%</b> worst/avg, <b>{{mix_75k_unseen}}%</b> unseen weather).</p>`,
  },

  // 11 · Step 6: Cost, and doing it again
  {
    id: "cost",
    act: "Step 6 · Cost & Limits",
    kicker: "11 · Step 6: Cost, and doing it again",
    title: "{{cost_k1}} or {{cost_k5}} at assumed prices; normal-day records could save up to {{save_sensors}} sensors (about {{save_cost}}).",
    view: "p1",
    ms: 1700,
    show: { basemap: 0.48, pipes: 0.9, chambers: 0.45, sensors: 1 },
    chart: "holdout",
    legend: "plan1",
    info: { chart: "holdout" },
    stats: [
      ["{{cost_k1}} vs {{cost_k5}}", "1 sensor if Design wet holds vs 5 sensors for unknown weather (assumed prices)", "accent"],
      ["~{{save_cost}}", "up to {{save_sensors}} sensors saved if normal-day records confirm the design day"],
    ],
    html: `
      <p><b>What normal-day records buy:</b> At assumed prices, deploying <b>{{plan_k0}}</b> sensor costs <b>{{cost_k1}}</b> and deploying <b>{{plan_k1}}</b> costs <b>{{cost_k5}}</b>. Real level records of a normal day could confirm whether the design wet day is the right test and save up to <b>{{save_sensors}} sensors (about {{save_cost}})</b>.</p>
      <p><b>Doing it again:</b> Compared with the earlier hand-picked regions, <b>{{shared_sensors_handpicked}} of the {{plan_k1}}</b> sensors stay the same (<b>{{sensor_1_id}}, {{sensor_2_id}}, {{sensor_3_id}} and {{sensor_4_id}}</b>), so sensor placement holds up while region triage depends on how the suburb is cut. A new suburb needs its own model runs: the method repeats, this sensor list does not.</p>`,
  },

  // 12 · What limits this + future work (what a new suburb must supply)
  {
    id: "limits",
    act: "Step 6 · Cost & Limits",
    kicker: "12 · Limitations and future work",
    title: "What limits this study, and what a new suburb must supply.",
    view: "all",
    ms: 1700,
    show: { basemap: 0.55, pipes: 0.85, chambers: 0.5, pumps: 0.85, sensors: 0.9 },
    fx: "register",
    legend: "pumps",
    info: { params: "register" },
    html: `
      <p><b>What limits this:</b> Every figure is an uncalibrated model result—a guide to where to look first. One simulated run moves a weather case's score by <b>{{run_noise_min}} to {{run_noise_max}} points</b> (smaller gaps are noise), tightening the rise rule from <b>{{rise_focus_mm}} mm</b> to <b>{{rise_strict_mm}} mm</b> lowers 5-sensor coverage from <b>{{worst_k5}}% / {{avg_k5}}%</b> to <b>{{rule25_worst_k5}}% / {{rule25_avg_k5}}%</b>, and <i>Leave</i> depends on Design wet (<b>R5</b> alone keeps room in all <b>{{wet_cases}}</b> wet cases).</p>
      <div class="params">
        <div class="p"><b>No calibration &amp; assumed rules</b><span>No field data was available. The {{rise_focus_mm}} mm and {{rise_strict_mm}} mm rise rules, {{limit_bore_dec}} pipe limit, triage bands, and {{level_price}} / {{float_price}} prices are all assumed</span><span class="chip confirm" data-src="validation">limitation</span></div>
        <div class="p"><b>Regions are a choice</b><span>{{equal_regions}} pipe-end bisection cuts (Kim et al., 2022) plus overlapping R9 ({{r9_homes}}-home anchor built out per region); a different cut shifts per-region figures</span><span class="chip declared" data-src="kim2022">choice</span></div>
        <div class="p"><b>Sensors never fail here</b><span>Long-term sensor losses are not modelled; age-weighted Design wet cannot be predicted if held out (0% seen without it; {{sensor_3_id}} is the only sensor in the 5 that sees it)</span><span class="chip ideal" data-src="levelsensor">ideal</span></div>
        <div class="p"><b>Future work · What a new suburb must supply</b><span>Pipes &amp; manholes (positions, inverts, diameters, lids), outlet/exit pipes, homes now &amp; projected, connections &amp; pump rates, weather cases, and the utility's own pipe limit, rise rule and prices</span><span class="chip checked" data-src="inverts">future work</span></div>
      </div>`,
  },

  // 13 · Recommendation
  {
    id: "close",
    act: "Recommendation",
    kicker: "13 · Recommendation for Walkerville",
    title: "Monitor {{monitor_regions}} first; start with {{sensor_1_id}} ({{cost_k1}}) and expand to {{plan_k1}} level sensors ({{cost_k5}}) if wet weather is uncertain.",
    view: "p1",
    ms: 1800,
    show: { basemap: 0.55, pipes: 0.95, chambers: 0.4, sensors: 1, phase2: 0.85 },
    fx: "close",
    legend: "plan",
    stats: [
      ["{{plan_k0}} → {{plan_k1}}", "level sensors ({{cost_k1}} if Design wet holds; {{cost_k5}} across all {{wet_cases}} wet cases, assumed prices)", "accent"],
      ["{{monitor_regions}}", "priority regions to monitor first (watch {{watch_regions}}; leave {{leave_regions}})"],
    ],
    html: `
      <p><b>1 · Focus on the regions that run out:</b> Prioritise <b>{{monitor_regions}}</b> (which reach the assumed <b>{{limit_bore_dec}}</b> pipe limit within <b>{{r3_range}}</b> and <b>{{r7_range}}</b> homes), keep a watch on <b>{{watch_regions}}</b>, and leave <b>{{leave_regions}}</b> unmonitored if a design wet day is the agreed test.</p>
      <p><b>2 · Use continuous level sensors, staged by data:</b> Install the first continuous level sensor at <b>{{sensor_1_id}} ({{cost_k1}} assumed)</b> and log normal-day water depths to check the design wet day—potentially saving <b>{{save_sensors}} sensors (about {{save_cost}})</b>—or deploy the full <b>{{plan_k1}}-sensor</b> ladder (<b>{{cost_k5}} assumed</b>) to see <b>{{avg_k5}}%</b> of growth on average (<b>{{worst_k5}}%</b> worst case) and warn of all <b>{{warn_k5}} of {{warn_total}}</b> overloads.</p>`,
  },
];
