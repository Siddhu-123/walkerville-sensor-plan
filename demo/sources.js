// Where each tag and citation in scenes.js comes from, and the info-button text for charts,
// tables and methods. Every page number and quote below was checked against the PDF in the
// team library (papers/sensor_papers). `web` lists published sources outside the library, linked directly.
//
// docs: library items, opened in the library's PDF viewer at `page`.
// src:  one entry per data-src key used in scenes.js.
//         lib   [{doc, page, says}]  the library page that backs the statement
//         web   [{title, url, says}] published sources outside the library
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
    simone2023: { id: "32", title: "Simone et al. (2023), Two different approaches for monitoring planning in sewer networks: topological vs. deterministic optimization", pdf: "./contributors/wimukthi/papers/Antonietta_2023_Two_different_approaches_for_monitoring_planning_in_sewer_networks.pdf" },
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
    },
    household: {
      lib: [],
      web: [
        { title: "ABS (2022), Walkerville: 2021 Census all persons QuickStats", url: "https://www.abs.gov.au/census/find-census-data/quickstats/2021/LGA48260", says: "Average number of people per household: 2.3." },
        { title: "Icon Water, WSA 02 gravity sewerage code supplement (STD-SPE-G-011)", url: "https://www.iconwater.com.au/sites/default/files/2025-10/STD-SPE-G-011%20WSA%2002%20Gravity%20Sewage%20Code%20Supplement.pdf", says: "Equivalent population per dwelling by density: low 3.5, medium 2.5, high 2." },
      ],
    },
    wateruse: {
      lib: [],
      web: [
        { title: "Barwon Water, Supplementary information to the WSAA Sewerage Code of Australia 2014", url: "https://www.barwonwater.vic.gov.au/__data/assets/pdf_file/0025/72529/Supplementary-information-to-the-WSAA-Sewerage-Code-of-Australia-2014.pdf", says: "Section 3.2.2: 200 L per person per day." },
        { title: "Icon Water, WSA 02 gravity sewerage code supplement (STD-SPE-G-011)", url: "https://www.iconwater.com.au/sites/default/files/2025-10/STD-SPE-G-011%20WSA%2002%20Gravity%20Sewage%20Code%20Supplement.pdf", says: "Uses 180 L per equivalent person per day." },
      ],
    },
    peak: {
      lib: [],
      gap: "Peak factor 2.0 is our assumption until SA Water's design figure replaces it.",
    },
    population: {
      lib: [],
      web: [
        { title: "ABS (2022), Walkerville: 2021 Census all persons QuickStats", url: "https://www.abs.gov.au/census/find-census-data/quickstats/2021/LGA48260", says: "Total people: 8,023." },
        { title: "Town of Walkerville (2021), SA Water sewer network", url: "https://services-ap1.arcgis.com/38lmAqtkEsaNGT6T/arcgis/rest/services/SA_Water_Sewer_Network/FeatureServer", says: "2,851 property connection points. 8,023 people over 2,851 connections gives 2.81 per existing home." },
      ],
    },
    infiltration: {
      lib: [],
      team: { page: 21, quote: "Rainfall-derived inflow and infiltration increases sewage volumes, reduces treatment efficiency and can overload a system during heavy rainfall, and the I&I rate is itself treated in the literature as an indicator of the operational and structural condition of the network." },
      web: [{ title: "Jaison (2026), gravity-sewer-osp, simulation_src/sim25.py", url: "https://github.com/AbrahamPaulJ/gravity-sewer-osp/blob/e6232db/simulation_src/sim25.py#L60", says: "0.11 L/s per 100 m meets the design envelope implied by the utility's own DN225 rating; the other cases are multiples beyond design." }],
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
    briefask: {
      lib: [{ doc: "team", page: 5, at: "defines the central problem as finding the optimal locations for float and level sensors", says: "The project brief asks for the best locations for float and level sensors, so that a minimum number of devices gives high monitoring capability across the network." }],
    },
    brieftype: {
      lib: [{ doc: "team", page: 9, at: "Float or tilt devices can provide a robust threshold event", says: "Float or tilt devices give a threshold event, such as a high-level alarm. They do not give the level history or rate of rise that a continuous sensor gives." }],
    },
    briefwatch: {
      lib: [{ doc: "team", page: 5, at: "intended value is earlier detection and prevention of overflows or overcapacity", says: "The intended value is earlier detection and prevention of overflows or overcapacity." }],
    },
    briefwithin: {
      lib: [{ doc: "team", page: 5, at: "Physical entry, installation, commissioning, and operational approval are outside this research stage", says: "Physical entry, installation, commissioning and operational approval are outside this research stage." }],
    },
    swmmnet: {
      lib: [{ doc: "swmm2", page: 19, at: "The conveyance portion of the drainage system is modeled with a network of Nodes and Links", says: "SWMM models the pipe network as nodes (junctions such as manholes) joined by links (pipes)." }],
    },
    swmmlevel: {
      lib: [{ doc: "swmm2", page: 41, at: "couples together the solution for both water levels at nodes and flow in conduits", says: "Dynamic wave analysis solves for the water level at every node and the flow in every pipe together, and accounts for backwater and pressurised flow." }],
    },
    manningeq: {
      lib: [
        { doc: "swmm2", page: 35, at: "SWMM uses the Manning equation to relate conduit flow rate to flow depth", says: "The Manning equation relates pipe flow to flow depth and slope, through a roughness coefficient n." },
        { doc: "swmm2", page: 179, at: "Sanitary sewers coated with sewage slime", says: "Table G-2 (source: Chow, 1959): roughness values for pipe materials, 0.013 for slime-coated sanitary sewers." },
      ],
      gap: "Chow (1959) itself is not in the library; the SWMM manual's roughness table is taken from it.",
    },
    simone: {
      lib: [
        { doc: "simone2023", page: 1, at: "does not require any hydraulic simulation", says: "The topological approach ranks manholes for sensors without any hydraulic simulation." },
        { doc: "simone2023", page: 6, at: "imposed by the slope of the pipes", says: "Flow directions in the test networks come from the slope of the pipes." },
      ],
    },
    steady: {
      lib: [],
      team: { page: 19, quote: "The SWMM model was physically grounded but not validated against field measurements, so it was used as a scenario generator rather than a calibrated operational digital twin." },
    },
    pumpsites: {
      lib: [],
      web: [
        { title: "Town of Walkerville (2021), SA Water sewer network", url: "https://services-ap1.arcgis.com/38lmAqtkEsaNGT6T/arcgis/rest/services/SA_Water_Sewer_Network/FeatureServer", says: "Pump station structures (layer 5) and rising mains (layer 8): three stations in the council area." },
        { title: "Jaison (2026), gravity-sewer-osp, EPA SWMM simulation assumption register (L7, X1)", url: "https://github.com/AbrahamPaulJ/gravity-sewer-osp/blob/e6232db/simulation25/data/index.js", says: "Two stations discharge into the modelled network, with 55 connections behind them. A third (11 connections) discharges outside it and is not modelled." },
      ],
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
        <p>For five sensors the worst case is the severe storm: 58% of the 1,042 detectable storm runs are seen. The other 42% only raise the water at manholes without a sensor.</p><p><b>Black:</b> our plan, adding one sensor at a time. <b>Light:</b> Random (best of 20 sets).</p>`,
      team: { page: 20, quote: "Exact and convex methods can be accurate but do not scale easily; greedy methods are efficient but can be locally suboptimal; evolutionary methods explore more alternatives but cost more computation." },
    },
    beats: {
      title: "Reading this chart",
      html: `<p><b>x-axis:</b> share of detectable growth seen in the worst weather case, same measure as the previous chart.<br><b>y-axis:</b> four ways to pick five sensors.</p>
        <p><b>Our plan:</b> adds whichever sensor raises the worst-case score most, five times over. <b>Random (best of 20 sets):</b> twenty random sets of five, keeping the best. <b>Deepest flow today:</b> the five manholes with the deepest normal flow, all on the trunk. <b>Most exposed alone:</b> the five manholes that each see the most growth on their own.</p>
        <p><b>Why two of them score so low:</b> deepest flow today puts four of its five sensors on 300 mm trunk manholes that already run 118 to 199 mm deep on a dry day. Even 150 new homes raise the level there by at most 19.6 mm, under the 25 mm a sensor needs to notice, and the chart scores each plan on its weakest weather case. Most exposed alone shares four of those five manholes, so it sees almost nothing new. In the workbench, the rule-of-thumb methods (largest catchment; two up, two down) pick the trunk too and stay at 0% up to ten sensors.</p>`,
      team: { page: 13, quote: "The objective is nondecreasing and submodular under the stated conditions, which gives the standard greedy algorithm an approximately 63% lower-bound guarantee relative to the optimum." },
    },
    holdout: {
      title: "Reading this chart",
      html: `<p><b>x-axis:</b> share of that weather case's detectable growth seen by five sensors.<br><b>y-axis:</b> the five weather cases.</p>
        <p><b>Black bar:</b> the recommended five, chosen using all five cases. <b>Second bar:</b> five chosen the same way using only the other four cases, then scored on the case left out. Red marks a drop of more than 5 points; grey means little change.</p>
        <p>A large drop means the plan depends on having seen that kind of weather.</p>`,
      team: { page: 19, quote: "The method was robust in average reconstruction across SWMM parameter variants, but exact sensor locations changed with model parameterisation." },
    },
    answerstats: {
      title: "What these two numbers mean",
      html: `<p><b>Worst case:</b> of the growth runs that raise water 25 mm or more somewhere, the share seen by one of the five sensors, in the weather case where the plan does worst (the severe storm).</p>
        <p><b>Average:</b> the same share averaged over the five weather cases.</p>`,
    },
    brief: {
      title: "Reading this table",
      html: `<p>Each row is one part of the brief: what was asked, where it is written (project request or scoping document section), and what it says.</p>`,
    },
    path: {
      title: "How the method changed",
      html: `<p>Simulation 1 tested warning time on a four-chamber test network. Simulation 2 looked at whole-catchment growth but was set aside after it missed sewer draining in from outside. The EPA SWMM simulation models all of Walkerville, and every result in this walk-through comes from it. Simulation 3 is the planned final version. It extends the model with growth spread over areas, new estates and eight weather cases, and is to be refined with SA Water's review and feedback on this prototype. None of its results are shown here.</p><p><a href="https://abrahampaulj.github.io/gravity-sewer-osp/simulation3/index.html" target="_blank" rel="noopener">Open Simulation 3</a></p>`,
    },
    growth: {
      title: "Two kinds of growth",
      html: `<p><b>Greenfield:</b> a new estate built on empty land, joining the network at one point. <b>Infill:</b> extra homes on existing lots, spread through streets that are already connected. Both add sewage flow; they differ in where it enters.</p>`,
    },
    stages: {
      title: "Terms on this slide",
      html: `<p><b>Level sensor:</b> measures water depth continuously, so a slow upward drift shows. <b>Float switch:</b> trips when the water reaches a set height, and reports only that it passed that point. <b>Surcharge:</b> water above the top of the pipe, standing up in the manhole.</p>`,
    },
    why: {
      title: "Reading this table",
      html: `<p>Each row is one way to tell a blockage from growth in a sensor's level record: how fast it starts, how it responds to weather, where it shows, and what happens afterwards.</p>`,
    },
    approach: {
      title: "Terms on this slide",
      html: `<p><b>Worst weather case:</b> the plan is scored in each of the five weather cases and judged by its lowest score, so it cannot rely on one kind of weather. <b>Share of growth seen:</b> of the runs that raise the water 25 mm or more somewhere, the share where at least one sensor sees that rise.</p>`,
    },
    capacity: {
      title: "Reading this table",
      html: `<p><b>Capacity check:</b> Manning's equation gives the most a pipe can carry when full, from its size, slope and roughness. It shows which pipe fills first, not how far water backs up behind it. <b>Simulation:</b> EPA SWMM routes the flow through every pipe and gives the water level at each manhole.</p>`,
    },
    data: {
      title: "Reading this table",
      html: `<p>Each row is one public data layer: what it covers, who publishes it, and what the model takes from it.</p>`,
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
      html: `<p>A cut-through manhole. Blue is the water depth, and the scale on the left is depth in mm. The grey line is this sensor's normal level. The dashed black line is 25 mm above it, the rise that counts as seeing growth. The dashed red line is the fixed 150 mm alarm a float switch would give.</p>`,
      team: { page: 9, quote: "Float or tilt devices can provide a robust threshold event, such as a high-level alarm, with a simple sensing principle. They do not provide the level history, rate of rise, or normal-pattern information available from a continuous sensor." },
    },
    register: {
      title: "Reading this table",
      html: `<p>Every assumption still in the model, its tag, and the SA Water data that would remove it. Hover a tag for its source.</p>`,
    },
  },
};
