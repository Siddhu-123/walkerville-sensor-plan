// Scene copy for the story page (index.html).
//
// Rules (enforced by build/check_copy.py --story):
//   - Every figure is a {{fact}} token, filled from data/story.js (build/export_story.py), from the
//     path figures the page measures on load (RUNTIME below), or from OSP_STATIC (quoted, sourced).
//   - Plain words. Say what a number means before the number. One idea per scene.
//
// Scene fields: act, kicker, title, stats [[value, label, class]], html, chart, gauge, seg (weather
// cases offered), readout, after, legend, view (named camera view in assets/story.js), show (layer
// opacities), style (pipe colouring), fx (scene behaviour in assets/story.js), ms (camera move time).

// Published figures that are not computed by our build. Each is quoted from its source.
window.OSP_STATIC = {
  swmm_links: 890,            // Sim 2.5 findings text (simulation25/data/index.js, scenario.what): 890 links, 328 manholes
  swmm_minutes: 480,          // simulation_src/sim25_grid.py: each run is 480 min of constant inflow
  covers_contour: 322,        // simulation_src/network.py cover source: 322 of 328 chambers from 1 m contours
  covers_surveyed: 5,         // same: 5 surveyed lids (1 chamber has neither)
  contour_error_m: 0.23,      // sandbox README: contour-derived cover vs surveyed lids, mean error, n = 10
  gradient_ratio: "1.00",     // sandbox README finding 4: published gradient / computed fall, median 1.0000
  stonyfell_low: 20,          // Stonyfell deployment (Do et al. 2023), normal levels 20 to 75 mm (sim25_graded.py)
  stonyfell_high: 75,
  // How the model evolved: cloud-run/PROJECT_UNDERSTANDING.md:180-186 and :458-459
  // (sandbox simulation_src/README.md:6-10, simulation/index.html:204-207)
  sim1_warn_low: "7",         // Simulation 1: level sensor warning before first spill, main chambers, minutes
  sim1_warn_high: "20.5",
  sim2_missed_km: "2.7",      // Simulation 2 missed about 2.7 km of sewer draining in from outside
  sim2_dry_ratio: "1.7",      // and its "dry weather" was 1.7x the design envelope
  // Carried over from the detailed deck (cloud-run/presentation/content/slides.js, STATIC_FACTS)
  us_event_share: 26,         // US EPA (2004) SSO report: wet-weather/I&I share of events with a known cause
  us_volume_share: 75,        // same report: about three-quarters of SSO volume
};

