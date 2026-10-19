// Slide copy for the client presentation.
//
// Rules for this file (enforced by build/check_copy.py):
//   - Every number on a slide is a {{fact}} token, filled from data/scenario.js. Nothing is typed in.
//   - Only the names the export produces (scenario.facts) may appear inside {{ }}.
//   - Plain words for the client. Say what a number means before the number.
//
// Widgets named in `widgets` are drawn into the slide by deck.js at the matching data-widget.

// Published figures that are not computed from the simulations. Each one is quoted from its source
// and listed in Appendix A3. The checker accepts these names alongside the scenario facts.
window.STATIC_FACTS = {
  review_sources: 16,           // Rijoy John's literature review, Section 1
  review_position_models: 2,    // review Section 6.2 and gap 6: only two sources model position-dependent detection
  us_event_share: 26,           // US EPA (2004) SSO report: wet-weather/I&I share of events with a known cause
  us_volume_share: 75,          // same report: about three-quarters of SSO volume
  layout_score: 0,              // sandbox page (simulation25 findings, section 2B): layout-based rules score 0% on these runs; not recomputed here
};

window.SLIDES = [
  {
    id: "title",
    kicker: "Sewer sensor placement",
    title: "Where to watch a growing sewer",
    html: `
      <p class="lead">How many sensors a sewer needs, where to put them, and how much of the growth they catch.</p>
      <p class="muted">Simulation results for the Walkerville sample network. SA Water's own network data will replace
      this sample once it is released. The steps, the parameters and the questions stay the same.</p>
      <p class="muted">Draft for discussion.</p>`,
  },
  {
    id: "question",
    kicker: "The question",
    title: "Three things SA Water needs to know",
    html: `
      <div class="cards three">
        <div class="card"><h3>Where?</h3><p>Which manholes show growth first, and which ones see the most of it?</p></div>
        <div class="card"><h3>How many?</h3><p>How many sensors are enough before each extra one adds little?</p></div>
        <div class="card"><h3>How well?</h3><p>How much of the growth do they catch, in dry weather and in wet?</p></div>
      </div>`,
  },
  {
    id: "why",
    kicker: "Why it matters",
    title: "Growth can push downstream pipes past their spare room",
    html: `
      <ul class="points">
        <li>Each new house connected to the sewer adds flow to every pipe downstream of it.</li>
        <li>Downstream pipes have only so much spare room. When it runs out, water backs up toward the manholes and can overflow.</li>
        <li>Growth is gradual and planned. That means it can be seen coming, and sensors can be placed before it causes a problem.</li>
        <li>Most overflow records show blockages, which can hide growth-driven overflow. In US national records, wet-weather capacity problems caused about {{us_event_share}}% of overflow events but about {{us_volume_share}}% of the spilled volume.</li>
      </ul>`,
  },
  {
    id: "today",
    kicker: "Today",
    title: "Sensor sites are chosen one case at a time",
    html: `
      <ul class="points">
        <li>Sites are picked from breakdown history, hydraulic model results, complaints, and how close a manhole is to a creek or reservoir.</li>
        <li>There is no written method for how many sensors an area needs, or where they give the most visibility.</li>
        <li>The network has already moved from blanket coverage to a smaller number of critical manholes. That makes the choice of sites more important.</li>
      </ul>`,
  },
  {
    id: "others",
    kicker: "What others do",
    title: "Four ways researchers place sensors",
    html: `
      <div class="cards four">
        <div class="card"><h3>Rules of thumb</h3><p>Pick manholes by simple network shape, such as two up and two down from a busy junction.</p></div>
        <div class="card"><h3>Search for the best set</h3><p>Let a computer test many combinations under a budget, using greedy or genetic methods.</p></div>
        <div class="card"><h3>Learn from data</h3><p>Train models on flow and level records and use them to pick sites and rebuild levels elsewhere.</p></div>
        <div class="card"><h3>Score risk</h3><p>Weight each pipe by how likely it is to fail and how much harm a failure would cause.</p></div>
      </div>
      <p class="muted">Based on a review of {{review_sources}} published sources (Rijoy John, literature review).</p>`,
  },
  {
    id: "gaps",
    kicker: "What is missing",
    title: "Three gaps in the published work",
    html: `
      <ol class="points numbered">
        <li><strong>No shared way to score a placement.</strong> Every study measures something different, so their results can't be compared.</li>
        <li><strong>Sensors are assumed to see equally well everywhere.</strong> Only {{review_position_models}} of the {{review_sources}} sources model how a sensor's view depends on where it sits in the network.</li>
        <li><strong>None of them targets growth.</strong> No source asks where sensors should go so that they keep pace as new housing connects to an existing sewer.</li>
      </ol>`,
  },
  {
    id: "approach",
    kicker: "Our approach",
    title: "Four steps, from the network to a sensor plan",
    html: `
      <div class="steps">
        <div class="step"><span>1</span><h3>Model the network</h3><p>{{sites}} manholes and the pipes between them, built from SA Water's public records: pipe size, material and level.</p></div>
        <div class="step"><span>2</span><h3>Add growth everywhere</h3><p>New houses at every manhole, in {{cases}} weather and uncertainty cases. That is {{runs}} simulations in EPA SWMM, a standard sewer model.</p></div>
        <div class="step"><span>3</span><h3>Decide what a sensor sees</h3><p>A sensor sees growth when its manhole passes the alarm depth, or when it rises above its own normal level.</p></div>
        <div class="step"><span>4</span><h3>Choose sites and compare</h3><p>Greedy search, rules of thumb and random sets, all scored the same way on the same simulations.</p></div>
      </div>`,
  },
  {
    id: "parameters",
    kicker: "What we considered",
    title: "The main parameters, where they came from, and what is still to confirm",
    widgets: ["params_table"],
    html: `
      <p class="muted">Each value is measured, sourced, or declared by the team. Items marked <em>to confirm</em> are the first things to check with SA Water.</p>
      <div data-widget="params_table" data-key-only></div>`,
  },
  {
    id: "testset",
    kicker: "The test set",
    title: "{{runs}} simulated what-ifs",
    widgets: ["scenario_picker"],
    html: `
      <p>Each simulation adds houses at one manhole and asks which other manholes respond. It is run for every manhole, every growth size and every weather case.</p>
      <div data-widget="scenario_picker"></div>`,
  },
  {
    id: "before",
    kicker: "Before any growth",
    title: "Some trunk manholes are already over the alarm before any growth",
    widgets: ["baseline"],
    html: `
      <p>On a dry day, {{base_alarm_dry}} manholes are already over the 150 mm alarm before any new house connects. In severe wet weather it is {{base_alarm_severe}}.</p>
      <p class="muted">The trunk carries most of the flow, so it is the first to fill. On a fixed alarm these manholes give little early warning, because growth has to push them over a level they are already close to.</p>
      <div data-widget="baseline"></div>`,
  },
  {
    id: "growth",
    kicker: "Where growth shows",
    title: "Growth shows in many places, mostly in wet weather",
    widgets: ["growth_map"],
    html: `
      
      <div class="split">
        <div><ul class="points">
        <li>On a dry day, no growth of up to {{size_focus}} dwellings trips the alarm at any manhole.</li>
        <li>In design wet weather, {{size_focus}} new dwellings at one manhole raise at least one manhole by {{rise_focus_mm}} mm or more at {{wet_sites_rise25_150}} of the {{sites}} sites.</li>
      </ul></div>
        <div data-widget="growth_map"></div>
      </div>`,
  },
  {
    id: "alarmrule",
    kicker: "Which alarm works",
    title: "With a few sensors, a rise above normal catches more growth",
    widgets: ["rule_curves"],
    html: `
      <p>On a {{rise_focus_mm}} mm rise, one sensor already catches {{cov_r25_worst_worst_k1}}% of growth in the worst of the {{cases}} cases. A fixed {{alarm_mm}} mm alarm catches nothing until the fourth sensor.</p>
      <p>The rise rule leads up to {{rise_leads_until_mean}} sensors on average and up to {{rise_leads_until_worst}} in the worst case. After that the fixed alarm catches more: with {{max_sensors}} sensors it reaches {{cov_alarm_worst_worst_k10}}% in the worst case, against {{cov_r25_worst_worst_k10}}% on the rise.</p>
      <div class="caveat"><strong>The {{rise_focus_mm}} mm threshold is a declared value.</strong> It only works if normal day-to-day levels stay well below it. We do not have SA Water's level records yet, so this is the first thing to test.</div>
      <div data-widget="rule_curves"></div>`,
  },
  {
    id: "howmany",
    kicker: "How many sensors",
    title: "The first few sensors do most of the work",
    widgets: ["sensor_slider"],
    html: `
      <p>Pick a number of sensors and see where they go and how much growth they catch. "Worst case" is the weather case where the plan catches least. "Average" is across all {{cases}} cases.</p>
      <p class="muted">The worst case rises in jumps: one well-placed sensor can lift it a lot at once, when it covers much of the weakest case. The average grows more smoothly.</p>
      <div data-widget="sensor_slider"></div>`,
  },
  {
    id: "methods",
    kicker: "Which method",
    title: "A planned choice beats a random one by a wide margin",
    widgets: ["methods_bars"],
    html: `
      
      <div class="split">
        <div><ul class="points">
        <li><strong>Greedy</strong> adds, one at a time, the manhole that most improves the result. Its score uses the same simulations it was chosen from, so treat it as the best case, not a promise.</li>
        <li><strong>Random</strong> sets are the best of 20 random draws, scored the same way.</li>
        <li><strong>Rules of thumb</strong> that pick by network shape scored {{layout_score}}% in this test. That figure is the sandbox page's, and we have not recomputed it here.</li>
      </ul></div>
        <div data-widget="methods_bars"></div>
      </div>`,
  },
  {
    id: "efficiency",
    kicker: "Efficiency",
    title: "The first sensors do the most work",
    widgets: ["marginal_gain"],
    html: `
      <p>Each bar is the extra growth caught, on average across the cases, when one more sensor is added to the {{rise_focus_mm}} mm plan. The first sensor catches {{cov_r25_worst_mean_k1}}%. The second adds {{inc_r25_worst_mean_k2}} points.</p>
      <p>Beyond six sensors, each one adds at most {{inc_after6_max_r25_worst_mean}} points on average.</p>
      <div data-widget="marginal_gain"></div>
      <div class="cards two">
        <div class="card"><h3>Where first</h3><p>Start with the sites that show growth earliest. Add the rest as SA Water's development forecast confirms it.</p></div>
        <div class="card"><h3>What it costs</h3><p>Cost per sensor installed: <em>[unit cost, to supply from SA Water]</em>. Installation and telemetry: <em>[to supply]</em>.</p></div>
      </div>`,
  },
  {
    id: "cannot",
    kicker: "What we cannot say yet",
    title: "Limits of these results",
    widgets: ["sensitivity_table"],
    html: `
      
      <div class="split">
        <div><ul class="points">
        <li>The model is steady-state. It shows where growth appears and whether a sensor sees it, not how many minutes of warning it gives.</li>
        <li>The {{alarm_mm}} mm alarm and the {{rise_focus_mm}} mm threshold are assumptions until SA Water confirms its own settings.</li>
        <li>Normal day-to-day variation is not in the data yet. The rise threshold has to sit above it.</li>
        <li>Pump stations are modelled as ideal in the published runs. Their real rates are assumed.</li>
        <li>In the published runs, one overflow pipe carries everyday flow back into a pumping station's wet well, which no real station does. A corrected run is needed before final numbers.</li>
        <li>Nothing has been checked against real overflows or blockages yet.</li>
      </ul></div>
        <div data-widget="sensitivity_table"></div>
      </div>`,
  },
  {
    id: "asks",
    kicker: "What we need from SA Water",
    title: "What turns this into a recommendation",
    html: `
      <ol class="points numbered">
        <li><strong>The pilot area</strong>, and what "visibility" means to SA Water.</li>
        <li><strong>A hydraulic model</strong> of the network, if one exists. It would replace our public-data model.</li>
        <li><strong>Normal-day level records</strong> from any sensors already in place. They set the rise threshold.</li>
        <li><strong>Alarm depths</strong>, as set at each site.</li>
        <li><strong>Overflow and blockage history</strong>, split by cause, to test the results.</li>
        <li><strong>The development forecast</strong> by catchment, for timing.</li>
        <li><strong>Pump station rates and scope</strong>.</li>
        <li><strong>Unit costs</strong>, and the sensors already installed, with their types.</li>
      </ol>`,
  },
  {
    id: "next",
    kicker: "Next steps",
    title: "The project plan from here",
    html: `
      <div class="timeline">
        <div><strong>23 Oct</strong><span>Prototype on the pilot area, under both scenarios</span></div>
        <div><strong>6 Nov</strong><span>Scenario comparison and cost trade-off</span></div>
        <div><strong>13 Nov</strong><span>Guidelines for other networks</span></div>
        <div><strong>20 Nov</strong><span>Business case and handover pack</span></div>
      </div>
      <p class="muted">Dates from the project scoping draft. When SA Water's data arrives, the same simulations re-run on the pilot network, and this deck updates from the new results.</p>`,
  },
  {
    id: "a1",
    kicker: "Appendix A1",
    title: "Full parameter register",
    appendix: true,
    widgets: ["params_table"],
    html: `<div data-widget="params_table"></div>`,
  },
  {
    id: "a2",
    kicker: "Appendix A2",
    title: "How the numbers were checked",
    appendix: true,
    widgets: ["checks"],
    html: `<p class="muted">Each figure was recomputed from the saved simulation results and compared with the figure the sandbox page states.</p>
      <div data-widget="checks"></div>`,
  },
  {
    id: "a3",
    kicker: "Appendix A3",
    title: "Sources",
    appendix: true,
    html: `
      <ul class="points small">
        <li>SA Water, Walkerville sewer mains, manholes and property connections (public ArcGIS layers, republished by council).</li>
        <li>EPA Storm Water Management Model (SWMM), the simulation engine.</li>
        <li>Australian Bureau of Statistics (ABS), 2021: household size and people per connection.</li>
        <li>Barwon Water and WSAA Sewerage Code supplement: water use per person per day.</li>
        <li>Chow, V. T. (1959) Open-channel hydraulics: roughness values by pipe material.</li>
        <li>Do et al. (2023), Stonyfell sewer deployment: normal level ranges and the alarm reference.</li>
        <li>Ninh, Do, Zeng and Lambert (2025), topology and elevation sensor placement.</li>
        <li>John, R., literature review of sensor placement in sewerage networks (Adelaide University).</li>
      </ul>`,
  },
];
