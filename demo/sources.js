// Where each tag and citation in scenes.js comes from, and the info-button text for charts,
// tables and methods. Every page number and quote below was checked against the PDF in the
// team library (papers/sensor_papers). A source that is not in the library says so in `gap`
// instead of pointing somewhere close.
//
// docs: library items, opened in the library's PDF viewer at `page`.
// src:  one entry per data-src key used in scenes.js.
//         lib   [{doc, page, says}]  the library page that backs the statement
//         team  {page, quote}        the line in our compiled review that covers the point
//         gap   string               what is missing from the library, if anything
// tags: what each chip class means, shown at the top of the hover card.
// info: info-button text, keyed by the names used in each scene's `info` field.

window.OSP_LIB = {
  base: "https://siddhu-123.github.io/waste_water_network_sensor-papers/",

  docs: {
    team: { id: "team-compiled-paper", title: "Optimal Sensor Placement for Wastewater Network Monitoring (team compiled review)", pdf: "./contributors/team_compiled_paper.pdf" },
    sadata: { id: "abraham-sa-wastewater-data", title: "Public Wastewater Network Data in South Australia (Abraham)", pdf: "./contributors/abraham/compiled-papers/Public Wastewater Network Data in South Australia.pdf" },
    swmm2: { id: "SATYA-GL-01", title: "US EPA SWMM 5.2 Reference Manual, Vol. II: Hydraulics", pdf: "./contributors/satya-siddhartha/grey/GL_2017_USEPA_SWMM_Reference_Manual_Vol2_Hydraulics.pdf" },
    do2023: { id: "31", title: "Do et al. (2023), Proactive Detection of Wastewater Overflows for Smart Sanitary Sewer Systems: Case Study in South Australia", pdf: "./contributors/abraham/papers/2023_Do_Stonyfell-SA-overflow-detection.pdf" },
    he2026: { id: "55", title: "He et al. (2026), A topology-first and demand-driven sensor placement framework for urban drainage networks", pdf: "./contributors/rijoy-john/papers/2026_Li He_A topology-first and demand-driven sensor placement framework for.pdf" },
  },

  tags: {
    measured: "Measured: read straight from SA Water's published records.",
    derived: "Derived: computed from published data, not read directly.",
    sourced: "Sourced: a standard value taken from a published reference.",
    checked: "Checked: cross-checked against a second published field.",
    declared: "Declared: our assumption until SA Water data replaces it.",
    ideal: "Ideal: a simplification in the model, stated so it can be replaced.",
    confirm: "Open: needs SA Water data or a model fix before final numbers.",
  },

  src: {
    inverts: {
      lib: [{ doc: "sadata", page: 2, at: "START_INVE 100% 28.15 to 59.15 m upstream invert, usable", says: "START_INVE and END_INVERT are filled on 100% of records and usable." }],
      team: { page: 23, quote: "Maintenance-hole depth is cover level minus invert level. Because pipe inverts are available and contour lines supply a surface approximation, the updated assessment measured contour-interpolated cover levels against surveyed values." },
    },
    cover: {
      lib: [{ doc: "sadata", page: 2, at: "Depth of an access point is ground level minus the pipe invert level", says: "Ground contours at 1 m steps; depth is ground level minus the pipe invert." }],
      team: { page: 24, quote: "Table 10: Contour-interpolated cover-level error reported in the updated data assessment." },
    },
    direction: {
      lib: [{ doc: "sadata", page: 3, at: "The flow-direction field cannot be dismissed as a drafting artefact and skipped.", says: "The flow-direction field says which vertex is upstream; it cannot be skipped as a drafting artefact." }],
      team: { page: 23, quote: "Maintenance-hole depth is cover level minus invert level. Because pipe inverts are available and contour lines supply a surface approximation, the updated assessment measured contour-interpolated cover levels against surveyed values." },
    },
    slope: {
      lib: [{ doc: "sadata", page: 3, at: "Layer 9 carries invert levels at each end, nominal diameter, flow direction, material and status", says: "Layer 9 carries invert levels at each end, nominal diameter, flow direction, material and status." }],
      team: { page: 17, quote: "…using diameter D, slope I, and roughness n – the same attributes carried by the project's own GIS pipe data (diameter and grade are populated fields in the Walkerville extract; roughness is not)." },
    },
    diameter: {
      lib: [{ doc: "sadata", page: 3, at: "Layer 9 carries invert levels at each end, nominal diameter, flow direction, material and status", says: "Layer 9 carries invert levels at each end, nominal diameter, flow direction, material and status." }],
      team: { page: 17, quote: "…using diameter D, slope I, and roughness n – the same attributes carried by the project's own GIS pipe data (diameter and grade are populated fields in the Walkerville extract; roughness is not)." },
    },
    material: {
      lib: [{ doc: "sadata", page: 2, at: "MATERIAL 55% mostly vitrified clay 456 records unknown", says: "MATERIAL is 55% filled, mostly vitrified clay; 456 records unknown." }],
      team: { page: 17, quote: "…using diameter D, slope I, and roughness n – the same attributes carried by the project's own GIS pipe data (diameter and grade are populated fields in the Walkerville extract; roughness is not)." },
    },
    manning: {
      lib: [
        { doc: "swmm2", page: 179, at: "Sanitary sewers coated with sewage slime", says: "Table G-2 (source: Chow, 1959): clay pipe n from 0.011 to 0.017; 0.013 for drainage tile and slime-coated sanitary sewers." },
        { doc: "sadata", page: 4, at: "Roughness must be assumed, not read. No public source carries usable roughness.", says: "Roughness must be assumed, not read. No public source carries usable roughness." },
      ],
      team: { page: 10, quote: "Level-derived Manning estimates are useful for a benchmark where geometry and roughness are known, but roughness is often missing or assumed." },
      gap: "The uPVC value (0.010) is not in the library: Table G-2 has no plastic pipe row.",
    },
    household: {
      lib: [],
      gap: "ABS 2021 Census household size is not in the library yet. Rijoy's Icon Water supplement to WSA 02 (low 3.5, medium 2.5, high density 2 EP per dwelling) is also not in it.",
    },
    wateruse: {
      lib: [],
      gap: "The Barwon Water WSAA supplement (s3.2.2, 200 L per person per day) is not in the library yet. The Icon Water supplement Rijoy showed uses 180 L/EP/day.",
    },
    peak: {
      lib: [],
      gap: "Peak factor 2.0 is our assumption. No library document gives this value.",
    },
    population: {
      lib: [],
      gap: "ABS 2021 population (8,023 people over 2,851 connections) is not in the library yet.",
    },
    infiltration: {
      lib: [],
      team: { page: 21, quote: "Rainfall-derived inflow and infiltration increases sewage volumes, reduces treatment efficiency and can overload a system during heavy rainfall, and the I&I rate is itself treated in the literature as an indicator of the operational and structural condition of the network." },
      gap: "The source of the 0.11 L/s per 100 m design rating is not in the library yet.",
    },
    alarm: {
      lib: [
        { doc: "do2023", page: 4, at: "300 mm were set at each sensor for a low- and high-priority alarm", says: "Alarms of 150 mm and 300 mm were set at each sensor; normal levels ranged from 20 to 75 mm." },
        { doc: "do2023", page: 8, at: "exceedance alarm (generally set at 150 mm) results in a high", says: "The low-level exceedance alarm (generally set at 150 mm) gives a high number of alarms." },
      ],
      team: { page: 9, quote: "Initial fixed thresholds of 150 mm and 300 mm generated severe operational alarm fatigue: the 150 mm threshold alone produced over 100,000 low-priority alarms in 2019, swamping operational response teams." },
    },
    levelsensor: {
      lib: [{ doc: "do2023", page: 4, at: "from 20 to 75 mm, showing that wastewater generally flows within", says: "Normal levels in Stonyfell ranged from 20 to 75 mm." }],
      team: { page: 9, quote: "Float or tilt devices can provide a robust threshold event, such as a high-level alarm, with a simple sensing principle. They do not provide the level history, rate of rise, or normal-pattern information available from a continuous sensor." },
    },
    maprule: {
      lib: [{ doc: "he2026", page: 3, at: "The k-hop depth is set to 10 in this study", says: "Definition 2: the k-hop neighbourhood of a node; k is set to 10 in this study." }],
    },
    steady: {
      lib: [],
      team: { page: 19, quote: "The SWMM model was physically grounded but not validated against field measurements, so it was used as a scenario generator rather than a calibrated operational digital twin." },
    },
    pumps: {
      lib: [],
      gap: "Pump station rates are not published. Modelled as passing all flow at once until SA Water shares them.",
    },
    modelfix: {
      lib: [],
      gap: "Internal model issue (relief pipes return everyday flow to a pump well). No outside source applies.",
    },
    validation: {
      lib: [],
      team: { page: 19, quote: "The SWMM model was physically grounded but not validated against field measurements, so it was used as a scenario generator rather than a calibrated operational digital twin." },
      gap: "Field check waits on SA Water's overflow and blockage history.",
    },
  },

  info: {
    frontier: {
      title: "Reading this chart",
      html: `<p><b>x-axis:</b> number of sensors in the plan, 1 to 10.<br><b>y-axis:</b> share of detectable growth the plan sees, in the weather case where it does worst.</p>
        <p>Each simulation connects new homes at one manhole (328 manholes × 5 sizes × 5 weather cases = 8,200 runs). A run is <b>detectable</b> when at least one manhole rises 25 mm or more; 3,448 runs are. The plan <b>sees</b> a run when one of its sensors rises 25 mm or more. 100% would mean every detectable run is seen.</p>
        <p>For five sensors the worst case is the dry day: 61% of the 380 detectable dry-day runs are seen. The other 39% only raise the water at manholes without a sensor.</p>
        <p><b>Black:</b> best set for each size, found by an exact integer program. <b>Dark grey:</b> Greedy (one at a time). <b>Light:</b> Random (best of 20 sets).</p>`,
      team: { page: 20, quote: "Exact and convex methods can be accurate but do not scale easily; greedy methods are efficient but can be locally suboptimal; evolutionary methods explore more alternatives but cost more computation." },
    },
    beats: {
      title: "Reading this chart",
      html: `<p><b>x-axis:</b> share of detectable growth seen in the worst weather case, same measure as the previous chart.<br><b>y-axis:</b> five ways to pick five sensors.</p>
        <p><b>Our plan:</b> the best set of five. <b>Greedy (one at a time):</b> adds whichever sensor raises the score most, five times over. <b>Random (best of 20 sets):</b> twenty random sets of five, keeping the best. <b>Deepest flow today:</b> the five manholes with the deepest normal flow, all on the trunk. <b>Most exposed alone:</b> the five manholes that each see the most growth on their own.</p>
        <p><b>Why two of them score so low:</b> deepest flow today puts four of its five sensors on 300 mm trunk manholes that already run 118 to 199 mm deep on a dry day. Even 150 new homes raise the level there by at most 19.6 mm, under the 25 mm a sensor needs to notice, and the chart scores each plan on its weakest weather case. Most exposed alone shares four of those five manholes, so it sees almost nothing new. In the workbench, the rule-of-thumb methods (largest catchment; two up, two down) pick the trunk too and stay at 0% up to ten sensors.</p>`,
      team: { page: 13, quote: "The objective is nondecreasing and submodular under the stated conditions, which gives the standard greedy algorithm an approximately 63% lower-bound guarantee relative to the optimum." },
    },
    holdout: {
      title: "Reading this chart",
      html: `<p><b>x-axis:</b> share of that weather case's detectable growth seen by five sensors.<br><b>y-axis:</b> the five weather cases.</p>
        <p><b>Black bar:</b> the recommended five, chosen using all five cases. <b>Second bar:</b> the best five chosen using only the other four cases, then scored on the case left out. Red marks a drop of more than 5 points; grey means little change.</p>
        <p>A large drop means the plan depends on having seen that kind of weather.</p>`,
      team: { page: 19, quote: "The method was robust in average reconstruction across SWMM parameter variants, but exact sensor locations changed with model parameterisation." },
    },
    answerstats: {
      title: "What these two numbers mean",
      html: `<p><b>Worst case:</b> of the growth runs that raise water 25 mm or more somewhere, the share seen by one of the five sensors, in the weather case where the plan does worst (the dry day).</p>
        <p><b>Average:</b> the same share averaged over the five weather cases.</p>`,
    },
    brief: {
      title: "Reading this table",
      html: `<p>Each row is one part of the brief: what was asked, where it is written (project request or scoping document section), and what it says.</p>`,
    },
    path: {
      title: "How the method changed",
      html: `<p>Simulation 1 tested warning time on a four-chamber test network. Simulation 2 looked at whole-catchment growth but was set aside after it missed sewer draining in from outside. Simulation 2.5 models all of Walkerville in SWMM, and every result in this walk-through comes from it.</p>`,
    },
    swmm: {
      title: "Reading this table",
      html: `<p>Columns compare two ways of judging what a sensor can see. <b>Map rule:</b> count pipes within a set number of links on the pipe map. <b>SWMM:</b> route the flow and compute the water depth at every manhole.</p>
        <p>Rows: what each approach treats as visible, how it handles a pipe that is already full, and whether it can add new homes.</p>`,
      team: { page: 19, quote: "The SWMM model was physically grounded but not validated against field measurements, so it was used as a scenario generator rather than a calibrated operational digital twin." },
    },
    cases: {
      title: "The five weather cases",
      html: `<p>Infiltration into the pipes is not measured yet, so each growth test ran five ways: <b>Dry day</b> (sewage only), <b>Design wet</b> (0.11 L/s per 100 m, the utility's design rating), <b>Storm</b> (0.4 L/s per 100 m), <b>Leaky old pipes</b> (design wet, more in older pipes), and <b>Extra inflow</b> (design wet, outside inflow × 1.5).</p>`,
    },
    stress: {
      title: "Reading this map",
      html: `<p>Each pipe's ratio is the average water depth at its end manholes divided by its diameter; pipes with no end manhole are faint. Colours show under 25%, 25–50%, 50–75%, 75–100%, and over 100% (surcharged), from pale amber to deep red.</p>`,
    },
    params: {
      title: "Reading this table",
      html: `<p>Each row is one model input: what it is, the value used, and where it comes from. The tag says how far to trust it. Hover a tag to see its source and open it in the team library.</p>`,
    },
    gauge: {
      title: "Reading this gauge",
      html: `<p>A cut-through manhole. Blue is the water depth. The dashed black line is the 25 mm rise above normal that counts as seeing growth; the red line is the fixed 150 mm alarm a float switch would give.</p>`,
      team: { page: 9, quote: "Float or tilt devices can provide a robust threshold event, such as a high-level alarm, with a simple sensing principle. They do not provide the level history, rate of rise, or normal-pattern information available from a continuous sensor." },
    },
    register: {
      title: "Reading this table",
      html: `<p>Every assumption still in the model, its tag, and the SA Water data that would remove it. Hover a tag for its source.</p>`,
    },
  },
};
