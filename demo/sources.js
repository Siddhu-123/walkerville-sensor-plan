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
      html: `<p><b>x-axis:</b> number of level sensors in the plan, 1 to 10.<br><b>y-axis:</b> score under the 10 mm rise rule.</p>
        <p><b>Teal curve:</b> share of the 25 regional overloads warned at least one build-out step before the first manhole surcharges, when sensors are chosen without the weather case being tested (reaches 88%, or 11 of 13 plausible overloads, at 3 to 6 sensors, and 90%, or 12 of 13, at 7 to 10 sensors).</p>
        <p><b>Dark curve:</b> share of detectable growth runs seen by those same warning-first sensor sets in their worst wet weather case (rises from 25% at 3 sensors to 80% at 5 sensors and 90% at 10 sensors).</p>`,
      team: { page: 20, quote: "Exact and convex methods can be accurate but do not scale easily; greedy methods are efficient but can be locally suboptimal; evolutionary methods explore more alternatives but cost more computation." },
    },
    beats: {
      title: "Reading this chart",
      html: `<p><b>x-axis:</b> share of detectable regional growth seen on unseen weather (chosen on six wet cases and tested on the seventh left-out case).<br><b>y-axis:</b> level sensors versus float switches at $25,000 and $125,000 budgets.</p>
        <p>Prices are assumed ($25,000 per level sensor, $1,000 per float switch). A float switch earns credit when it sits at least 25 mm above normal depth, stays quiet on a Design wet day, and growth lifts water past it.</p>
        <p><b>Why floats drop on unseen weather:</b> a float trips at one fixed height, whereas normal water depth shifts with rainfall and infiltration. In a median of 2 of the 7 wet cases, chosen floats are already under water before any new homes connect.</p>`,
      team: { page: 9, quote: "Float or tilt devices can provide a robust threshold event, such as a high-level alarm, with a simple sensing principle. They do not provide the level history, rate of rise, or normal-pattern information available from a continuous sensor." },
    },
    holdout: {
      title: "Reading this chart",
      html: `<p><b>x-axis:</b> share of that wet weather case's detectable growth seen by five level sensors (10 mm rule).<br><b>y-axis:</b> five representative wet-weather and infiltration cases from Simulation 3.5.</p>
        <p><b>Dark bar:</b> the five level sensors chosen using all seven wet cases (91% average, 86% worst case). <b>Second bar:</b> five sensors chosen without that weather case and tested on it (76% average across left-out wet cases).</p>`,
      team: { page: 19, quote: "The method was robust in average reconstruction across SWMM parameter variants, but exact sensor locations changed with model parameterisation." },
    },
    answerstats: {
      title: "What these numbers mean",
      html: `<p><b>Overloads warned:</b> across the 7 wet weather cases, 13 region overloads happen by 100% of the 2041 housing projection (and 25 including the 150% and 300% stress steps). A sensor warns if it rises 10 mm or more at least one build-out step before the first manhole surcharges.</p>
        <p><b>Growth seen:</b> share of detectable regional growth runs where at least one of the five sensors rises 10 mm or more.</p>`,
    },
    stress: {
      title: "Reading this map and table",
      html: `<p>The map colours each pipe by its baseline depth-to-diameter ratio in the selected weather case. The table reports Simulation 3.5's capacity check at a declared ceiling of 0.7 of pipe bore across 400 random draws of 0.05-of-bore (7.5 mm on a 150 mm pipe) starting-level error.</p>
        <p><b>Runs out:</b> reaches 0.7 within the 2041 dwelling share in at least 80% of draws (R1 and R2). <b>Uncertain:</b> between 20% and 80% of draws (R4 and R8). <b>Room left:</b> under 20% of draws (R3, R5, R6, R7).</p>`,
    },
    gauge: {
      title: "Reading this gauge",
      html: `<p>A cut-through manhole. Blue is the water depth in mm. The grey line is this sensor's normal baseline depth. The dashed dark line is 10 mm above normal, which Simulation 3.5 uses to score early warning at least one step before surcharge. The dashed red line is a fixed 150 mm float-switch alarm.</p>`,
      team: { page: 9, quote: "Float or tilt devices can provide a robust threshold event, such as a high-level alarm, with a simple sensing principle. They do not provide the level history, rate of rise, or normal-pattern information available from a continuous sensor." },
    },
    register: {
      title: "Reading this table",
      html: `<p>Key assumptions and sensitivities measured in Simulation 3.5, and the utility records needed to replace them before field deployment.</p>`,
    },
  },
};
