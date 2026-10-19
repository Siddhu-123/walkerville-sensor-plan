// Deck engine: slide navigation, SVG map and chart primitives, and the interactive widgets.
// Every number comes from window.SCENARIO (build/export_scenario.py), window.GEOMETRY or
// window.CONFIG. Nothing here holds a result of its own.
(function () {
  "use strict";

  const SC = window.SCENARIO;
  const GEO = window.GEOMETRY;
  const CFG = window.CONFIG;
  const F = Object.assign({}, window.STATIC_FACTS || {}, SC.facts);
  const SLIDES = window.SLIDES;
  const NS = "http://www.w3.org/2000/svg";
  const K_MAX = SC.max_sensors;
  const KS = Array.from({ length: K_MAX }, (_, i) => i + 1);
  const CASE_KEYS = ["dry", "design_wet", "severe", "age_weighted", "inflow_x15"];
  // Short names for chart axes. The order matches the five cases in config.js.
  const CASE_SHORT = ["Dry", "Design wet", "Severe", "Age-weighted I&I", "Outside inflow x1.5"];
  const short = (i, fallback) => CASE_SHORT[i] || fallback;
  const RULE_ORDER = SC.rules.map(r => r.id);
  const RULE_LABEL = Object.fromEntries(SC.rules.map(r => [r.id,
    r.id === "alarm" ? `${r.mm} mm alarm` : `Rise ${r.mm} mm`]));
  const COL = {
    mains: "#d5dbe2", chamber: "#9aa5b1", over: "#c2410c", surch: "#6d28d9",
    sensor: "#0b3d91", random: "#6b7280", text: "#1f2933", muted: "#5b6670",
    scale: ["#e5e7eb", "#fde68a", "#f59e0b", "#c2410c", "#7f1d1d"],
  };
  const missing = [];

  // ------------------------------------------------------------ text and DOM helpers

  function show(v) {
    return typeof v === "number" && Number.isInteger(v) && Math.abs(v) >= 1000
      ? v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : String(v);
  }

  function fill(html) {
    return html.replace(/\{\{([A-Za-z0-9_]+)\}\}/g, (m, key) => {
      if (F[key] === undefined) { missing.push(key); return "?"; }
      return show(F[key]);
    });
  }

  function h(tag, attrs, ...kids) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat()) {
      if (kid === null || kid === undefined || kid === false) continue;
      node.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
    return node;
  }

  function svg(tag, attrs) {
    const node = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v !== null && v !== undefined && v !== false) node.setAttribute(k, v);
    }
    return node;
  }

  function seg(options, value, onChange, label) {
    const group = h("div", { class: "seg", role: "group", "aria-label": label });
    options.forEach(([val, text]) => {
      group.append(h("button", {
        type: "button", class: val === value ? "on" : "", "aria-pressed": val === value ? "true" : "false",
        text, onclick: () => onChange(val),
      }));
    });
    return group;
  }

  function percent(v) { return `${Math.round(100 * v)}%`; }

  // ------------------------------------------------------------ map

  const BOUNDS = (() => {
    const xs = [], ys = [];
    GEO.chambers.forEach(c => { xs.push(c.x); ys.push(c.y); });
    GEO.mains.forEach(line => { for (let i = 0; i < line.length; i += 2) { xs.push(line[i]); ys.push(line[i + 1]); } });
    return { minx: Math.min(...xs), maxx: Math.max(...xs), miny: Math.min(...ys), maxy: Math.max(...ys) };
  })();

  function mapFrame(host, label) {
    const W = 720, H = 500, pad = 14;
    const sx = (W - 2 * pad) / (BOUNDS.maxx - BOUNDS.minx);
    const sy = (H - 2 * pad) / (BOUNDS.maxy - BOUNDS.miny);
    const s = Math.min(sx, sy);
    const offx = (W - s * (BOUNDS.maxx - BOUNDS.minx)) / 2;
    const offy = (H - s * (BOUNDS.maxy - BOUNDS.miny)) / 2;
    const project = (x, y) => ({ x: offx + s * (x - BOUNDS.minx), y: H - offy - s * (y - BOUNDS.miny) });
    const root = svg("svg", { viewBox: `0 0 ${W} ${H}`, class: "map", role: "img", "aria-label": label });
    const mains = svg("g", { class: "mains" });
    GEO.mains.forEach(line => {
      let d = "";
      for (let i = 0; i < line.length; i += 2) {
        const p = project(line[i], line[i + 1]);
        d += (i ? "L" : "M") + p.x.toFixed(1) + " " + p.y.toFixed(1);
      }
      mains.append(svg("path", { d, fill: "none", stroke: COL.mains, "stroke-width": 1.1 }));
    });
    const points = svg("g", { class: "points" });
    root.append(mains, points);
    host.append(root);
    const positions = GEO.chambers.map(c => project(c.x, c.y));
    return {
      root, points, positions,
      dot(i, { r = 4, fill = COL.chamber, title, stroke = "#fff", label, labelColor = "#fff" }) {
        const p = positions[i];
        const g = svg("g", {});
        if (title) { const tt = svg("title", {}); tt.textContent = title; g.append(tt); }
        g.append(svg("circle", { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r, fill, stroke, "stroke-width": 1 }));
        if (label !== undefined) {
          const t = svg("text", { x: p.x.toFixed(1), y: (p.y + 4).toFixed(1), "text-anchor": "middle",
            "font-size": 11, "font-weight": 700, fill: labelColor });
          t.textContent = label;
          g.append(t);
        }
        points.append(g);
      },
    };
  }

  function legend(items) {
    return h("div", { class: "legend" }, items.map(([color, text]) =>
      h("span", { class: "key" }, h("i", { style: `background:${color}` }), text)));
  }

  // ------------------------------------------------------------ charts

  function lineChart(host, { series, highlightX, yLabel = "Growth caught", xLabel = "Sensors" }) {
    const W = 680, H = 300, L = 52, R = 16, T = 14, B = 44;
    const xs = KS;
    const x = k => L + (k - 1) * (W - L - R) / (K_MAX - 1);
    const y = v => T + (H - T - B) * (1 - v / 100);
    const root = svg("svg", { viewBox: `0 0 ${W} ${H}`, class: "chart", role: "img",
      "aria-label": `${yLabel} against number of sensors` });
    [0, 25, 50, 75, 100].forEach(v => {
      root.append(svg("line", { x1: L, x2: W - R, y1: y(v), y2: y(v), stroke: COL.mains, "stroke-width": 1 }));
      const t = svg("text", { x: L - 8, y: y(v) + 4, "text-anchor": "end", "font-size": 12, fill: COL.muted });
      t.textContent = v + "%";
      root.append(t);
    });
    xs.forEach(k => {
      const t = svg("text", { x: x(k), y: H - B + 18, "text-anchor": "middle", "font-size": 12, fill: COL.muted });
      t.textContent = k;
      root.append(t);
    });
    const xl = svg("text", { x: (L + W - R) / 2, y: H - 6, "text-anchor": "middle", "font-size": 12, fill: COL.muted });
    xl.textContent = xLabel;
    root.append(xl);
    if (highlightX) {
      root.append(svg("line", { x1: x(highlightX), x2: x(highlightX), y1: T, y2: H - B,
        stroke: COL.text, "stroke-dasharray": "4 4", "stroke-width": 1 }));
    }
    // Series are shares from 0 to 1 (as the export stores them); the axis reads per cent.
    series.forEach(s => {
      const vals = s.values.map(v => 100 * v);
      const d = vals.map((v, i) => (i ? "L" : "M") + x(i + 1).toFixed(1) + " " + y(v).toFixed(1)).join("");
      root.append(svg("path", { d, fill: "none", stroke: s.color, "stroke-width": 3,
        "stroke-dasharray": s.dash || null, "stroke-linejoin": "round" }));
      vals.forEach((v, i) => root.append(svg("circle", { cx: x(i + 1), cy: y(v), r: 4,
        fill: s.color, stroke: "#fff", "stroke-width": 1.5 })));
    });
    host.append(root);
    return root;
  }

  function barChart(host, { groups, max, unit = "%", ariaLabel }) {
    // groups: [{label, bars: [{v, color, title, alpha}]}]
    const W = 680, H = 280, L = 40, R = 12, T = 16, B = 56;
    const n = groups.length;
    const bw = (W - L - R) / n;
    const y = v => T + (H - T - B) * (1 - v / max);
    const root = svg("svg", { viewBox: `0 0 ${W} ${H}`, class: "chart", role: "img", "aria-label": ariaLabel });
    groups.forEach((g, gi) => {
      const inner = bw * 0.7 / Math.max(1, g.bars.length);
      g.bars.forEach((b, bi) => {
        const x0 = L + gi * bw + bw * 0.15 + bi * inner;
        const r = svg("rect", { x: x0, y: y(b.v), width: inner - 4, height: H - B - y(b.v),
          fill: b.color, opacity: b.alpha === undefined ? 1 : b.alpha, rx: 3 });
        if (b.title) { const tt = svg("title", {}); tt.textContent = b.title; r.append(tt); }
        root.append(r);
        const t = svg("text", { x: x0 + (inner - 4) / 2, y: y(b.v) - 5, "text-anchor": "middle", "font-size": 12,
          "font-weight": 700, fill: COL.text });
        t.textContent = b.v + unit;
        root.append(t);
      });
      const lab = svg("text", { x: L + gi * bw + bw / 2, y: H - B + 18, "text-anchor": "middle", "font-size": 12,
        fill: COL.text, opacity: g.alpha === undefined ? 1 : g.alpha });
      lab.textContent = g.label;
      root.append(lab);
    });
    host.append(root);
    return root;
  }

  // ------------------------------------------------------------ widgets

  const WIDGETS = {};

  WIDGETS.params_table = function (host) {
    const keyOnly = host.hasAttribute("data-key-only");
    const rows = paramRows();
    const counts = { all: rows.length };
    ["measured", "sourced", "declared", "to confirm"].forEach(s => { counts[s] = rows.filter(r => r.status === s).length; });
    let filter = "all";
    const body = h("tbody");
    const table = h("table", { class: "params" },
      h("thead", {}, h("tr", {}, h("th", { text: "Parameter" }), h("th", { text: "Value used" }),
        h("th", { text: "What it means" }), h("th", { text: "Where it came from" }), h("th", { text: "Status" }))),
      body);
    const draw = () => {
      body.replaceChildren(...rows
        .filter(r => (filter === "all" || r.status === filter) && (!keyOnly || r.key))
        .map(r => h("tr", {}, h("td", { text: r.name }), h("td", { text: r.value }), h("td", { text: r.why || "" }),
          h("td", { text: r.source || "" }), h("td", {}, h("span", { class: `chip ${r.status.replace(" ", "-")}`, text: r.status })))));
    };
    const chips = h("div", { class: "filters", role: "group", "aria-label": "Filter by status" },
      [["all", "All"], ["measured", "Measured"], ["sourced", "Sourced"], ["declared", "Declared"], ["to confirm", "To confirm"]]
        .map(([val, text]) => h("button", { type: "button", class: val === filter ? "on" : "",
          onclick: (e) => { filter = val; chips.querySelectorAll("button").forEach(b => b.classList.remove("on")); e.target.classList.add("on"); draw(); } },
          `${text} (${counts[val] === undefined ? counts.all : counts[val]})`)));
    host.append(chips, h("div", { class: "table-wrap" }, table));
    draw();
  };

  function paramRows() {
    const s = CFG.simulation, l = CFG.loads;
    const rise = s.detection_rises_mm.map(m => `${m} mm`).join(", ");
    const overflow = s.overflow_inlet === "published"
      ? "As published (one overflow loop; corrected run needed)" : s.overflow_inlet;
    return [
      { name: "New dwellings at one manhole", value: `${s.growth_dwellings.join(", ")} dwellings, plus a ${s.stress_dwellings}-dwelling stress case`,
        why: "How many new houses connect at one manhole in each run.", source: "Team design (project configuration)", status: "declared", key: true },
      { name: "Weather and uncertainty cases", value: `${F.cases} cases`,
        why: "Dry, design wet, severe, age-weighted infiltration, and outside inflow at 1.5 times the base.", source: "Team design", status: "to confirm", key: true },
      { name: "Infiltration (groundwater and rain entering pipes)", value: "0, 0.11 and 0.40 L/s per 100 m of pipe",
        why: "Design wet is the level that just meets the utility's design rating for these pipes.", source: "Project configuration; the design rating needs SA Water's figure", status: "to confirm" },
      { name: "Alarm depth", value: `${s.alarm_depth_mm} mm above the pipe floor`,
        why: "The level at which a low alarm would trigger at a manhole.", source: "Stonyfell study (Do et al., 2023). The register calls it the operator's alarm, but the source is another network", status: "to confirm", key: true },
      { name: "Rise above normal", value: rise,
        why: "How far a manhole must rise above its own normal level to count as seeing growth.", source: "Declared. Needs SA Water's normal-day records", status: "declared", key: true },
      { name: "Sensors considered", value: `Up to ${s.max_sensors}`, why: "The most sensors in one plan.", source: "Project configuration", status: "declared" },
      { name: "People per connection", value: `${l.people_per_connection}`, why: "Average people per house, used to turn houses into flow.",
        source: "ABS 2021: 8,023 people over 2,851 connections", status: "sourced" },
      { name: "People per new dwelling", value: `${l.people_per_new_dwelling}`, why: "Household size for new houses.", source: "ABS 2021 household size", status: "sourced" },
      { name: "Water use", value: `${l.litres_per_person_day} litres per person per day`, why: "Average daily use per person.",
        source: "Barwon Water supplement to the WSAA Sewerage Code", status: "sourced", key: true },
      { name: "Peak flow factor", value: `${l.peak_factor} times average`, why: "How much higher the peak is than the average.", source: "Declared", status: "declared", key: true },
      { name: "Night-time flow factor", value: `${l.trough_factor} times average`, why: "How low the night-time flow falls.", source: "Textbook range", status: "sourced" },
      { name: "Pipe roughness", value: "Concrete-lined clay 0.013, plastic 0.010, reinforced concrete 0.013",
        why: "How smooth the inside of each pipe is, by material.", source: "Chow (1959) table values. Not measured on this network", status: "sourced" },
      { name: "Pump stations", value: "Ideal in the published runs; set rates in scenarios",
        why: "Pumps move sewage out of low areas.", source: "Assumed. The utility has not supplied pump rates", status: "to confirm", key: true },
      { name: "Overflow pipe handling", value: overflow, why: "How the relief pipes at two manholes return water.",
        source: "Project configuration", status: "to confirm" },
      { name: "Network boundary", value: "Council data only; inflows from outside sized by pipe length",
        why: "Pipes beyond the data are represented by fixed inflows.", source: "Team assumption", status: "declared" },
      { name: "Manhole positions and levels", value: "Schematic positions; about 0.23 m average error on lid levels (10 checks)",
        why: "How well the model's levels match the ground.", source: "Sandbox assumptions register", status: "measured" },
    ];
  }

  WIDGETS.scenario_picker = function (host) {
    let c = 0, si = 0;
    const out = h("div", { class: "readout", "aria-live": "polite" });
    const grid = h("div", { class: "grid-pick" });
    const draw = () => {
      grid.replaceChildren(
        h("div", { class: "corner" }),
        ...SC.sizes.map(s => h("div", { class: "colhead", text: `+${s}` })),
        ...SC.cases.flatMap((cs, ci) => [
          h("div", { class: "rowhead", text: cs.label }),
          ...SC.sizes.map((s, sj) => h("button", {
            type: "button", class: ci === c && sj === si ? "on" : "",
            "aria-pressed": ci === c && sj === si ? "true" : "false",
            text: `${F.sites}`, title: `${cs.label}, +${s} dwellings`,
            onclick: () => { c = ci; si = sj; draw(); },
          })),
        ]));
      const cs = SC.cases[c];
      out.replaceChildren(
        h("p", { class: "big", text: `${cs.label}, +${SC.sizes[si]} dwellings at one manhole` }),
        h("p", { text: `${F.sites} runs: one for each manhole where the houses could connect.` }),
        h("p", { class: "muted", text: cs.note || "" }),
      );
    };
    host.append(grid, out, h("p", { class: "muted small", text: `Total: ${SC.cases.length} cases × ${SC.sizes.length} sizes × ${F.sites} manholes = ${F.runs} simulations.` }));
    draw();
  };

  WIDGETS.baseline = function (host) {
    let c = 0;
    const picks = h("div", { class: "toolbar" });
    const out = h("div", { class: "readout", "aria-live": "polite" });
    const chartHost = h("div", { class: "chart-host" });
    const mapHost = h("div", { class: "map-host" });
    const draw = () => {
      picks.replaceChildren(seg(SC.cases.map((cs, i) => [i, cs.label]), c, v => { c = v; draw(); }, "Weather case"));
      chartHost.replaceChildren();
      barChart(chartHost, {
        groups: SC.cases.map((cs, i) => ({
          label: short(i, cs.label), alpha: i === c ? 1 : 0.45,
          bars: [
            { v: SC.baseline[String(cs.id)].alarm, color: COL.over, title: "Over the alarm before growth" },
            { v: SC.baseline[String(cs.id)].surcharged, color: COL.surch, title: "Surcharged before growth" },
          ],
        })),
        max: F.sites, unit: "", ariaLabel: "Manholes over the alarm and surcharged before any growth, by case",
      });
      mapHost.replaceChildren();
      const frame = mapFrame(mapHost, "Manholes over the alarm before growth");
      const b = SC.baseline[String(SC.cases[c].id)];
      const over = new Set(b.alarm_chambers), surch = new Set(b.surcharged_chambers);
      SC.chambers.forEach((_, i) => {
        if (surch.has(i)) frame.dot(i, { r: 5, fill: COL.surch, title: "Surcharged" });
        else if (over.has(i)) frame.dot(i, { r: 5, fill: COL.over, title: "Over the alarm" });
        else frame.dot(i, { r: 2.5, fill: COL.chamber, stroke: "none", title: "Below the alarm" });
      });
      out.replaceChildren(
        h("p", { class: "big", text: `${SC.cases[c].label}: ${b.alarm} manholes over the alarm, ${b.surcharged} surcharged` }),
        legend([[COL.over, "Over the alarm"], [COL.surch, "Surcharged (also over the alarm)"], [COL.chamber, "Below the alarm"]]),
      );
    };
    host.append(picks, out, h("div", { class: "split" }, chartHost, mapHost));
    draw();
  };

  WIDGETS.growth_map = function (host) {
    let c = 0, si = SC.sizes.indexOf(F.size_focus) >= 0 ? SC.sizes.indexOf(F.size_focus) : 0, rule = "r25";
    const controls = h("div", { class: "toolbar" });
    const out = h("div", { class: "readout", "aria-live": "polite" });
    const mapHost = h("div", { class: "map-host" });
    const draw = () => {
      controls.replaceChildren(
        seg(SC.cases.map((cs, i) => [i, cs.label]), c, v => { c = v; draw(); }, "Weather case"),
        seg(SC.sizes.map((s, i) => [i, `+${s}`]), si, v => { si = v; draw(); }, "Growth size"),
        seg(RULE_ORDER.filter(r => r !== "r10" && r !== "r50").map(r => [r, RULE_LABEL[r]]), rule, v => { rule = v; draw(); }, "What counts as seen"),
      );
      const per = SC.exposure[String(SC.cases[c].id)][String(SC.sizes[si])];
      const field = rule === "alarm" ? "alarm" : rule;
      const value = i => (per[i] ? per[i][field] : 0);
      const responding = per.filter((e, i) => value(i) > 0).length;
      mapHost.replaceChildren();
      const frame = mapFrame(mapHost, "Growth sites coloured by how many manholes respond");
      SC.chambers.forEach((_, i) => {
        const v = value(i);
        const bucket = v === 0 ? 0 : v <= 2 ? 1 : v <= 9 ? 2 : v <= 29 ? 3 : 4;
        frame.dot(i, { r: bucket ? 3 + bucket : 2.5, fill: COL.scale[bucket], stroke: bucket ? "#fff" : "none",
          title: `${v} manhole${v === 1 ? "" : "s"} respond`, });
      });
      out.replaceChildren(
        h("p", { class: "big", text: `${SC.cases[c].label}, +${SC.sizes[si]} dwellings: ${responding} of ${F.sites} growth sites ${rule === "alarm" ? `push at least one manhole over the ${F.alarm_mm} mm alarm` : `raise at least one manhole by ${F.rise_focus_mm} mm or more`}` }),
        legend([[COL.scale[0], "No response"], [COL.scale[1], "1–2 manholes"], [COL.scale[2], "3–9"], [COL.scale[3], "10–29"], [COL.scale[4], "30 or more"]]),
      );
    };
    host.append(controls, out, mapHost);
    draw();
  };

  WIDGETS.rule_curves = function (host) {
    let rule = "alarm";
    const controls = h("div", { class: "toolbar" });
    const chart = h("div", { class: "chart-host" });
    const table = h("div", { class: "table-wrap" });
    const draw = () => {
      controls.replaceChildren(seg(RULE_ORDER.map(r => [r, RULE_LABEL[r]]), rule, v => { rule = v; draw(); }, "Detection rule"));
      const cov = SC.coverage[rule].worst;
      chart.replaceChildren();
      lineChart(chart, {
        series: [
          { values: cov.worst, color: COL.sensor, label: "Worst case" },
          { values: cov.mean, color: COL.sensor, dash: "7 6", label: "Average" },
        ],
      });
      chart.append(legend([[COL.sensor, "Worst case (solid)"], [COL.sensor, "Average across cases (dashed)"]]));
      const cols = [1, 3, 6, K_MAX].filter((k, i, a) => a.indexOf(k) === i && k <= K_MAX);
      table.replaceChildren(h("table", { class: "params" },
        h("thead", {}, h("tr", {}, h("th", { text: "Detection rule" }), ...cols.map(k => h("th", { text: `${k} sensor${k > 1 ? "s" : ""}` })))),
        h("tbody", {}, RULE_ORDER.map(r => h("tr", { class: r === rule ? "hl" : "" },
          h("td", { text: RULE_LABEL[r] }),
          ...cols.map(k => h("td", { text: `${F[`cov_${r}_worst_worst_k${k}`]}% / ${F[`cov_${r}_worst_mean_k${k}`]}%` }))))),
      ));
    };
    host.append(controls, h("div", { class: "split" }, h("div", {}, chart, h("p", { class: "muted small", text: "Each cell: worst case / average, for sensors chosen for the worst case." })), table));
    draw();
  };

  WIDGETS.sensor_slider = function (host) {
    let rule = "r25", obj = "worst", k = 3;
    const controls = h("div", { class: "toolbar" });
    const out = h("div", { class: "readout", "aria-live": "polite" });
    const chart = h("div", { class: "chart-host" });
    const mapHost = h("div", { class: "map-host" });
    const draw = () => {
      controls.replaceChildren(
        seg(RULE_ORDER.map(r => [r, RULE_LABEL[r]]), rule, v => { rule = v; draw(); }, "Detection rule"),
        seg([["worst", "Choose for the worst case"], ["mean", "Choose for the average"]], obj, v => { obj = v; draw(); }, "Objective"),
        h("label", { class: "slider" }, `Sensors: ${k}`,
          h("input", { type: "range", min: 1, max: K_MAX, value: k, step: 1, "aria-label": "Number of sensors",
            oninput: (e) => { k = Number(e.target.value); draw(); } })));
      const cov = SC.coverage[rule][obj];
      const order = SC.sensor_ids[rule][obj][K_MAX - 1];
      const chosen = order.slice(0, k).map(id => SC.chambers.indexOf(id));
      out.replaceChildren(
        h("p", { class: "big", text: `With ${k} sensor${k > 1 ? "s" : ""}: worst case ${percent(cov.worst[k - 1])}, average ${percent(cov.mean[k - 1])}` }),
        h("p", { class: "muted small", text: `Sensors chosen for the ${obj === "worst" ? "worst case" : "average"}: ${order.slice(0, k).join(", ")}` }),
      );
      chart.replaceChildren();
      lineChart(chart, {
        highlightX: k,
        series: [
          { values: cov.worst, color: COL.sensor },
          { values: cov.mean, color: COL.sensor, dash: "7 6" },
        ],
      });
      chart.append(legend([[COL.sensor, "Worst case (solid)"], [COL.sensor, "Average (dashed)"]]));
      mapHost.replaceChildren();
      const frame = mapFrame(mapHost, "Sensor sites, numbered in the order they are chosen");
      SC.chambers.forEach((_, i) => frame.dot(i, { r: 2.5, fill: COL.chamber, stroke: "none", title: "" }));
      order.forEach((id, j) => {
        if (j >= k) return;
        frame.dot(SC.chambers.indexOf(id), { r: 9, fill: COL.sensor, label: String(j + 1),
          title: `Sensor ${j + 1}: manhole ${id}` });
      });
    };
    host.append(controls, h("div", { class: "split" }, h("div", {}, out, chart), mapHost));
    draw();
  };

  WIDGETS.methods_bars = function (host) {
    const k = 3;
    const groups = [
      { label: `Greedy, chosen for the worst case (${k} sensors)`, bars: [
        { v: F[`cov_r25_worst_worst_k${k}`], color: COL.sensor, title: "Worst case" },
        { v: F[`cov_r25_worst_mean_k${k}`], color: COL.sensor, alpha: 0.55, title: "Average" }] },
      { label: `Random, best of 20 (${k} sensors)`, bars: [
        { v: F.random_k3_worst, color: COL.random, title: "Worst case" },
        { v: F.random_k3_mean, color: COL.random, alpha: 0.55, title: "Average" }] },
    ];
    host.append(legend([[COL.sensor, "Worst case"], [COL.sensor + "88", "Average"]]));
    barChart(host, { groups, max: 100, ariaLabel: `Share of growth caught by ${k} sensors on a ${F.rise_focus_mm} mm rise` });
    host.append(h("p", { class: "muted small", text: `Growth caught on a ${F.rise_focus_mm} mm rise, across the ${F.cases} cases.` }));
  };

  WIDGETS.marginal_gain = function (host) {
    let metric = "mean";
    const controls = h("div", { class: "toolbar" });
    const chart = h("div", { class: "chart-host" });
    const draw = () => {
      controls.replaceChildren(seg([["mean", "Average across cases"], ["worst", "Worst case"]], metric, v => { metric = v; draw(); }, "Measure"));
      const vals = KS.map(k => (k === 1 ? F[`cov_r25_worst_${metric}_k1`] : F[`inc_r25_worst_${metric}_k${k}`]));
      chart.replaceChildren();
      barChart(chart, {
        groups: KS.map((k, i) => ({ label: `${k}`, bars: [{ v: vals[i], color: COL.sensor, title: `Sensor ${k}: +${vals[i]} points` }] })),
        max: Math.max(...vals) > 60 ? 100 : 60, unit: " pts", ariaLabel: `Extra growth caught by each added sensor, ${metric === "mean" ? "average" : "worst case"}`,
      });
      chart.append(h("p", { class: "muted small", text: "Horizontal axis: the sensor number. Bars show percentage points of extra growth caught." }));
    };
    host.append(controls, chart);
    draw();
  };

  WIDGETS.sensitivity_table = function (host) {
    host.append(h("table", { class: "params" },
      h("thead", {}, h("tr", {}, h("th", { text: "Weather case" }), h("th", { text: "Over the alarm before growth" }), h("th", { text: "Surcharged before growth" }))),
      h("tbody", {}, SC.cases.map(cs => {
        const b = SC.baseline[String(cs.id)];
        return h("tr", {}, h("td", { text: cs.label }), h("td", { text: String(b.alarm) }), h("td", { text: String(b.surcharged) }));
      }))));
    host.append(h("p", { class: "muted small", text: `Counts before any new house connects, from the ${F.runs} simulations.` }));
  };

  WIDGETS.checks = function (host) {
    const rec = SC.reconciliation;
    const ok = rec.problems.length === 0;
    host.append(h("p", { class: ok ? "ok" : "bad", text: ok ? "All checks match the sandbox page." : "Some checks differ: " + rec.problems.join(", ") }));
    host.append(h("ol", { class: "checks" }, rec.lines.map(line => h("li", { text: line }))));
  };

  // ------------------------------------------------------------ deck

  function renderSlides() {
    const deck = document.getElementById("deck");
    const menu = document.getElementById("jump");
    SLIDES.forEach((s, i) => {
      const sec = h("section", { class: "slide" + (s.appendix ? " appendix" : ""), id: `slide-${i + 1}`, "aria-label": s.title });
      sec.append(
        h("header", { class: "kicker", text: s.kicker }),
        h("h2", { text: fill(s.title) }),
        h("div", { class: "body" }),
      );
      sec.querySelector(".body").innerHTML = fill(s.html);
      (s.widgets || []).forEach(name => {
        const host = sec.querySelector(`[data-widget="${name}"]`);
        if (host) WIDGETS[name](host);
      });
      deck.append(sec);
      menu.append(h("option", { value: String(i), text: `${i + 1}. ${s.title.replace(/\{\{[^}]+\}\}/g, "")}` }));
    });
    if (missing.length) console.error("Unresolved tokens:", [...new Set(missing)].join(", "));
  }

  function setup() {
    renderSlides();
    const slides = [...document.querySelectorAll(".slide")];
    const counter = document.getElementById("counter");
    const bar = document.getElementById("progress");
    const menu = document.getElementById("jump");
    let i = 0;
    function show(n) {
      i = Math.max(0, Math.min(slides.length - 1, n));
      slides.forEach((s, j) => s.classList.toggle("active", j === i));
      counter.textContent = `${i + 1} / ${slides.length}`;
      bar.style.width = `${((i + 1) / slides.length) * 100}%`;
      menu.value = String(i);
      history.replaceState(null, "", `#${i + 1}`);
      document.querySelector(".slide.active").scrollTop = 0;
    }
    document.getElementById("prev").addEventListener("click", () => show(i - 1));
    document.getElementById("next").addEventListener("click", () => show(i + 1));
    menu.addEventListener("change", e => show(Number(e.target.value)));
    document.addEventListener("keydown", e => {
      if (e.target.closest && e.target.closest("input, select, textarea")) return;
      if (e.key === " " && e.target.closest && e.target.closest("button")) return;
      if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); show(i + 1); }
      else if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); show(i - 1); }
      else if (e.key === "Home") show(0);
      else if (e.key === "End") show(slides.length - 1);
    });
    const start = parseInt((location.hash || "#1").slice(1), 10);
    show(Number.isFinite(start) ? start - 1 : 0);
    window.__deck = { show, slides: slides.length, missing };
  }

  document.addEventListener("DOMContentLoaded", setup);
})();
