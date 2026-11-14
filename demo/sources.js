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
      gap: "Field check waits on utility overflow and blockage history.",
    },
    kim2022: {
      lib: [],
      web: [
        {
          title: "Kim, K., Ban, M. J., Kim, S., Park, M.-H., Stenstrom, M. K. and Kang, J.-H. (2022), Journal of Environmental Management, 320, 115806",
          url: "https://doi.org/10.1016/j.jenvman.2022.115806",
          says: "Optimal allocation and operation of sewer monitoring sites for wastewater-based disease surveillance: A methodological proposal. Sim 4 adapts recursive spatial bisection by cutting at pipe ends rather than manholes, including loops, and allowing a manhole to sit in two regions where flow divides.",
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
    problem: {
      title: "Baseline surcharge vs 2041 growth",
      html: `<p><b>Baseline today:</b> before any 2041 homes connect, the EPA SWMM 5.2 model has 7 manholes surcharged (water above the pipe top, 0 spilling) on a design wet day (0.11 L/s per 100 m), 107 surcharged (1 spilling) in beyond-design wet weather (0.25 L/s per 100 m), and 141 surcharged (6 spilling) in severe wet weather (0.40 L/s per 100 m).</p>
        <p><b>Growth vs weather:</b> at full 2041 build-out on a design wet day, 5 regions (R1, R3, R4, R7 and R9) raise water by 10 mm or more (assumed rule) in at least one manhole and 4 regions (R2, R5, R6 and R8) do not, yet no manhole newly surcharges and none spills. Across all 7 wet cases up to 100% build-out (315 runs), 50 runs show a new surcharge and 1 shows a new spill across 14 manholes, giving 11 region-weather overloads in wetter cases. Wet weather drives pipe filling far more than 2041 housing growth on its own.</p>`,
    },
    changed: {
      title: "What changed from October and Sim 3.5 to Simulation 4",
      html: `<p><b>Regions:</b> instead of hand-picked suburb boundaries (100 to 829 existing homes), Simulation 4 adapts recursive spatial bisection from Kim et al. (2022) to cut 8 regions of 233 to 418 existing homes (ideal 321), plus R9, the Walkerville Terrace corridor (179 existing homes, 485 projected homes) overlapping them. Unlike Kim et al. (who placed sensors for disease surveillance and cut at manholes), Sim 4 cuts at pipe ends on the looped SWMM network and lets a manhole sit in two regions where flow divides.</p>
        <p><b>Build-out steps:</b> each region is built out on its own at 0.1, 0.25, 0.5, 0.75, 1.0, 1.5 and 3.0 times its 2041 figure. The 1.5x and 3.0x stress steps explain why homes-to-limit ranges can exceed the 2041 projection.</p>
        <p><b>Nested sensor ladder:</b> Sim 4 builds a greedy nested ladder from 1 to 8 continuous level sensors across the 5 target regions (R1, R3, R4, R7 and R9) up to 100% build-out.</p>`,
    },
    regions: {
      title: "Region triage and per-case bands across all 7 wet cases",
      html: `<p><b>Triage vs sensor scope:</b> region triage uses the design wet case only at an assumed pipe limit of 0.7 of bore (70%), whereas the 5-sensor plan is scored across all 7 wet cases. Growth was tested at 0.1, 0.25, 0.5, 0.75, 1, 1.5 and 3 times each region's 2041 figure, so the homes-to-limit ranges (10th to 90th percentile) can extend past 2041.</p>
        <p><b>Bands across the 7 wet cases</b> (O = runs out, U = uncertain, R = room left, A = already over 0.7 before growth):<br>
        <b>R1 (Watch, 54 homes, 12 to 78 to limit):</b> U O O U O A A (runs out in 3 of 7 cases, already over in 2).<br>
        <b>R2 (Leave, 49 homes, 53 to beyond top step):</b> R U A R R U U.<br>
        <b>R3 (Monitor, 54 homes, 2 to 59 to limit):</b> O O A R O A A (runs out in 3 of 7, already over in 3).<br>
        <b>R4 (Watch, 54 homes, 15 to 79 to limit):</b> U A A U O A U.<br>
        <b>R5 (Leave, 40 homes, not reached):</b> R R R R R R R (the only region that keeps room in all 7 wet cases).<br>
        <b>R6 (Leave, 60 homes, not reached):</b> R R A R R R R.<br>
        <b>R7 (Monitor, 55 homes, 6 to 71 to limit):</b> O A A R O A A.<br>
        <b>R8 (Leave, 71 homes, not reached on Design wet):</b> R A A R R A A (already over the limit before growth in 4 of 7 wet cases).<br>
        <b>R9 (Watch, 485-home anchor, 90 to 1,271 to limit):</b> U A A U U A A.</p>`,
    },
    sensors: {
      title: "Rise rule, solver choice, and stand-in zones for the five sensors",
      html: `<p><b>What 16 of 16 and 11 of 11 mean:</b> on a design wet day there are 16 detectable target-region growth runs, and across all 7 wet cases there are 11 region-weather pairs that newly surcharge or spill. One simulated run moves a weather case's score by 5 to 7 percentage points, so 94% and 92% are the same within noise.</p>
        <p><b>Assumed 10 mm rule vs normal variation:</b> every headline score uses an assumed 10 mm water-level rise rule. Sensor 1 (MH4450531) first reacts at +12.4 mm with 14 new homes in R3. In the Stonyfell study (Do et al., 2023), normal dry-weather levels varied between 20 and 75 mm. Whether a 10 mm rise from housing growth can be told apart from day-to-day flow variation is untested. Under the stricter 25 mm rule (dashed chart line), 5 sensors see 36% worst case and 45% on average.</p>
        <p><b>Greedy ladder vs exact solver and stand-in zones:</b> the 5 sensors come from a greedy nested ladder (81% worst / 94% average). An unnested exact solver reaches 88% worst / 94% average with a different 5-sensor set, and at least 96 five-sensor sets tie for best on Design wet. Treat each pick as a monitoring zone with equal-score stand-ins:<br>
        <b>1 · MH4450531:</b> Design-wet anchor; 4 stand-ins (MH4450391, MH4450137, MH4449796).<br>
        <b>2 · MH4448345:</b> Wetter-weather R1/R4 branch; 0 stand-ins (without it, warnings drop to 9 of 11).<br>
        <b>3 · MH4450922:</b> Reacts at 27 homes in R1 (+13.3 mm); only sensor here seeing age-weighted Design wet; surcharged before growth (worth a site check); 3 stand-ins (MH4451207, MH4451871, MH4452011).<br>
        <b>4 · MH4452994:</b> Sits in R2 to catch through-flow from R9 and R3; 23 stand-ins (including MH4453489, MH4453579, MH4453970).<br>
        <b>5 · MH4428268:</b> Upper R1/R4 wetter-weather watcher; 0 stand-ins.</p>
        <p><b>Fewest sensors for full wet-weather coverage:</b> covering 90% of all 7 wet cases takes 6 level sensors, and covering 100% of all 7 wet cases takes 10 level sensors.</p>`,
      team: { page: 20, quote: "Exact and convex methods can be accurate but do not scale easily; greedy methods are efficient but can be locally suboptimal; evolutionary methods explore more alternatives but cost more computation." },
    },
    type: {
      title: "Level sensors vs float switches across budgets",
      html: `<p><b>Assumed rules and prices:</b> continuous level sensors are priced at $25k each and float switches at $1k each (both assumed). A float switch counts only if it sits at least 25 mm above its manhole's normal baseline depth (assumed margin), stays quiet on a design wet day, and growth lifts water past it.</p>
        <p><b>Why floats alone stall at 35% average and 0% worst case:</b> 15 floats ($15k) already hit the float ceiling at any budget from $25k to $200k. In age-weighted Design wet, no float sees any growth run, and on unseen weather floats see 0% (warning of 4 of 11 overloads).</p>
        <p><b>Budget comparison ($25k / $75k / $125k):</b><br>
        At <b>$25k</b>, 1 level sensor on the nested list sees 0% worst / 53% average (55% unseen weather); 15 floats ($15k) see 0% / 35% (0% unseen); an unnested 1-level pick gets 12% / 42% (34% unseen).<br>
        At <b>$75k</b>, 3 level sensors on the list see 44% worst / 86% average (71% unseen); an unnested free mix buys 2 level sensors + 6 floats ($56k) to maximise the worst case and reaches 62% worst / 79% average (55% unseen).<br>
        At <b>$125k</b>, 5 level sensors on the list see 81% worst / 94% average (77% unseen), while the unnested 5-level solver reaches 88% worst / 94% average (76% unseen).</p>`,
      team: { page: 9, quote: "Float or tilt devices can provide a robust threshold event, such as a high-level alarm, with a simple sensing principle. They do not provide the level history, rate of rise, or normal-pattern information available from a continuous sensor." },
    },
    holdup: {
      title: "Holdout tests, age-weighted blind spot, and sensor stability",
      html: `<p><b>Holdout drops:</b> in-sample 5-sensor coverage is 94% on average (81% worst case, 11 of 11 overloads warned). Chosen without the weather case tested, coverage falls to 77% (10 of 11 warned). Chosen without the region tested, coverage is 76% (10 of 11 warned), against 55% for 5,000 random draws of responsive manholes (8.3 of 11 warned) and 33% for any random manholes (5.4 of 11 warned). Because R9 shares manholes with the regions it crosses, holding R9 out does not fully hide it, so Simulation 4 calls the 76% unseen-region score a little generous.</p>
        <p><b>Age-weighted blind spot:</b> a design wet day where older pipes leak more (age-weighted I&amp;I) cannot be predicted from the other weather cases. When age-weighted Design wet is held out of selection, even 8 sensors see 0% of its runs (in the 5-sensor set, only Sensor 3, MH4450922, detects it).</p>
        <p><b>Stability across model versions:</b> comparing Sim 4's equal-home cut against Sim 3's hand-picked cut on the same Sim 4 runs shares 4 of 5 sensors (MH4450531, MH4448345, MH4450922 and MH4452994). Across the October Sim 2.5 deck's five, the 6 November Sim 3.5 five, and Simulation 4's five, two manholes appear in every set: Sensor 1 (MH4450531) and Sensor 3 (MH4450922).</p>`,
      team: { page: 19, quote: "The method was robust in average reconstruction across SWMM parameter variants, but exact sensor locations changed with model parameterisation." },
    },
    assumed: {
      title: "Assumptions, missing 485-home source, and new-suburb checklist",
      html: `<p><b>Assumptions and unmodelled factors:</b> the SWMM model has no field calibration. The 10 mm and 25 mm rise rules, the 0.7 bore pipe limit, the triage bands, the 25 mm float margin, and the $25k / $1k sensor prices are all assumed. Sensors never fail in Simulation 4 (long-term sensor drift and outages are not modelled).</p>
        <p><b>485-home projection source still needed:</b> Simulation 4's <code>regions.js</code> anchors Walkerville's 2041 growth at 485 projected homes (used both to scale the 8 equal-home regions and as R9's corridor anchor), but the underlying planning projection document is not in the repository and is still needed for audit traceability.</p>
        <p><b>What settles 1 vs 5 sensors:</b> wet-weather level records (not normal dry-day records) are needed to check which infiltration case Walkerville actually experiences. Covering 90% of all 7 wet cases requires 6 level sensors, and covering 100% requires 10.</p>
        <p><b>What a new suburb must supply:</b> pipe and manhole positions, inverts, diameters and lids; outlet and exit pipes; existing and projected homes (to cut regions by spatial bisection); property connections and pump station rates; wet-weather inflow cases; and the utility's own pipe limit, rise rule and device prices (plus trunk main criteria if testing greenfield estates, such as the team's assumed 225 mm rule).</p>`,
    },
    close: {
      title: "Staged rollout details and manhole IDs",
      html: `<p><b>Priority regions:</b> monitor R3 (2 to 59 homes to the assumed 0.7 bore limit; 2041 projection 54) and R7 (6 to 71 homes to limit; 2041 projection 55) first. Watch R1, R4 and R9. Remember that R1 runs out in 3 of 7 wet cases just as R3 does, R8 is already over 0.7 in 4 of 7 wet cases, and only R5 keeps room across all 7 wet cases.</p>
        <p><b>The 5-sensor ladder ($25k each, assumed):</b><br>
        <b>Sensor 1 (MH4450531, R3):</b> $25k; sees 16 of 16 Design wet runs (53% average across 7 wet cases; 4 stand-ins).<br>
        <b>Sensor 2 (MH4448345, R4):</b> adds wetter-weather R1/R4 coverage (72% average, 11 of 11 warned; 0 stand-ins).<br>
        <b>Sensor 3 (MH4450922, R7/R9):</b> adds age-weighted Design wet coverage (44% worst / 86% average; 3 stand-ins; check site surcharge).<br>
        <b>Sensor 4 (MH4452994, R2 through-flow):</b> catches R9 and R3 in wetter cases (69% worst / 92% average; 23 stand-ins).<br>
        <b>Sensor 5 (MH4428268, R1):</b> lifts coverage to 81% worst / 94% average ($125k assumed; 0 stand-ins). Expanding to 6 sensors reaches 90% across all 7 wet cases, and 10 sensors reaches 100%.</p>`,
    },
    frontier: {
      title: "Reading this chart",
      html: `<p><b>x-axis:</b> number of continuous level sensors on the Simulation 4 nested ladder, 1 to 8.<br><b>y-axis:</b> share of detectable growth runs seen across the target regions (R1, R3, R4, R7 and R9) up to 100% build-out.</p>
        <p><b>Solid curves (10 mm assumed rule):</b> average across the 7 wet cases climbs from 53% (1 sensor) to 94% (5 sensors) and 98% (8 sensors); worst wet case climbs from 0% (1 to 2 sensors) to 81% (5 sensors) and 94% (7 to 8 sensors). An unnested exact solver gets 88% worst / 94% average at 5 sensors.</p>
        <p><b>Dashed curve (25 mm strict rule):</b> average across the 7 wet cases climbs from 21% (1 sensor) to 45% (5 sensors, 36% worst case) and 52% (8 sensors). One run moves a case's score by 5 to 7 points.</p>`,
      team: { page: 20, quote: "Exact and convex methods can be accurate but do not scale easily; greedy methods are efficient but can be locally suboptimal; evolutionary methods explore more alternatives but cost more computation." },
    },
    beats: {
      title: "Reading this chart",
      html: `<p>Grouped bars compare the nested level-sensor list, floats only, and an unnested free mix at $25k, $75k and $125k (assuming $25k per level sensor, $1k per float switch, and a 25 mm float margin above normal).</p>
        <p>Floats alone stall at 35% average and 0% worst case at every budget (15 floats for $15k hit the ceiling). At $75k, 2 level sensors + 6 floats ($56k) reach 62% worst / 79% average against 44% worst / 86% average for 3 level sensors.</p>`,
      team: { page: 9, quote: "Float or tilt devices can provide a robust threshold event, such as a high-level alarm, with a simple sensing principle. They do not provide the level history, rate of rise, or normal-pattern information available from a continuous sensor." },
    },
    holdout: {
      title: "Reading this chart",
      html: `<p>For the 5-sensor ladder (10 mm rule), in-sample coverage is 94% average and 81% worst case (11 of 11 overloads warned). Held-out weather drops to 77% (10 of 11 warned) and held-out region to 76% (10 of 11 warned, a little generous because R9 overlaps other regions), still well above 5,000 random draws of responsive manholes (55%) or any manholes (33%). If age-weighted Design wet is held out, even 8 sensors see 0% of it.</p>`,
      team: { page: 19, quote: "The method was robust in average reconstruction across SWMM parameter variants, but exact sensor locations changed with model parameterisation." },
    },
    answerstats: {
      title: "What these numbers mean",
      html: `<p><b>16 of 16 runs:</b> the 16 detectable target-region growth runs on a design wet day.<br><b>11 of 11 overloads:</b> the 11 region-weather pairs (across 50 surcharged runs and 1 spilled run out of 315 wet runs) where a manhole newly surcharges or spills. One run shifts a case's score by 5 to 7 points.</p>`,
    },
    stress: {
      title: "Reading this map and table",
      html: `<p>Regions R1 to R8 are cut by spatial bisection adapted from Kim et al. (2022) at pipe ends, with R9 overlapping along Walkerville Terrace. Triage uses Design wet only (assumed 0.7 bore limit), while only R5 keeps room in all 7 wet cases.</p>`,
    },
    register: {
      title: "Reading this table",
      html: `<p>Key limitations and assumptions stated in Simulation 4, the 485-home planning source still needed, and the data checklist for a new suburb.</p>`,
    },
  },
};