window.OSP_SCENES = [
  // ---------------------------------------------------------------- welcome (index.html, unchanged in look)
  {
    id: "welcome", welcome: true, act: "", view: "region", fx: "welcome", ms: 2400,
    show: { basemap: 1 },
    html: `<div class="welcome-top">
        <div class="welcome-kicker">Adelaide University · SA Water</div>
        <h1 class="welcome-heading welcome-topic">Optimal sensor placement for wastewater network monitoring</h1>
        <p class="welcome-greeting">New homes keep connecting to sewers that were never sized for them. We work out how many level sensors a network needs, and where, so growth shows before it causes an overflow. Tested on the Walkerville sewer network.</p>
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

  // ---------------------------------------------------------------- title
  {
    id: "title", act: "Why watch growth", noAct: true, view: "all", fx: "title", ms: 3400,
    show: { terrain: 1, pipes: 1, chambers: 0.7, homes: 0.35 },
    kicker: "Sewer sensor placement · Walkerville",
    title: "Where to watch a growing sewer",
    html: `<p class="lead">How many sensors a sewer needs, where to put them, and how much of the growth they catch, tested on {{runs}} simulated futures of the Walkerville network.</p>
      <p class="note">Built on SA Water's public Walkerville sample. The same steps re-run on the pilot network when its data arrives. Draft for discussion.</p>`,
  },
  // ---------------------------------------------------------------- the pressure
  // Growth types: ProjectScopingDocument_v3.1.7 §1.1 and §2.5 (Scenarios); mechanism, stages and the
  // growth/blockage contrast: presentation/modelling/07_GROWTH_OVERFLOW_MECHANISM.md §2.2, §2.4-2.7, §8.5.
  {
    id: "growth", act: "Why watch growth", view: "all",
    show: { terrain: 1, pipes: 0.8, chambers: 0.3, homes: 0.9 },
    kicker: "Two kinds of growth",
    title: "A sewer grows in two ways",
    html: `<div class="params">
        <div><span class="k">Greenfield</span><span class="v">Urban fringe</span><span class="s">New subdivisions on undeveloped land connect at the edge of the network. Their own pipes are new and sized for them, so the extra load lands on the existing trunk where they join.</span></div>
        <div><span class="k">Infill</span><span class="v">Established suburbs</span><span class="s">Extra homes on existing lots, from subdividing a block or replacing one house with several, connect to old mains that were never sized for them (PG-S2-22 2026).</span></div>
      </div>
      <p>Both use up spare room in every pipe downstream. Walkerville is an established suburb, so the growth tested here is infill.</p>
      <p class="note">For the pilot area, each growth scenario will be split into infill and greenfield parts, as agreed with SA Water on 28 September (PG-S2-22 2026).</p>`,
  },
  {
    id: "infill", act: "Why watch growth", view: "all", fx: "infill", style: "age",
    show: { terrain: 0.8, pipes: 1, homes: 0.9 },
    kicker: "The pressure",
    title: "Infill is adding homes to century-old pipes",
    stats: [["{{median_pipe_year}}", "median year a Walkerville sewer pipe was laid"],
            ["{{small_pipe_pct}}%", "of pipes are the smallest size, 150 mm"],
            ["{{homes}}", "properties connected today"]],
    html: `<p>Units and subdivisions replace single houses on the same lots, so new flow enters old, small pipes that were never sized for it. {{pre1960_pct}}% of this network was laid before 1960, and {{clay_pct}}% is vitrified clay (Jaison 2026).</p>`,
    legend: "age",
  },
  {
    id: "downhill", act: "Why watch growth", view: "all", fx: "downhill",
    show: { terrain: 1, pipes: 0.55, flow: 1, chambers: 0.4 },
    kicker: "How it fails",
    title: "Every new home loads every pipe below it",
    html: `<p>Sewage runs downhill by gravity. A new home's flow adds to every pipe between it and the end of the network, so growth anywhere upstream reaches the trunk.</p>
      <p>When a pipe runs out of spare room, water backs up into the manholes behind it. <strong>That rise is what a sensor can see.</strong></p>`,
    legend: "flow",
  },
  {
    id: "overflow", act: "Why watch growth", view: "all",
    show: { terrain: 1, pipes: 0.55, flow: 0.8, chambers: 0.6 },
    kicker: "From growth to overflow",
    title: "The spill shows up above the pipe at fault",
    html: `<ol class="steps">
        <li><b>One pipe runs out first</b><span>On the path from new homes to the outlet, the pipe with the least spare room becomes the bottleneck.</span></li>
        <li><b>Rain tips it over</b><span>Dry-weather flow rarely fills a pipe. Growth uses up the margin that used to absorb rain, so smaller, more frequent storms now overload it (US EPA 2004).</span></li>
        <li><b>Water backs up</b><span>The full pipe pushes the level up through the manholes behind it. Below it, flow is capped and levels look normal.</span></li>
        <li class="kept"><b>It spills where the lid is lowest</b><span>The overflow comes out at the manhole with the least room to its lid, often well upstream of the pipe at fault.</span></li>
      </ol>
      <p>So a sensor below the bottleneck sees almost nothing. <strong>One in the backed-up zone above it sees it first.</strong></p>`,
    legend: "flow",
  },
  {
    id: "stages", act: "Why watch growth", view: "all",
    show: { terrain: 1, pipes: 0.6, flow: 0.4, chambers: 0.8 },
    kicker: "How growth shows",
    title: "Growth shows in stages, years before a spill",
    html: `<ol class="steps">
        <li><b>The everyday peak creeps up</b><span>On dry days, the daily high level drifts upward over months and years as homes connect.</span></li>
        <li><b>Moderate storms start to surcharge</b><span>Water rises above the top of the pipe more often, and in smaller storms.</span></li>
        <li><b>Overflow in ever-smaller storms</b><span>Spills that once needed a big storm become recurrent.</span></li>
      </ol>
      <p>A <strong>level sensor</strong> sees the first two stages, giving months to years of warning. A <strong>float switch</strong> set near the lid sees only the last one, when the water is already about to spill (Do et al. 2023; PG-S2-22 2026).</p>`,
  },
  {
    id: "why", act: "Why watch growth", view: "all",
    show: { terrain: 1, pipes: 0.55, flow: 0.6, chambers: 0.4, homes: 0.5 },
    kicker: "Why it matters",
    title: "Growth can be seen coming, but overflow records hide it",
    stats: [["{{us_event_share}}%", "of overflow events in US national records came from wet-weather capacity problems"],
            ["{{us_volume_share}}%", "of the spilled volume came from those same problems"]],
    html: `<p>Blockages cause most overflow events (US EPA 2004), so they fill the records and can hide growth. At one sensor the two look alike, but they behave differently:</p>
      <div class="vs">
        <b></b><b>Blockage</b><b>Growth</b>
        <span>Onset</span><span>Sudden, days</span><span>Gradual, years</span>
        <span>Weather</span><span>Often dry</span><span>Rises with rain</span>
        <span>Where</span><span>One point</span><span>A predictable zone</span>
        <span>Afterwards</span><span>High until cleared</span><span>Falls, then recurs</span>
      </div>
      <p class="note">Source: US EPA (2004).</p>`,
    legend: "flow",
  },

  // ---------------------------------------------------------------- the question
  {
    id: "today", act: "The question", view: "all",
    show: { terrain: 1, pipes: 0.6, chambers: 1, homes: 0.2 },
    kicker: "Today",
    title: "Sensor sites are chosen one case at a time",
    html: `<ul>
        <li>Sites are picked from breakdown history, hydraulic model results, complaints, and how close a manhole is to a creek or reservoir (PG-S2-22 2026).</li>
        <li>There is no written method for how many sensors an area needs, or where they give the most visibility.</li>
        <li>The network has already moved from blanket coverage to a smaller number of critical manholes. <strong>That makes the choice of sites more important.</strong></li>
      </ul>`,
  },
  {
    id: "question", act: "The question", view: "all",
    show: { terrain: 1, pipes: 0.75, chambers: 1, homes: 0.3 },
    kicker: "What we set out to answer",
    title: "Three things SA Water needs to know",
    html: `<div class="params">
        <div><span class="k">Where?</span><span class="s">Which manholes show growth first, and which ones see the most of it?</span></div>
        <div><span class="k">How many?</span><span class="s">How many sensors are enough before each extra one adds little?</span></div>
        <div><span class="k">How well?</span><span class="s">How much of the growth do they catch, in dry weather and in wet?</span></div>
      </div>`,
  },
  {
    id: "brief", act: "The question", view: "all", fx: "brief",
    info: { params: "brief" },
    show: { terrain: 1, pipes: 0.75, chambers: 1, homes: 0.25 },
    kicker: "The brief and our scope",
    title: "How many sensors, of which type, and where?",
    html: `<div class="params src">
        <div><span class="k">How many, and where</span><span class="v">SA Water 2026</span><span class="s">"Identify the optimal sensor locations and number of sensors."</span></div>
        <div><span class="k">Which type</span><span class="v">PG-S2-22 2026, §1.2</span><span class="s">Float switches give a threshold alert only. Level sensors give continuous depth and cost five to six times more.</span></div>
        <div><span class="k">To watch for</span><span class="v">PG-S2-22 2026, §1.1</span><span class="s">Overcapacity and overflow as new homes are added to existing sewers.</span></div>
        <div><span class="k">Within</span><span class="v">PG-S2-22 2026, §2.5</span><span class="s">One pilot trunk sewer network. No installation or field trials.</span></div>
      </div>
      <blockquote class="quote">"Optimal sensor placement is not the problem… optimal sensor placement is a solution for the data collection problem."<cite>Vineeth Maruvada, SA Water · meeting with the capstone team</cite></blockquote>`,
  },

  // ---------------------------------------------------------------- our approach
  // Approach: ProjectScopingDocument_v3.1.7 §2.5 (alternatives, proposed approach A6). Why Manning first:
  // presentation/modelling/06_DECISIONS_AND_OPEN_QUESTIONS.md DEC-02; its limits: 07_GROWTH_OVERFLOW_MECHANISM.md §2.5, §5.7.
  {
    id: "approach", act: "Our approach", view: "all",
    show: { terrain: 1, pipes: 0.75, chambers: 0.8, homes: 0.4 },
    kicker: "The approach we adopted",
    title: "Simulate the growth, then pick the sensors that see it",
    html: `<ol class="steps">
        <li><b>Model the network</b><span>Walkerville's {{sites}} manholes and their pipes, from SA Water's public records, in EPA SWMM (Rossman 2017).</span></li>
        <li><b>Add growth everywhere</b><span>New homes at every manhole, at five sizes and in {{cases}} weather cases: {{runs}} runs.</span></li>
        <li><b>Decide what a sensor sees</b><span>A rise of {{rise_focus_mm}} mm or more at its manhole, against the same case with no growth.</span></li>
        <li class="kept"><b>Choose the sites</b><span>The set that sees the most growth in its worst weather case, solved exactly. The count is where one more sensor adds little.</span></li>
      </ol>
      <p class="note">Six approaches were compared. This one, simulation plus coverage, was chosen because it works on public data, each site can be explained by what it sees, and the same steps re-run on any network (PG-S2-22 2026).</p>`,
  },
  {
    id: "capacity", act: "Our approach", view: "all",
    show: { terrain: 0.9, pipes: 0.9, flow: 0.5, chambers: 0.6 },
    kicker: "Why simulation",
    title: "We started with a capacity check, then moved to simulation",
    html: `<p>Our first screen used <strong>Manning's equation</strong> (Chow 1959): how much each pipe carries when full, against the load new homes add. It needs only pipe size, slope and roughness, it is how design codes rate a sewer's capacity (Icon Water n.d.), and published placement methods already use pipe size and slope in place of a hydraulic model (Simone et al. 2023).</p>
      <div class="vs">
        <b></b><b>Capacity check</b><b>Simulation</b>
        <span>Tells you</span><span>Which pipe fills</span><span>Water level at each manhole</span>
        <span>Backing up</span><span>Not computed</span><span>Routed</span>
        <span>Sensor view</span><span>Guessed</span><span>Read off</span>
      </div>
      <p>A sensor measures water level, and growth shows where water backs up behind a full pipe. <strong>So we moved to EPA SWMM</strong>, which computes that level at every manhole (Rossman 2017).</p>`,
    legend: "flow",
  },

  // ---------------------------------------------------------------- the answer
  {
    id: "answer", act: "The answer", view: "all", fx: "answer",
    info: { stats: "answerstats" },
    show: { terrain: 1, pipes: 0.75, chambers: 0.3, sensors: 1 },
    kicker: "Our recommendation",
    title: "{{plan_k1_Word}} sensors, at these {{plan_k1_word}} manholes",
    stats: [["{{plan_k1_worst}}%", "of detectable growth seen, even in the weather case where the plan does worst"],
            ["{{plan_k1_mean}}%", "seen on average across the {{cases}} weather cases"]],
    html: `<p>Of the {{combos_k1}} possible ways to place {{plan_k1}} sensors, <strong>none sees more</strong> in its worst case. We solved for the best set exactly on our {{runs}} runs, so no other set of {{plan_k1}} scores higher on them.</p>
      <p class="note">Detectable growth raises the water by at least {{rise_focus_mm}} mm at some manhole. Growth too small to show anywhere can't be seen by any sensor, so it doesn't count for or against the plan.</p>`,
    legend: "plan1",
  },
  {
    id: "roles", act: "The answer", view: "plan", fx: "roles",
    show: { terrain: 1, pipes: 0.7, chambers: 0.25, sensors: 1, phase2: 1 },
    kicker: "Why these five",
    title: "Each sensor watches a different kind of day",
    html: `<p>No single manhole sees growth in every weather. One sensor is strongest on dry days, one in everyday wet weather, and three in storms, when the trunk is already full and can't show any more rise.</p>
      <p><strong>Phase 2:</strong> five more sites (dashed) lift the worst case to {{plan_kmax_worst}}% and the average to {{plan_kmax_mean}}%. Adding them later loses nothing: the ten together score the same as the best possible ten.</p>`,
    legend: "plan",
  },

  // ---------------------------------------------------------------- how we found it
  {
    id: "path", act: "How we found it", view: "all",
    info: { steps: "path" },
    show: { terrain: 0.9, pipes: 0.6, chambers: 0.3 },
    kicker: "How we got here",
    title: "Three models, and the one we kept",
    html: `<ol class="steps">
        <li><b>Simulation 1</b><span>How much warning does a sensor give before a spill? On a four-chamber test network, a level sensor gave {{sim1_warn_low}} to {{sim1_warn_high}} minutes at the main chambers.</span></li>
        <li class="dropped"><b>Simulation 2 <em>set aside</em></b><span>Where does growth run a catchment out of room? It missed about {{sim2_missed_km}} km of sewer draining in from outside, and its dry weather was {{sim2_dry_ratio}} times the design envelope.</span></li>
        <li class="kept"><b>Simulation 2.5</b><span>Where does growth show anywhere in Walkerville, and which manholes see most of it? Every result from here on comes from this model (Jaison 2026).</span></li>
      </ol>`,
  },
  {
    id: "data", act: "How we found it", view: "all",
    show: { terrain: 1, pipes: 0.9, chambers: 0.8, homes: 0.7 },
    kicker: "The dataset",
    title: "Built entirely from public data",
    html: `<p>SA Water's own network data is still awaiting release approval (PG-S2-22 2026), so the Walkerville model is built from layers anyone can query.</p>
      <div class="params src">
        <div><span class="k">Sewer pipes and manholes</span><span class="v">Town of Walkerville 2021</span><span class="s">SA Water's sewer records as republished by the council: {{pipes_total}} gravity mains with pipe-floor levels, size, material and flow direction, and {{manholes_published}} manholes.</span></div>
        <div><span class="k">Connected homes</span><span class="v">Town of Walkerville 2021</span><span class="s">{{homes}} property connection points, each linked to the main it drains to.</span></div>
        <div><span class="k">Ground level</span><span class="v">Town of Walkerville n.d.</span><span class="s">1 m contours, used for manhole lid levels where none is surveyed: {{contour_error_m}} m average error against surveyed lids.</span></div>
        <div><span class="k">Flow from outside</span><span class="v">SA Water n.d.</span><span class="s">SA Water's statewide gravity-main layer. Pipes beyond the council are not modelled; their length sets a steady inflow where they join.</span></div>
        <div><span class="k">People per home</span><span class="v">ABS 2022</span><span class="s">2021 Census household size and population.</span></div>
      </div>
      <p class="note">The layers were downloaded once and kept unchanged, so every result can be re-run from the same snapshot (Jaison 2026). The live layers can change, and SA Water's pilot data will replace this sample.</p>`,
  },
  {
    id: "swmm", act: "How we found it", view: "all", fx: "swmm",
    info: { vs: "swmm" },
    show: { terrain: 0.9, pipes: 0.8, flow: 0.35, chambers: 1 },
    kicker: "Why SWMM",
    title: "We modelled the water, not just the pipe map",
    html: `<p>One published approach judges a sensor's reach from the pipe map alone, counting every pipe within a set number of links (<span class="cite" data-src="maprule">He et al. 2026</span>), and so did our first prototype. But growth only shows where the water still has room to rise.</p>
      <div class="vs">
        <span></span><b>Map rule</b><b>SWMM</b>
        <span>What a sensor sees</span><span>Pipes within reach, assumed</span><span>Water depth, computed</span>
        <span>A pipe already full</span><span>Looks like any other</span><span>No room to rise, so flagged</span>
        <span>New homes</span><span>Not modelled</span><span>Added and routed, {{runs}} runs</span>
      </div>
      <p class="note">{{sites}} manholes and {{swmm_links}} pipes from SA Water's published records, each run routed for {{swmm_minutes}} minutes until the levels settle. Every input is public, so every result can be re-run (Jaison 2026; Rossman 2017).</p>`,
    legend: "flow",
  },
  {
    id: "whatif", act: "How we found it", view: "all", fx: "whatif",
    show: { terrain: 0.9, pipes: 0.6, chambers: 0.45, resp: 1 },
    kicker: "The test",
    title: "Then we added homes at every manhole, {{runs}} times",
    html: `<p>Each run connects new homes at one manhole and records how far the water rises at every other one: {{sites}} sites, five sizes ({{sizes}} homes) and {{cases}} weather cases.</p>`,
    readout: true,
    legend: "resp",
  },
  {
    id: "cases", act: "How we found it", view: "all", fx: "cases",
    info: { seg: "cases" },
    show: { terrain: 0.9, pipes: 0.6, chambers: 0.35, alarm: 1 },
    kicker: "The unknowns",
    title: "Five weather cases, not one",
    html: `<p>We do not yet have measured data on how much groundwater and rain leaks into Walkerville's pipes, so every growth test ran under five cases, from a dry day to a heavy wet period.</p>
      <p>Each case is a leakage rate into the pipes, in litres per second for every 100 m of pipe: dry 0, design wet 0.11, severe 0.40. The other two cases use 0.11, one spread by pipe age and one with 1.5 times the flow arriving from outside Walkerville.</p>`,
    seg: [0, 1, 2, 3, 4], readout: true,
    after: `<p class="note">In a storm, {{base_surcharged_severe}} manholes are already surcharged before any growth. A sensor there can't show growth, which is why the plan puts its storm watchers elsewhere.</p>
      <p class="note">The model has no rainfall input, so these rates do not convert to millimetres of rain. Linking them needs SA Water's rain and flow-gauge records.</p>`,
    legend: "alarm",
  },

  {
    id: "stress", act: "How we found it", view: "all", fx: "stress", style: "stress",
    info: { seg: "stress" },
    show: { terrain: 0.9, pipes: 1 },
    kicker: "Before any growth",
    title: "Where the pipes are already under strain",
    html: `<p>Colour shows how full each pipe runs before a single new home: the water depth at its manholes as a share of the pipe's width. In design wet weather {{stress_half_wet}} pipes already run more than half full; in the severe case {{stress_half_severe}} do, and {{base_surcharged_severe}} manholes are surcharged.</p>`,
    seg: [0, 1, 2, 3, 4], readout: true,
    after: `<p class="note">These are the places with the least spare room. New homes upstream of them use it up first.</p>`,
    legend: "stress",
  },

  // ---------------------------------------------------------------- the proof
  {
    id: "howmany", act: "Why it holds", view: "plan",
    info: { chart: "frontier" },
    show: { terrain: 1, pipes: 0.7, chambers: 0.25, sensors: 1, phase2: 1 },
    kicker: "Proof 1 · how many",
    title: "The first five do most of the work",
    html: `<p>The best share of growth any plan can see in its worst weather case, for 1 to {{plan_kmax}} sensors. Every point on the black line is the proven best for that number. The curve is still rising at {{plan_kmax}}.</p>`,
    chart: "frontier",
    after: `<p class="note">The first five reach {{opt_k1_worst}}%; the next five add {{kmax_gain}} points between them. Picking one sensor at a time, the usual method, reaches {{greedy_k1_worst}}% with five sensors, {{greedy_gap_k1}} points behind. The gap is widest at {{greedy_gap_max_at}} sensors, {{greedy_gap_max}} points, which is why we solved for the best set directly.</p>`,
  },
  {
    id: "beats", act: "Why it holds", view: "beats", fx: "beats",
    info: { chart: "beats" },
    show: { terrain: 1, pipes: 0.6, chambers: 0.2, sensors: 1, trunk: 1 },
    kicker: "Proof 2 · against the alternatives",
    title: "It beats every obvious choice",
    html: `<p>Five sensors each, scored on the same {{runs}} runs, in the worst weather case.</p>`,
    chart: "beats",
    after: `<p class="note">The five manholes with the deepest flow today (grey) sit on the trunk and mostly see the same growth. Spreading sensors by what each one adds is what lifts the score.</p>`,
    legend: "beats",
  },
  {
    id: "holdout", act: "Why it holds", view: "plan",
    info: { chart: "holdout" },
    show: { terrain: 0.7, pipes: 0.45, sensors: 0.8 },
    kicker: "Proof 3 · unseen weather",
    title: "How it holds on weather it never saw",
    html: `<p>For each case, we chose five sensors using only the other four, then scored them on the case left out.</p>`,
    chart: "holdout",
    after: `<p>Three cases barely move. Dry days and storms do: planned without them, a plan sees {{held_dry_unseen}}% of dry-day growth instead of {{held_dry_seen}}%, and {{held_severe_unseen}}% in a storm instead of {{held_severe_seen}}%. <strong>The plan has to be chosen across all the weather it will face</strong>, so SA Water's real normal-day levels are the first thing to check.</p>`,
  },
  {
    id: "tryit", act: "Why it holds", view: "all", fx: "tryit",
    show: { terrain: 1, pipes: 0.6, chambers: 1, sensors: 1, phase2: 0.8, resp: 1 },
    kicker: "Try it",
    title: "Connect {{size_focus}} homes anywhere",
    html: `<p>Click any manhole. The map shows which manholes rise, and whether one of the five sensors sees it.</p>`,
    seg: [0, 1, 2], readout: true,
    legend: "resp",
  },

  // ---------------------------------------------------------------- 3D: the parameters
  {
    id: "below", act: "Below the street", view: "tilt", fx: "below", ms: 2600,
    info: { params: "params" },
    show: { terrain: 1, pipes: 1, shafts: 1, sensors: 1 },
    kicker: "What the numbers rest on",
    title: "Every manhole, from the lid to the pipe floor",
    html: `<p>Ground level and pipe depth decide where water can back up, so the model needs both.</p>
      <div class="params">
        <div><span class="k">Pipe floor levels</span><span class="v">every main</span><span class="s">From SA Water's records. <span class="chip measured" data-src="inverts">measured</span></span></div>
        <div><span class="k">Ground level at the lid</span><span class="v">{{contour_error_m}} m avg. error</span><span class="s">From 1 m contours for {{covers_contour}} of {{sites}} manholes, surveyed for {{covers_surveyed}}. <span class="chip sourced" data-src="cover">derived</span></span></div>
        <div><span class="k">Manhole depth</span><span class="v">{{depth_median_m}} m</span><span class="s">Median; most lie between {{depth_p10_m}} and {{depth_p90_m}} m.</span></div>
      </div>
      <p class="note">Heights are stretched nine times so the depth shows.</p>`,
  },
  {
    id: "fall", act: "Below the street", view: "side", fx: "fall", style: "path", ms: 2400,
    info: { params: "params" },
    show: { terrain: 0.45, pipes: 1, shafts: 0.5, flow: 1 },
    kicker: "Parameter · slope",
    title: "Gravity does the work",
    html: `<p>The longest drainage path falls {{path_fall_m}} m over {{path_km}} km. Slope sets how much each pipe carries and which way the water goes.</p>
      <div class="params">
        <div><span class="k">Flow direction</span><span class="v">recorded</span><span class="s">SA Water's own direction field, checked against the levels at shared manholes. <span class="chip checked" data-src="direction">checked</span></span></div>
        <div><span class="k">Slope</span><span class="v">from levels</span><span class="s">Computed from pipe-floor levels; the published gradient field agrees (median ratio {{gradient_ratio}}). <span class="chip checked" data-src="slope">checked</span></span></div>
      </div>`,
    legend: "flow",
  },
  {
    id: "pipes", act: "Below the street", view: (V) => V.close(V.phase1(2), 230), fx: "pipes", style: "size", ms: 2200,
    info: { params: "params" },
    show: { terrain: 0.55, pipes: 1, shafts: 1, chambers: 0.2, sensors: 0.6 },
    kicker: "Parameter · pipes",
    title: "Size, material and roughness",
    html: `<div class="params">
        <div><span class="k">Diameter</span><span class="v">every main</span><span class="s">{{small_pipe_pct}}% are 150 mm, the smallest size. <span class="chip measured" data-src="diameter">measured</span></span></div>
        <div><span class="k">Material</span><span class="v">{{clay_pct}}% clay</span><span class="s">Records marked "unknown" are filled from a second published field. <span class="chip measured" data-src="material">measured</span></span></div>
        <div><span class="k">Roughness (Manning's n)</span><span class="v">{{manning_clay}} / {{manning_pvc}}</span><span class="s">Clay / uPVC, standard values (<span class="cite" data-src="manning">Chow 1959</span>). No roughness is recorded. <span class="chip sourced" data-src="manning">sourced</span> <span class="chip confirm" data-src="manning">to confirm</span></span></div>
      </div>`,
    legend: "size",
  },
  {
    id: "load", act: "Below the street", view: (V) => V.close(V.phase1(1), 200, { bearing: 24, pitch: 55 }), fx: "load", ms: 2200,
    info: { params: "params" },
    show: { terrain: 0.7, pipes: 1, shafts: 0.8, homes: 1, sensors: 0.6 },
    kicker: "Parameter · load",
    title: "What one new home adds",
    html: `<div class="params">
        <div><span class="k">People per new home</span><span class="v">{{people_per_new_dwelling}}</span><span class="s">2021 Census household size (<span class="cite" data-src="household">ABS 2022</span>). <span class="chip sourced" data-src="household">sourced</span></span></div>
        <div><span class="k">Water use</span><span class="v">{{litres_per_person_day}} L/day</span><span class="s">Per person (<span class="cite" data-src="wateruse">Barwon Water n.d.</span>). <span class="chip sourced" data-src="wateruse">sourced</span> <span class="chip confirm" data-src="wateruse">SA value to confirm</span></span></div>
        <div><span class="k">Peak factor</span><span class="v">×{{peak_factor}}</span><span class="s">Busiest hour against the daily average. <span class="chip declared" data-src="peak">declared</span></span></div>
        <div><span class="k">People per existing home</span><span class="v">{{people_per_connection}}</span><span class="s">2021 Census population over connected properties (<span class="cite" data-src="population">ABS 2022</span>). <span class="chip measured" data-src="population">measured</span></span></div>
      </div>
      <p class="note">{{size_focus}} new homes add about {{growth_focus_lps}} L/s at the peak. New homes are assumed to let in no groundwater, which understates their effect.</p>`,
  },
  {
    id: "rain", act: "Below the street", view: "tilt2", fx: "rain", ms: 2400,
    show: { terrain: 0.8, pipes: 0.8, shafts: 0.35, water: 1, sensors: 0.7 },
    kicker: "Parameter · wet weather",
    title: "Groundwater and rain get into old pipes",
    html: `<p>Leakage into the pipes is the biggest unknown. We ran three levels: none, the level that just meets the utility's design rating ({{ii_design}} L/s per 100 m of pipe), and a heavy wet period ({{ii_severe}} L/s per 100 m). <span class="chip declared" data-src="infiltration">declared</span> <span class="chip confirm" data-src="infiltration">flow survey to confirm</span></p>`,
    seg: [0, 1, 2], readout: true,
    legend: "water",
  },
  {
    id: "sees", act: "Below the street", view: (V) => V.close(V.phase1(1), 300), fx: "sees", ms: 2200,
    info: { gauge: "gauge" },
    show: { terrain: 0.55, pipes: 0.8, shafts: 1, chambers: 0.6, sensors: 1, resp: 1, spikes: 1 },
    kicker: "Parameter · detection",
    title: "A sensor sees growth as a rise above its normal level",
    html: `<p>A sensor counts growth when the water at its manhole rises <strong>{{rise_focus_mm}} mm or more</strong> above its own normal level. Each spike is one manhole's rise when these homes connect.</p>`,
    gauge: true,
    after: `<p class="note">A fixed {{alarm_mm}} mm alarm (<span class="cite" data-src="alarm">Do et al. 2023</span>), the alert a float switch gives at a fixed height, saw none of {{dry_small_runs}} dry-day growth runs up to {{size_focus}} homes. A rise needs continuous depth, so the plan assumes level sensors. The {{rise_focus_mm}} mm rule is declared until SA Water's level records set it; normal levels at <span class="cite" data-src="levelsensor">a Stonyfell sensor</span> ranged {{stonyfell_low}} to {{stonyfell_high}} mm.</p>`,
    legend: "resp",
  },

  // ---------------------------------------------------------------- what next
  {
    id: "register", act: "What's next", view: "plan", ms: 2600,
    info: { params: "register" },
    show: { terrain: 1, pipes: 0.7, chambers: 0.25, sensors: 1, phase2: 1 },
    kicker: "Honest limits",
    title: "What is assumed, and what removes it",
    html: `<div class="params">
        <div><span class="k">Steady busiest-hour flows</span><span class="v"><span class="chip declared" data-src="steady">declared</span></span><span class="s">No storms or daily cycle yet. Removed by SA Water's calibrated model or level records.</span></div>
        <div><span class="k">Leakage into pipes</span><span class="v"><span class="chip declared" data-src="infiltration">declared</span></span><span class="s">Removed by a flow survey or treatment-plant inflow records.</span></div>
        <div><span class="k">Detection thresholds</span><span class="v"><span class="chip declared" data-src="alarm">declared</span></span><span class="s">{{rise_focus_mm}} mm rise and {{alarm_mm}} mm alarm. Removed by normal-day level records and the alarm settings in use.</span></div>
        <div><span class="k">Water use and peak factor</span><span class="v"><span class="chip sourced" data-src="wateruse">sourced</span></span><span class="s">Interstate values. Removed by SA Water's design figures.</span></div>
        <div><span class="k">Pump stations</span><span class="v"><span class="chip declared" data-src="pumps">ideal</span></span><span class="s">Modelled as passing all flow at once. Removed by pump rates and controls.</span></div>
        <div><span class="k">One model fix pending</span><span class="v"><span class="chip confirm" data-src="modelfix">to fix</span></span><span class="s">Relief pipes return everyday flow to a pump well. A corrected run is needed before final numbers.</span></div>
        <div><span class="k">No field validation yet</span><span class="v"><span class="chip confirm" data-src="validation">to confirm</span></span><span class="s">Checked against overflow and blockage history once it is shared.</span></div>
      </div>`,
    legend: "plan",
  },
  {
    id: "close", act: "What's next", view: "all", fx: "close",
    show: { terrain: 1, pipes: 0.75, chambers: 0.25, sensors: 1, phase2: 1 },
    kicker: "In one line",
    title: "Five sensors now. Five more as growth is confirmed.",
    stats: [["{{plan_k1_worst}}%", "worst case, first five"], ["{{plan_kmax_worst}}%", "worst case, all ten"], ["{{runs}}", "simulations behind it"]],
    html: `<p>The best set of its size on our runs, well ahead of the obvious alternatives. It holds less well on weather it was not chosen for, so SA Water's measured levels come first. When the pilot data arrives, the same pipeline re-runs and every number here updates.</p>
      <p class="note">Plan: 23 Oct prototype on the pilot area · 6 Nov scenario and cost comparison · 13 Nov guidelines · 20 Nov business case and handover. <a href="cloud-run/presentation/deck.html">Detailed deck and appendices</a></p>`,
    legend: "plan",
  },
  // ---------------------------------------------------------------- references (Harvard, author-date)
  {
    id: "references", act: "References", view: "all",
    show: { terrain: 0.8, pipes: 0.5 },
    kicker: "Sources",
    title: "References",
    html: `<ul class="refs">
        <li>Australian Bureau of Statistics (ABS) 2022, <em>Walkerville: 2021 Census all persons QuickStats</em> (LGA48260), ABS, Canberra, viewed 22 October 2026, <a href="https://www.abs.gov.au/census/find-census-data/quickstats/2021/LGA48260" target="_blank" rel="noopener">abs.gov.au</a>.</li>
        <li>Barwon Water n.d., <em>Supplementary information to the WSAA Sewerage Code of Australia 2014</em>, Barwon Water, Geelong, viewed 22 October 2026, <a href="https://www.barwonwater.vic.gov.au/__data/assets/pdf_file/0025/72529/Supplementary-information-to-the-WSAA-Sewerage-Code-of-Australia-2014.pdf" target="_blank" rel="noopener">barwonwater.vic.gov.au</a>.</li>
        <li>Chow, VT 1959, <em>Open-channel hydraulics</em>, McGraw-Hill, New York.</li>
        <li>Do, NC, Dix, L, Lambert, MF &amp; Stephens, ML 2023, 'Proactive detection of wastewater overflows for smart sanitary sewer systems: case study in South Australia', <em>Journal of Water Resources Planning and Management</em>, vol. 149, no. 1, article 05022016, <a href="https://doi.org/10.1061/JWRMD5.WRENG-5589" target="_blank" rel="noopener">doi:10.1061/JWRMD5.WRENG-5589</a>.</li>
        <li>He, L, Nan, J, Chen, L &amp; Ye, X 2026, 'A topology-first and demand-driven sensor placement framework for hydraulic-state reconstruction in urban drainage networks', <em>Water Research</em>, vol. 307, article 126713, <a href="https://doi.org/10.1016/j.watres.2026.126713" target="_blank" rel="noopener">doi:10.1016/j.watres.2026.126713</a>.</li>
        <li>Icon Water n.d., <em>WSA 02 gravity sewerage code supplement</em> (STD-SPE-G-011), Icon Water, Canberra, viewed 22 October 2026, <a href="https://iconwater.com.au/sites/default/files/2023-10/STD-SPE-G-011-WSA-02-Gravity-Sewage-Code-Supplement-26522.pdf" target="_blank" rel="noopener">iconwater.com.au</a>.</li>
        <li>Jaison, AP 2026, <em>gravity-sewer-osp: Simulation 2.5</em>, source code and results, commit e6232db, GitHub, viewed 22 October 2026, <a href="https://github.com/AbrahamPaulJ/gravity-sewer-osp" target="_blank" rel="noopener">github.com/AbrahamPaulJ/gravity-sewer-osp</a>.</li>
        <li>PG-S2-22 2026, <em>Optimal sensor placement for wastewater network monitoring: project proposal and scoping document</em>, version 3.1.7 (draft), unpublished report for SA Water, Adelaide University, Adelaide.</li>
        <li>Rossman, LA 2017, <em>Storm Water Management Model reference manual, volume II: hydraulics</em>, EPA/600/R-17/111, US Environmental Protection Agency, Cincinnati, OH.</li>
        <li>SA Water 2026, <em>WIL Schedule 2: optimal placement of sensors in a water network</em>, unpublished project request, SA Water, Adelaide.</li>
        <li>SA Water n.d., <em>Waste water gravity main</em>, dataset from the SA Water wastewater reticulation asset register, Infrastructure and Utilities map service, layer 9, Government of South Australia, viewed 22 October 2026, <a href="https://agsplus.geodata.sa.gov.au/arcgis/rest/services/Infrastructure_Utilities/MapServer/9" target="_blank" rel="noopener">agsplus.geodata.sa.gov.au</a>.</li>
        <li>Simone, A, Di Cristo, C, Guadagno, V &amp; Del Giudice, G 2023, 'Sewer networks monitoring through a topological backtracking', <em>Journal of Environmental Management</em>, vol. 346, article 119015, <a href="https://doi.org/10.1016/j.jenvman.2023.119015" target="_blank" rel="noopener">doi:10.1016/j.jenvman.2023.119015</a>.</li>
        <li>Town of Walkerville 2021, <em>SA Water sewer network</em> (SA Water Sewer June 2021), ArcGIS Online feature service, viewed 22 October 2026, <a href="https://services-ap1.arcgis.com/38lmAqtkEsaNGT6T/arcgis/rest/services/SA_Water_Sewer_Network/FeatureServer" target="_blank" rel="noopener">services-ap1.arcgis.com</a>.</li>
        <li>Town of Walkerville n.d., <em>Contours (1 m)</em>, ArcGIS Online feature service, viewed 22 October 2026, <a href="https://services-ap1.arcgis.com/38lmAqtkEsaNGT6T/arcgis/rest/services/Contours_1m/FeatureServer" target="_blank" rel="noopener">services-ap1.arcgis.com</a>.</li>
        <li>United States Environmental Protection Agency (US EPA) 2004, <em>Report to Congress: impacts and control of CSOs and SSOs</em>, EPA-833-R-04-001, Office of Water, Washington, DC.</li>
      </ul>`,
  },
];
