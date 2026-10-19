# Capstone fact sheet (PG-S2-22, SA Water sensor placement)

Every line is a verbatim quote of 25 words or fewer, then the exact source. "Not found" means the five named sources do not contain it. All paths are relative to the capstone folder. Where a source is a docx the location is the section heading (and the page of that section in the document's own contents list, which is approximate); there is no line number in a docx.

Sources: `request.pdf` (WIL Schedule 2), `papers/paper1_sensors_review/paper1.tex`, `SA_Water_Wastewater_Sensor_Placement_Project_Scope_Brief.docx` (working brief, dated 7 September 2026), `ProjectScopingDocument_v3.1.2_Draft.docx` (dated 1 September 2026), `team meetings/2026-09-09_scope_confusions_data_and_thinking_log.md`.

## 1. What the original brief asks

- Aim: "Investigate the optimal placement and number of water sensors required in a water network to achieve effective monitoring while minimizing deployment costs." — `request.pdf`, p.1, row "WIL Activity Details"
- Number and location: "Identify the optimal sensor locations and number of sensors." — `request.pdf`, p.1, row "WIL Activity Details"
- Density: "Develop a model for sensor placement and deployment density." — `request.pdf`, p.1, row "WIL Activity Details"
- Deliverable: "Recommended sensor locations and densities." — `request.pdf`, p.1, row "WIL Activity Deliverables"
- Sensor type: not found in `request.pdf` (it says "water sensors" and does not name level sensors or float switches).
- Sensor count, type and location as restated in the scoping document: "specifies the number, position and type of sensors required" — `ProjectScopingDocument_v3.1.2_Draft.docx`, section 2.2 Project Objectives and Success Criteria (p.5), PO3
- Cost ratio (not in `request.pdf`; stated in the scoping document): "level sensors cost five to six times more" — `ProjectScopingDocument_v3.1.2_Draft.docx`, section 1.2 Project Purpose/Justification, "Why this matters now" (p.4)
- What each type gives (same paragraph): "Float switches provide only basic threshold alerts, while level sensors deliver continuous depth data that enables network analysis, predictive monitoring and machine learning applications." — `ProjectScopingDocument_v3.1.2_Draft.docx`, section 1.2 (p.4)
- Pilot area, general wording: "The approach is demonstrated on a pilot area and documented so that it generalises to others." — `ProjectScopingDocument_v3.1.2_Draft.docx`, section 1.1 Project Description (p.4)
- Likely pilot area "Rostrevor": not found in any of the five sources.
- Candidate areas named, none confirmed: "Do not treat Enfield, an infill area, or Walkerville as the final study area until the choice is confirmed with Vineeth and Cuda." — `SA_Water_Wastewater_Sensor_Placement_Project_Scope_Brief.docx`, section 9 Working exclusions and guardrails
- Study area status: "No final area is confirmed. Do not treat Walkerville or another candidate as approved." — `team meetings/2026-09-09_scope_confusions_data_and_thinking_log.md`, line 87 (C04)
- Dates and hours: "No earlier than 03/08/2026" — `request.pdf`, p.1, row "WIL Activity Dates"

## 2. Level sensor versus float switch, and the review's conclusions

What each measures:

- "Continuous level data provide a time series of depth from which a utility may examine normal patterns, surcharge, and rate of change." — `papers/paper1_sensors_review/paper1.tex`, line 87 (section 3 Level and Depth Sensing)
- "A binary float or tilt switch provides an event threshold but cannot produce the same trend information." — `paper1.tex`, line 87
- "Float and tilt devices answer a simpler question: has wastewater crossed a set threshold?" — `paper1.tex`, line 111 (section 3.3 Binary Float and Tilt Sentinels)
- "A single switch cannot show the rate of rise or describe changes between its trigger and reset levels." — `paper1.tex`, line 111
- "Battery life, maintenance intervals, and cost depend on the selected switch, logger, and communication system." — `paper1.tex`, line 111

The review's conclusions:

- "No single sensor describes every aspect of a wastewater network." — `paper1.tex`, line 262 (section 10 Matching Sensors to Monitoring Tasks)
- "A float or tilt switch suits a simple high-level alarm" — `paper1.tex`, line 262
- "radar or ultrasonic sensing is more useful when the timing, rate, and duration of surcharge are important" — `paper1.tex`, line 262
- "the most useful sensor is the one that provides enough information for a defined operational response" — `paper1.tex`, line 271 (section 11 Conclusion)
- "The review shows that sensor selection should begin with the operational question and the conditions at the intended site." — `paper1.tex`, line 41 (abstract)

Level is not flow:

- "A level sensor alone does not automatically provide a reliable flow measurement when the flow is non-uniform or the geometry and boundary conditions are uncertain." — `paper1.tex`, line 135 (section 6 Flow and Velocity Measurement)
- "In a blocked or backwatered reach, the water level may rise without a proportional increase in velocity or discharge." — `paper1.tex`, line 145 (section 6.2)
- "Flow measurement is more demanding because pipe geometry, flow direction, backwater, and calibration all influence the result." — `paper1.tex`, line 269 (section 11 Conclusion)

Table 1 (Question-led classification, `tab:categories`), row "How full is the sewer?" (`paper1.tex`, line 67):

- Examples: "Radar, ultrasonic, short-range LiDAR/ToF, float or tilt switches"
- Information obtained: "Continuous level trends or discrete surcharge events"
- Main limitation: "Humidity, condensation, foam, obstructions, fouling, or loss of trend information"

Table 1, row "How much is flowing?" (`paper1.tex`, line 69):

- Examples: "Contactless ultrasonic flow, level plus geometry, pump drawdown or hydraulic models"
- Information obtained: "Flow or velocity estimates and hydraulic loading"
- Main limitation: "Installation geometry, flow direction, backwater, and calibration assumptions"

Table 2 (Characteristics and applications of sewer monitoring technologies, `tab:synthesis`), row "Radar level" (`paper1.tex`, line 238):

- Main use: "Continuous level and pump drawdown"
- Useful characteristics: "Non-contact; relatively resistant to humidity and mist"
- Limitations: "Careful mounting and clear beam path; higher cost"

Table 2, row "Ultrasonic level" (`paper1.tex`, line 240):

- Main use: "Continuous level and early surcharge detection"
- Useful characteristics: "Non-contact; low-power options are available"
- Limitations: "Condensation, foam, temperature, and mounting conditions"

Table 2, row "Float/tilt switch" (`paper1.tex`, line 244):

- Main use: "Threshold alarm"
- Useful characteristics: "Simple event notification"
- Limitations: "No continuous trend; movement can be obstructed by grease or solids"

Table 2, row "Contactless ultrasonic flow" (`paper1.tex`, line 246):

- Main use: "Flow and level estimation"
- Useful characteristics: "Avoids submerged installation"
- Limitations: "Sensitive to geometry, flow direction, water level, and calibration"

Review cost ratio of level to float: not found (the review gives no float-versus-level ratio; the five-to-six-times figure is in the scoping document, section 1 above).

## 3. The scope change toward growth-related load from new housing on trunk sewers

Date of the meeting: "4 September" is not found as a meeting date in any of the five sources. The brief is dated 7 September 2026 and its basis line reads "Meeting with Industry Partner - SA Water OSP Project - Capstone Project Team PG-S2-22". The scoping document is dated 1 September 2026, before the change.

What the client said, as recorded by the team:

- "Optimal sensor placement is not the problem... optimal sensor placement is a solution for the data collection problem." — `team meetings/2026-09-09_scope_confusions_data_and_thinking_log.md`, line 117 (Vineeth, 12:45 in the meeting transcript)
- "The key here is how do we get accurate information from across the network by placing optimal sensors." — same file, line 116 (Vineeth, 9:38)
- "Narrow it down to only one specific small area." — same file, line 120 (Vineeth, 18:27)

What the team recorded as the change:

- "Vineeth said OSP is not the business problem; it is a solution for collecting the required information." — same file, line 45
- "Vineeth said the implementation was too broad for the project period." — same file, line 46
- "Vineeth's central point is that optimal sensor placement is not the business problem by itself." — `SA_Water_Wastewater_Sensor_Placement_Project_Scope_Brief.docx`, "Executive understanding"
- "The implementation must be narrowed to one small area and one use case." — `SA_Water_Wastewater_Sensor_Placement_Project_Scope_Brief.docx`, "Executive understanding"
- "Identification before prevention or installation: establish how existing indicators can reveal a developing problem, then decide what additional sensing is needed." — `SA_Water_Wastewater_Sensor_Placement_Project_Scope_Brief.docx`, "Confirmed direction and project implication", row "Sequence"
- "determine what existing information can reveal increasing sewer flow or load and potential overcapacity or overflow risk" — `SA_Water_Wastewater_Sensor_Placement_Project_Scope_Brief.docx`, "Project in one sentence"

Growth-related load from new housing on trunk sewers:

- "to monitor overcapacity and overflows due to sewer growth, which is the addition of new residential plans to existing sewer networks." — `ProjectScopingDocument_v3.1.2_Draft.docx`, section 1.1 Project Description (p.4)
- "monitor overflows due to sewer growth, from new housing developments or old infrastructure" — `ProjectScopingDocument_v3.1.2_Draft.docx`, section 1.2 Project Purpose/Justification, "Industry context" (p.4)
- "One pilot area, trunk sewer network, with documented generalisation to others." — `ProjectScopingDocument_v3.1.2_Draft.docx`, section 2.5 Preliminary Scope Statement, "Included in scope" (p.7)
- "Growth-related overcapacity and overflow is the leading case; other mechanisms remain data-dependent or optional." — `team meetings/2026-09-09_scope_confusions_data_and_thinking_log.md`, line 86 (C03)
- Use case status: "Growth-related overcapacity and overflow, an environmental protection use case, water quality, or another use case will require different indicators and data." — `SA_Water_Wastewater_Sensor_Placement_Project_Scope_Brief.docx`, section 7 Decisions still needed, row "Selected use case"
- Root intrusion and blockage as secondary: "Optionally, the project aims to ensure the approach can be adapted to monitor the root intrusion and operational blockages in sewer network" — `ProjectScopingDocument_v3.1.2_Draft.docx`, section 1.1 (p.4)
- Scope not final: "Note: The project scope and description have not yet been finalised." — `ProjectScopingDocument_v3.1.2_Draft.docx`, section 1.1 (p.4)

## 4. Guardrails

Gravity sewers and pump stations:

- "Wastewater gravity sewer networks, with overcapacity and overflow prevention as the target application." — `ProjectScopingDocument_v3.1.2_Draft.docx`, section 2.5, "Included in scope" (p.7)
- "Wastewater pump stations to be considered in network, to deal with surge in sewer channels." — `ProjectScopingDocument_v3.1.2_Draft.docx`, section 2.5, "Included in scope" (p.7)
- "Subject to the area in scope." — `ProjectScopingDocument_v3.1.2_Draft.docx`, section 2.5, "Included in scope" (p.7), same bullet
- "Only if relevant assets influence the chosen area." — `team meetings/2026-09-09_scope_confusions_data_and_thinking_log.md`, line 95 (C12, pump-station data)
- "methods developed for pressurised water-distribution networks cannot be transferred directly to gravity sewers without changing the hydraulic representation and validation criteria" — `paper1.tex`, line 82 (section 2)
- "Potable-water networks and the entire SA Water network are outside the focused implementation." — `SA_Water_Wastewater_Sensor_Placement_Project_Scope_Brief.docx`, section 2 Scope boundaries, row "Network context"

No sensor installation:

- "Physical installation of sensors, procurement of sensor hardware, and entry into wastewater facilities." — `ProjectScopingDocument_v3.1.2_Draft.docx`, section 2.5, "Excluded from scope" (p.7)
- "Do not promise physical sensor installation, procurement, site access, or live operational validation." — `SA_Water_Wastewater_Sensor_Placement_Project_Scope_Brief.docx`, section 9 Working exclusions and guardrails
- "The team has no physical access to sewer infrastructure; all work is desk-based research, modelling and analysis." — `ProjectScopingDocument_v3.1.2_Draft.docx`, section 2.3 Constraints, "Access" (p.6)

No field validation:

- "Live field validation of recommended locations." — `ProjectScopingDocument_v3.1.2_Draft.docx`, section 2.5, "Excluded from scope" (p.7)
- "Treat them as outside the proposed student-project implementation unless the client formally changes the scope." — `team meetings/2026-09-09_scope_confusions_data_and_thinking_log.md`, line 106 (C23, covering installation, procurement, sewer entry and live field validation)
- "No complete approval record is available. The current scoping document says the scope is not yet finalised." — same file, line 107 (C24)

Data access needs SA Water approval:

- "Access to the remaining data depends on SA Water's internal data-governance approval timeline." — `ProjectScopingDocument_v3.1.2_Draft.docx`, section 2.3 Constraints, "Data availability" (p.6)
- "Client data access may be masked, aggregated, restricted, or delayed by the DMTA process." — `SA_Water_Wastewater_Sensor_Placement_Project_Scope_Brief.docx`, section 2 Scope boundaries, row "Data and gap analysis"
- "Do not assume raw SCADA data or detailed client spatial data will be released." — `SA_Water_Wastewater_Sensor_Placement_Project_Scope_Brief.docx`, section 9
- "Do not assume. Request masked, anonymised, aggregated or descriptive alternatives and confirm DMTA requirements." — `team meetings/2026-09-09_scope_confusions_data_and_thinking_log.md`, line 105 (C22)

Source conflict to flag before quoting scope to the client: the scoping document (v3.1.2) lists "Placement approach considering existing sensors already in place." under "Excluded from scope" (section 2.5, p.7), while the brief (section 5, "Available-information baseline" and "Current sensing") and the meeting log (line 100, C17, and line 76) compare a no-sensor baseline, current sensing and candidate additions. The meeting log marks C17 as Open.

## 5. Project objectives and deliverables

Project objectives, `ProjectScopingDocument_v3.1.2_Draft.docx`, section 2.2 Project Objectives and Success Criteria (pp.5-6). The ID column is PO1 to PO7; each objective is a long sentence, so each line quotes its opening words only.

- PO1: "Deliver a structured literature review of peer-reviewed and industry sources on sensor placement approaches in water and wastewater networks"
- PO2: "Produce a catalogue of network and placement parameters relevant to overflow risk, each with definition, data source, availability status at SA Water"
- PO3: "Develop a placement approach that, given a gravity sewer network, specifies the number, position and type of sensors required"
- PO4: "Conduct a retrospective analysis of the selected wastewater-network study area using approved historical network, load, pumpstation, sensor and overflow/choke data, where available"
- PO5: "Compare candidate sensor configurations, including current float-switch and level-sensor options and any additional modalities identified by the literature, using an agreed network-visibility measure"
- PO6: "Document how the approach developed generalises to other areas, stating which components are location-independent, and which require local calibration"
- PO7: "Deliver a handover pack of artefacts, data, code, decisions and open questions to the incoming IoT Water Hub PhD candidate and postdoctoral researcher"

Deliverables, `ProjectScopingDocument_v3.1.2_Draft.docx`, section 3.2 Project Deliverables (p.12), each paired with the objective in its "Objective" column:

- D1 (PO1): "Literature review of sensor placement in water and wastewater networks"
- D2 (PO2): "Network and placement parameter catalogue"
- D3 (PO3): "Sensor placement approach"
- D4 (PO4): "Pilot-area placement plan with justification"
- D5 (PO5): "Cost and information trade-off analysis"
- D6 (PO6): "Generalisation guidelines"
- D7 (BO4): "Business case detailing for the asset management team"
- D8 (PO7): "Handover detailing for the IoT Water Hub team"

Notes on this section: D7 traces to BO4 (a business objective), not to a PO, in the source table. The brief and the meeting log do not number deliverables as D1 to D8 (not found). The team's working scoping direction after the change does not add or rename any PO.
