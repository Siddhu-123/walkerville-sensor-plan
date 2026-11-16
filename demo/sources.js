// Where each tag and citation in scenes.js comes from, and the info-button text for charts,
// tables and methods. Library page numbers and quotes were read against the PDFs in the
// team library (library/sensor_papers); web entries link to the published source. `web` lists published sources outside the library, linked directly.
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
    he2026: { id: "55", title: "He et al. (2026), A topology-first and demand-driven sensor placement framework for hydraulic-state reconstruction in urban drainage networks", pdf: "./contributors/rijoy-john/papers/2026_Li He_A topology-first and demand-driven sensor placement framework for.pdf" },
    ninh2025: { id: "30", title: "Ninh et al. (2025), Optimal Sensor Placement in Smart Sewer Systems Using Network Topology and Elevation", pdf: "./contributors/abraham/papers/2025_Ninh_topology-elevation-sensor-placement.pdf" },
    moradi2026: { id: "28", title: "Moradi and Najafi (2026), Risk-Driven Sensor Placement in Sewer Networks: A Descriptive-Predictive-Prescriptive Framework", pdf: "./contributors/rijoy-john/papers/Moradi_2026_Risk_based_DPP-SP_framework_for_sewer_OSP.pdf" },
    kimbrough2019: { id: "ASHIS-GL-17", title: "Kimbrough (2019), Optimal Sensor Placement for Sewer Capacity Risk Management (PhD dissertation)", pdf: "./contributors/ashis-jose/grey/ASHIS-GL-17_Kimbrough_2019_Sewer_Capacity_Risk_Sensor_Placement_Dissertation.pdf" },
    ciwem2017: { id: "ASHIS-GL-03", title: "CIWEM UDG (2017), Code of Practice for the Hydraulic Modelling of Urban Drainage Systems", pdf: "./contributors/ashis-jose/grey/ASHIS-GL-03_CIWEM_Code_of_Practice_Hydraulic_Modelling_2017.pdf" },
    sydneywater2021: { id: "GL-10", title: "Sydney Water (2021), Wastewater Network Planning Guideline", pdf: "./contributors/rijoy-john/grey/GL_2021_SydneyWater_Wastewater_Network_Planning_Guideline.pdf" },
    vancouver2014: { id: "GL-38", title: "Metro Vancouver (2014), Inflow and Infiltration Allowance Assessment", pdf: "./contributors/rijoy-john/grey/GL_2014_MetroVancouver_II_Allowance_Assessment.pdf" },
    drenoyanis2022: { id: "41", title: "Drenoyanis et al. (2022), Detecting Wastewater Blockages with Digital Water Meters? A Survey of Methods Used by Sydney Water", pdf: "./contributors/wimukthi/papers/Drenoyanis_2022_Detecting-Wastewater-Blockages-with-Digital-Water-Meters.pdf" },
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
        { doc: "swmm2", page: 179, at: "Sanitary sewers coated with sewage slime", says: "Table G-2 (source: Chow, 1959): clay drainage tile n 0.011 to 0.017 (normal 0.013); vitrified clay sewer 0.011 to 0.017 (normal 0.014); sanitary sewers coated with sewage slime 0.012 to 0.016 (normal 0.013)." },
        { doc: "sadata", page: 4, at: "Roughness must be assumed, not read. No public source carries usable roughness.", says: "Roughness must be assumed, not read. No public source carries usable roughness." },
      ],
      team: { page: 10, quote: "Level-derived Manning estimates are useful for a benchmark where geometry and roughness are known, but roughness is often missing or assumed." },
    },
    household: {
      lib: [{ doc: "vancouver2014", page: 55, at: "design procedures assume 3 persons per dwelling", says: "Auckland's WaterCare default design parameters assume 3 persons per dwelling." }],
      web: [
        { title: "ABS (2022), Walkerville: 2021 Census all persons QuickStats", url: "https://www.abs.gov.au/census/find-census-data/quickstats/2021/LGA48260", says: "Average number of people per household: 2.3." },
        { title: "Icon Water, WSA 02 gravity sewerage code supplement (STD-SPE-G-011)", url: "https://www.iconwater.com.au/sites/default/files/2025-10/STD-SPE-G-011%20WSA%2002%20Gravity%20Sewage%20Code%20Supplement.pdf", says: "Equivalent population per dwelling by density: low 3.5, medium 2.5, high 2." },
      ],
    },
    wateruse: {
      lib: [{ doc: "sydneywater2021", page: 15, at: "Future population discharge is 150 l/p/d", says: "Sydney Water plans future residential discharge at 150 L per person per day, below the 180 to 200 L used here." }],
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
        { title: "Town of Walkerville (2021), SA Water sewer network", url: "https://services-ap1.arcgis.com/38lmAqtkEsaNGT6T/arcgis/rest/services/SA_Water_Sewer_Network/FeatureServer", says: "2,851 property connection points. 8,023 people over 2,851 connection points gives 2.81 people per connection point." },
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
      lib: [{ doc: "ninh2025", page: 3, at: "two float sensors are set corre", says: "In the South Australian trial, two float sensors per manhole are set at a low and a high alarm level; below them they send only a healthy pulse." }, { doc: "do2023", page: 4, at: "from 20 to 75 mm, showing that wastewater generally flows within", says: "Normal levels in Stonyfell ranged from 20 to 75 mm." }],
      team: { page: 9, quote: "Float or tilt devices can provide a robust threshold event, such as a high-level alarm, with a simple sensing principle. They do not provide the level history, rate of rise, or normal-pattern information available from a continuous sensor." },
    },
    maprule: {
      lib: [{ doc: "he2026", page: 3, at: "The k-hop depth is set to 10 in this study", says: "Definition 2: the k-hop neighbourhood of a node; k is set to 10 in this study." }],
    },
    briefask: {
      lib: [{ doc: "team", page: 5, at: "defines the central problem as finding the optimal locations for float and level sensors", says: "The project brief asks for the best locations for float and level sensors, so that a minimum number of devices gives high monitoring capability across the network." }],
    },
    request: {
      lib: [{ doc: "team", page: 5, at: "defines the central problem as finding the optimal locations for float and level sensors", says: "The project brief (request.pdf, WIL Schedule 2) asks to identify the optimal sensor locations and number of sensors, develop a model for sensor placement and deployment density, and deliver recommended sensor locations and densities." }],
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
    sim4tool: {
      lib: [],
      web: [
        {
          title: "Simulation 4 online tool (Walkerville sewer sensor placement)",
          url: "https://abrahampaulj.github.io/gravity-sewer-osp/simulation4/index.html",
          says: "Interactive Simulation 4 web tool for the Walkerville EPA SWMM 5.2 model, with region triage, staged sensor plans, level-versus-float comparisons and wet-weather holdout tests.",
        },
      ],
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
      lib: [{ doc: "ciwem2017", page: 105, at: "There would generally be a verification report produced", says: "Section 8.5: a model is verified against a flow survey, with the monitor and rain gauge sites and their reasons recorded." }],
      team: { page: 19, quote: "The SWMM model was physically grounded but not validated against field measurements, so it was used as a scenario generator rather than a calibrated operational digital twin." },
      gap: "Field check waits on utility overflow and blockage history.",
    },
    limit: {
      lib: [{ doc: "kimbrough2019", page: 87, at: "water level in wastewater pipes is the area above 70% full", says: "The critical water level in wastewater pipes is above 70% full; time spent there escalates surcharge risk rapidly." }],
      gap: "Used as a planning limit; the utility's own design limit should replace it.",
    },
    greedy: {
      lib: [{ doc: "moradi2026", page: 11, at: "greedy is guaranteed to achieve at least 63% of the optimal", says: "Coverage is submodular, so greedy selection is guaranteed at least 63% of the optimum." }],
    },
    riserule: {
      lib: [
        { doc: "do2023", page: 4, at: "from 20 to 75 mm, showing that wastewater generally flows within", says: "Normal levels in Stonyfell ranged from 20 to 75 mm." },
        { doc: "drenoyanis2022", page: 1, at: "measure every 15 minutes the sewer height with centimetres", says: "Sydney Water's ultrasonic and radar sensors read sewer height every 15 minutes with centimetre accuracy." },
      ],
      web: [{ title: "VEGA, VEGAPULS C 21 radar level sensor (product data)", url: "https://www.vega.com/en/products/product-catalog/level/radar/vegapuls-c-21", says: "Accuracy ±2 mm, range 20 m; recommended by VEGA for sewer mains." }],
      gap: "No published source sets a 10 mm or 25 mm detection rule; both are model choices to test on measured levels.",
    },
    floatheight: {
      lib: [
        { doc: "ninh2025", page: 3, at: "two float sensors are set corre", says: "In the South Australian trial, float sensors sit at a low alarm (150 mm) and a high alarm." },
        { doc: "drenoyanis2022", page: 1, at: "Level switches/float sensors, which generate an alarm when a pre-defined sewer level is reached", says: "Float sensors generate an alarm when a pre-defined sewer level is reached." },
      ],
      web: [
        { title: "Sulzer, ABS KS float switch for wastewater and sewage (product data)", url: "https://www.sulzer.com/en/shared/products/float-switch-type-abs-ks", says: "The minimum cable length is 50 mm, which corresponds to a minimum switching differential of 100 mm." },
        { title: "APG, TLS dual-point cable float switch (product data)", url: "https://apgsensors.com/product/dual-point-cable-suspended-float-switch/", says: "Switching differential 0.27 to 1 m (TLS-6) and 0.33 to 4 m (TLS-8)." },
      ],
      gap: "The 25 mm height is a model setting that favours float switches; a real sewage float switches over at least 100 mm.",
    },
    price: {
      lib: [],
      gap: "No published unit prices for level sensors or float switches; both prices are planning inputs until quotes replace them.",
    },
    kim2022: {
      lib: [],
      web: [
        {
          title: "Kim et al. (2022), Journal of Environmental Management, 320, 115806",
          url: "https://doi.org/10.1016/j.jenvman.2022.115806",
          says: "Optimal allocation and operation of sewer monitoring sites for wastewater-based disease surveillance: A methodological proposal. Simulation 4 adapts recursive spatial bisection by cutting at pipe ends rather than manholes, including loops, and allowing a manhole to sit in two regions where flow divides.",
        },
      ],
    },
    sim4: {
      lib: [],
      web: [
        {
          title: "Jaison (2026), gravity-sewer-osp main @ 10e6852, simulation4",
          url: "https://github.com/AbrahamPaulJ/gravity-sewer-osp/tree/10e6852/simulation4",
          says: "Simulation 4 EPA SWMM 5.2 results across 890 pipes, 328 manholes, 9 regions (8 spatial-bisection regions plus R9 Walkerville Terrace corridor), 7 build-out steps (0.1 to 3 times 2041 projections) and 8 weather cases.",
        },
      ],
      team: { page: 19, quote: "The SWMM model was physically grounded but not validated against field measurements, so it was used as a scenario generator rather than a calibrated operational digital twin." },
    },
  },

  info: {
    built: {
      title: "Project deliverables and repository artefacts",
      html: `<p><b>1 · Sensor review:</b> literature review of level, flow and float sensors and of sensor placement methods in wastewater networks. It finds that no single sensor suits every task, and water level alone is not flow when backwater or geometry is uncertain.</p>
        <p><b>2 · Parameter catalogue:</b> network and placement parameters needed for overflow-risk and sensor-placement modelling, with source evidence and status for each.</p>
        <p><b>3 · Data availability matrix:</b> 19 public South Australian and Australian sewer datasets checked for coverage, usable attributes and gaps.</p>
        <p><b>4 · Walkerville model and simulation tool:</b> an EPA SWMM 5.2 hydraulic model of 328 manholes and 890 pipes, with <a href="https://abrahampaulj.github.io/gravity-sewer-osp/simulation4/index.html" target="_blank" rel="noopener">Simulation 4 online</a> covering 9 regions, 7 growth steps and 8 weather cases.</p>`,
    },
    method: {
      title: "How the method works in Simulation 4",
      html: `<p><b>Regions:</b> instead of hand-picked suburb boundaries (100 to 829 existing homes), Simulation 4 adapts recursive spatial bisection from Kim et al. (2022) to cut 8 regions of 233 to 418 existing homes (ideal 321), plus R9, the Walkerville Terrace corridor (179 existing homes, 485 projected homes) overlapping them. Unlike Kim et al. (2022) (who placed sensors for disease surveillance and cut at manholes), Simulation 4 cuts at pipe ends on the looped SWMM network and lets a manhole sit in two regions where flow divides.</p>
        <p><b>Build-out steps:</b> each region is built out on its own at 0.1, 0.25, 0.5, 0.75, 1.0, 1.5 and 3.0 times its 2041 figure. The 1.5 and 3.0 stress steps explain why homes-to-limit ranges can extend past the 2041 projection.</p>
        <p><b>Staged plan:</b> Simulation 4 builds a greedy staged plan from 1 to 8 continuous level sensors across the 5 target regions (R1, R3, R4, R7 and R9) up to 100% build-out.</p>`,
    },
    problem: {
      title: "Baseline surcharge vs 2041 growth",
      html: `<p><b>Baseline today:</b> before any 2041 homes connect, the Simulation 4 EPA SWMM 5.2 model has 7 manholes surcharged (water above the pipe top, 0 spilling) on a design wet day (0.11 L/s per 100 m), 107 surcharged (1 spilling) in beyond-design wet weather (0.25 L/s per 100 m), and 141 surcharged (6 spilling) in severe wet weather (0.40 L/s per 100 m).</p>
        <p><b>Growth vs weather:</b> at full 2041 build-out on a design wet day, 5 regions (R1, R3, R4, R7 and R9) raise water by 10 mm or more (assumed rule) in at least one manhole and 4 regions (R2, R5, R6 and R8) do not, yet no manhole newly surcharges and none spills. Across all 7 wet cases up to 100% build-out (315 runs), 50 runs show a new surcharge and 1 shows a new spill across 14 manholes, giving 11 region-weather overloads in wetter cases. Wet weather drives pipe filling far more than 2041 housing growth on its own.</p>`,
    },
    regions: {
      title: "Region triage, R9 overlap and per-case bands",
      html: `<p><b>Triage vs sensor scope:</b> region triage uses a design wet day only at a pipe limit of 70% of pipe depth (assumed), whereas the 5-sensor staged plan is scored across all 7 wet cases. Growth was tested at 0.1, 0.25, 0.5, 0.75, 1, 1.5 and 3 times each region's 2041 figure, so the homes-to-limit ranges (10th to 90th percentile to the 0.7 limit) can extend past 2041.</p>
        <p><b>Why R9 overlaps other regions:</b> R9 is the Walkerville Terrace corridor (179 existing homes, 485-home anchor in Simulation 4). Because the corridor follows the main road across the suburb, its manholes overlap the equal-home regions (R1 to R8) that it crosses, and it is drawn with a dashed outline on the map.</p>
        <p><b>Bands across the 7 wet cases</b> (O = runs out, U = uncertain, R = room left, A = already over the 0.7 limit before growth):<br>
        <b>R1 (Watch, 54 homes, 12 to 78 to the 0.7 limit):</b> U O O U O A A (runs out in 3 of 7 cases, already over in 2).<br>
        <b>R2 (Room on a design wet day, 49 homes, 53 to beyond the top step):</b> R U A R R U U.<br>
        <b>R3 (Monitor, 54 homes, 2 to 59 to the 0.7 limit):</b> O O A R O A A (runs out in 3 of 7, already over in 3).<br>
        <b>R4 (Watch, 54 homes, 15 to 79 to the 0.7 limit):</b> U A A U O A U.<br>
        <b>R5 (Room on a design wet day, 40 homes, not reached):</b> R R R R R R R (the only region that keeps room in all 7 wet cases).<br>
        <b>R6 (Room on a design wet day, 60 homes, not reached):</b> R R A R R R R.<br>
        <b>R7 (Monitor, 55 homes, 6 to 71 to the 0.7 limit):</b> O A A R O A A.<br>
        <b>R8 (Room on a design wet day, 71 homes, not reached on a design wet day):</b> R A A R R A A (already over the 0.7 limit before growth in 4 of 7 wet cases).<br>
        <b>R9 (Watch, 485-home anchor, 90 to 1,271 to the 0.7 limit):</b> U A A U U A A.</p>`,
    },
    sensors: {
      title: "Rise rule, solver choice and stand-in zones",
      html: `<p><b>What 16 of 16 and 11 of 11 mean:</b> on a design wet day there are 16 detectable target-region growth runs, and across all 7 wet cases there are 11 region-weather pairs that newly surcharge or spill. Two sensors in the staged plan already warn of all 11 of 11 overloads; sensors 3 to 5 lift coverage to 81% in the worst case, 94% on average. One simulated run moves a weather case's score by 5 to 7 percentage points, so 94% and 92% are the same within noise.</p>
        <p><b>Assumed 10 mm rule vs normal variation:</b> every headline score uses a 10 mm water-level rise rule (assumed). Sensor 1 (manhole 4450531) first reacts at +12.4 mm with 14 new homes in R3. In the Stonyfell study of Do et al. (2023), normal dry-weather levels varied from 20 to 75 mm. Whether a 10 mm rise from housing growth can be told apart from day-to-day flow variation is untested. Under the stricter 25 mm rule (dashed chart line), 5 sensors see 36% in the worst case, 45% on average.</p>
        <p><b>Staged plan vs exact solver and stand-in zones:</b> the 5 sensors come from a greedy staged plan (81% in the worst case, 94% on average). An unnested exact solver reaches 88% in the worst case, 94% on average with a different 5-sensor set, and at least 96 five-sensor sets tie for best on a design wet day. Each pick represents a monitoring zone with equal-score stand-ins:<br>
        <b>1 · Sensor 1:</b> design-wet-day anchor; 4 stand-ins with the same score, of which the nearest 3 are MH4450391, MH4450137 and MH4449796.<br>
        <b>2 · Sensor 2 (manhole 4448345):</b> wetter-weather R1 and R4 branch; brings warnings to 11 of 11 overloads; 0 stand-ins (without it, warnings drop to 9 of 11).<br>
        <b>3 · Sensor 3 (manhole 4450922):</b> reacts at 27 homes in R1 (+13.3 mm); only sensor here seeing the age-weighted design wet case; surcharged before growth (worth a site check); 3 stand-ins (MH4451207, MH4451871 and MH4452011).<br>
        <b>4 · Sensor 4 (manhole 4452994):</b> sits in R2 to catch through-flow from R9 and R3; 23 stand-ins (nearest 3 are MH4453489, MH4453579 and MH4453970).<br>
        <b>5 · Sensor 5 (manhole 4428268):</b> upper R1 and R4 wetter-weather watcher; 0 stand-ins.</p>
        <p><b>Fewest sensors by weather covered:</b> in Simulation 4's "Fewest sensors by weather covered" table (separate from the 1-to-8 staged plan chart), covering 90% of all 7 wet cases takes 6 level sensors, and covering 100% of all 7 wet cases takes 10 level sensors.</p>`,
      team: { page: 20, quote: "Exact and convex methods can be accurate but do not scale easily; greedy methods are efficient but can be locally suboptimal; evolutionary methods explore more alternatives but cost more computation." },
    },
    type: {
      title: "Level sensors vs float switches across budgets",
      html: `<p><b>Two rules, one score:</b> a level sensor counts a growth run when its manhole rises 10 mm; a float switch counts it only when growth lifts water past its fixed height. Both give a yes or no per run, and the score is the share of growth runs flagged. Level sensors also show how much and how fast the level rises, which this score does not count.</p>
        <p><b>Float height favours float switches:</b> the model sets them 25 mm above normal depth and trips them exactly there. Sewage float switches switch over at least 100 mm (Sulzer ABS KS product data), and the South Australian trial set them at alarm levels such as 150 mm (Ninh et al. 2025), so real float switches would see less. Prices are assumed: $25k per level sensor, $1k per float switch.</p>
        <p><b>Why float switches alone stall:</b> 15 float switches ($15k) already hit the float ceiling at any budget from $25k to $200k, seeing 0% in the worst case, 35% on average. In the age-weighted design wet case, no float switch sees any growth run, and on unseen weather float switches see 0% (warning of 4 of 11 overloads).</p>
        <p><b>Budget comparison ($25k, $75k and $125k):</b><br>
        <b>$25k:</b> 1 level sensor in the staged plan sees 0% in the worst case, 53% on average (55% on unseen weather); 15 float switches ($15k) see 0% in the worst case, 35% on average (0% on unseen weather); a separately chosen 1-level pick gets 12% in the worst case, 42% on average (34% on unseen weather).<br>
        <b>$75k (shown on the chart):</b> 3 level sensors in the staged plan see 44% in the worst case, 86% on average (71% on unseen weather); 15 float switches ($15k) see 0% in the worst case, 35% on average; a separately chosen mix buys 2 level sensors and 6 float switches ($56k) to maximise the worst case and reaches 62% in the worst case, 79% on average (55% on unseen weather).<br>
        <b>$125k:</b> 5 level sensors in the staged plan see 81% in the worst case, 94% on average (77% on unseen weather), while a separately chosen 5-level set reaches 88% in the worst case, 94% on average (76% on unseen weather).</p>`,
      team: { page: 9, quote: "Float or tilt devices can provide a robust threshold event, such as a high-level alarm, with a simple sensing principle. They do not provide the level history, rate of rise, or normal-pattern information available from a continuous sensor." },
    },
    holdup: {
      title: "Holdout tests, age-weighted blind spot and sensor stability",
      html: `<p><b>Holdout drops:</b> in-sample 5-sensor coverage in Simulation 4 is 81% in the worst case, 94% on average (11 of 11 overloads warned). Chosen without the weather case tested, average coverage falls to 77% (10 of 11 warned). Chosen without the region tested, average coverage is 76% (10 of 11 warned), against 55% for 5,000 random draws of responsive manholes (8.3 of 11 warned) and 33% for any random manholes (5.4 of 11 warned). Because R9 shares manholes with the regions it crosses, holding R9 out does not fully hide it, so Simulation 4 notes that the 76% unseen-region score is a little generous.</p>
        <p><b>Age-weighted blind spot:</b> a design wet day where older pipes leak more (age-weighted inflow and infiltration) cannot be predicted from the other weather cases. When the age-weighted design wet case is held out of selection, even 8 sensors see 0% of its runs (in the 5-sensor set, only Sensor 3, manhole 4450922, detects it).</p>
        <p><b>Stability across plans tested:</b> comparing the equal-home regions against hand-picked suburb regions on the same runs shares 4 of 5 sensors: Sensor 1 (manhole 4450531), Sensor 2 (manhole 4448345), Sensor 3 (manhole 4450922) and Sensor 4 (manhole 4452994). Across every five-sensor plan the team tested, Sensors 1 and 3 stayed in every set.</p>`,
      team: { page: 19, quote: "The method was robust in average reconstruction across SWMM parameter variants, but exact sensor locations changed with model parameterisation." },
    },
    assumed: {
      title: "Assumptions, missing 485-home source and new-suburb checklist",
      html: `<p><b>Assumptions and unmodelled factors:</b> the SWMM model has no field calibration. The 10 mm and 25 mm rise rules, the limit of 70% of pipe depth (assumed), the triage bands, the 25 mm float switch margin, and the $25k and $1k sensor prices are all assumed. Sensors never fail in Simulation 4 (long-term sensor drift and outages are not modelled).</p>
        <p><b>485-home projection source still needed:</b> Simulation 4's <code>regions.js</code> anchors Walkerville's 2041 growth at 485 projected homes (used both to scale the 8 equal-home regions and as R9's corridor anchor), but the underlying planning projection document is not in the repository and is still needed for audit traceability.</p>
        <p><b>What settles 1 vs 5 sensors:</b> wet-weather level records (not normal dry-day records) are needed to check which infiltration case Walkerville actually experiences. In Simulation 4's "Fewest sensors by weather covered" table, covering 90% of all 7 wet cases requires 6 level sensors, and covering 100% requires 10.</p>
        <p><b>What a new suburb must supply:</b> pipe and manhole positions, inverts, diameters and lids; outlet and exit pipes; existing and projected homes (to cut regions by spatial bisection); property connections and pump station rates; wet-weather inflow cases; and the utility's own pipe depth limit, rise rule and device prices.</p>`,
    },
    close: {
      title: "Staged rollout details and manhole IDs",
      html: `<p><b>Priority regions:</b> monitor R3 (2 to 59 homes to the 0.7 limit; 2041 projection 54) and R7 (6 to 71 homes to the 0.7 limit; 2041 projection 55) first. Watch R1, R4 and R9. Remember that R1 runs out in 3 of 7 wet cases just as R3 does, R8 is already over the 0.7 limit in 4 of 7 wet cases, and only R5 keeps room across all 7 wet cases.</p>
        <p><b>The 5-sensor staged plan ($25k each, assumed):</b><br>
        <b>Sensor 1 (manhole 4450531, R3):</b> $25k; sees all 16 of 16 growth runs on a design wet day (0% in the worst case, 53% on average across 7 wet cases; 4 stand-ins with the same score, of which the nearest 3 are MH4450391, MH4450137 and MH4449796).<br>
        <b>Sensor 2 (manhole 4448345, R4):</b> adds wetter-weather R1 and R4 coverage (0% in the worst case, 72% on average, and reaches 11 of 11 overloads warned; 0 stand-ins).<br>
        <b>Sensor 3 (manhole 4450922, R7 and R9):</b> adds coverage for the age-weighted design wet case (44% in the worst case, 86% on average; 3 stand-ins; check site surcharge).<br>
        <b>Sensor 4 (manhole 4452994, R2 through-flow):</b> catches R9 and R3 in wetter cases (69% in the worst case, 92% on average; 23 stand-ins).<br>
        <b>Sensor 5 (manhole 4428268, R1):</b> lifts coverage to 81% in the worst case, 94% on average ($125k assumed; 0 stand-ins). In Simulation 4's "Fewest sensors by weather covered" table, 6 sensors reach 90% across all 7 wet cases and 10 sensors reach 100%.</p>`,
    },
  },
};
