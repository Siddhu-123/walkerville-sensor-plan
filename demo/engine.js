// Story page engine: one map stage that never reloads, a camera that moves between scenes, and the
// scene copy from content/story.js. The map is drawn on a 2D canvas with a small perspective
// camera, so the top view and the 3D view are the same drawing with a different pitch and
// vertical exaggeration: the move from 2D to 3D is a camera move, not a page change.
// Data: demo/story-data.js. Underneath runs the vintage MapLibre basemap from index.html, moved by
// the same camera every frame, so the network sits on real Adelaide streets at any zoom or tilt.
(function () {
  "use strict";
  const S = window.OSP_STORY, SCENES = window.OSP_SCENES, LIB = window.OSP_LIB, STATIC = window.OSP_STATIC || {};
  const FACTS = Object.assign({}, S.facts, STATIC);
  FACTS.greedy_k1_worst = Math.round(100 * S.curves.greedy[4]);
  const heldAge = S.held_out.find((row) => row.case === "Design wet + age-weighted I&I");
  FACTS.held_age_unseen = Math.round(100 * heldAge["unseen_k" + FACTS.plan_k1]);
  FACTS.held_age_seen = Math.round(100 * heldAge["seen_k" + FACTS.plan_k1]);
  const $ = (id) => document.getElementById(id);
  const canvas = $("stage-canvas"), ctx = canvas.getContext("2d");
  const card = $("card"), sheet = $("sheet") || card, labelsEl = $("labels"), tip = $("tip");
  const reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ------------------------------------------------------------------ georeference
  // The model is in MGA zone 54 metres (EPSG:28354) offset by S.origin_epsg28354. The basemap is Web
  // Mercator, so every point moves into local metres on the Mercator plane around Walkerville; the
  // overlay and the basemap then share one similarity transform. Checked against the published
  // manhole layer: median offset 0.04 m, worst 0.1 m.
  function mgaToLL(E, Nn) {   // Transverse Mercator inverse, GRS80 (Snyder 1987, eq. 8-12 to 8-25)
    const a = 6378137, f = 1 / 298.257222101, k0 = 0.9996, e2 = f * (2 - f), ep2 = e2 / (1 - e2);
    const x = E - 500000, M = (Nn - 10000000) / k0;
    const mu = M / (a * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 ** 3 / 256));
    const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
    const p1 = mu + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu) + (21 * e1 * e1 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu)
      + (151 * e1 ** 3 / 96) * Math.sin(6 * mu) + (1097 * e1 ** 4 / 512) * Math.sin(8 * mu);
    const sn = Math.sin(p1), c = Math.cos(p1), t = Math.tan(p1), N1 = a / Math.sqrt(1 - e2 * sn * sn), T1 = t * t, C1 = ep2 * c * c;
    const R1 = a * (1 - e2) / Math.pow(1 - e2 * sn * sn, 1.5), D = x / (N1 * k0);
    const lat = p1 - (N1 * t / R1) * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep2) * D ** 4 / 24
      + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep2 - 3 * C1 * C1) * D ** 6 / 720);
    const lon = (D - (1 + 2 * T1 + C1) * D ** 3 / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep2 + 24 * T1 * T1) * D ** 5 / 120) / c;
    return [141 + lon * 180 / Math.PI, lat * 180 / Math.PI];
  }
  const [OX, OY] = S.origin_epsg28354;
  const mercY = (lat) => 0.5 - Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) / (2 * Math.PI);
  const GEO = (function () {
    let lo0 = Infinity, lo1 = -Infinity, la0 = Infinity, la1 = -Infinity;
    for (let i = 0; i < S.nodes.x.length; i++) {
      const q = mgaToLL(S.nodes.x[i] + OX, S.nodes.y[i] + OY);
      lo0 = Math.min(lo0, q[0]); lo1 = Math.max(lo1, q[0]); la0 = Math.min(la0, q[1]); la1 = Math.max(la1, q[1]);
    }
    const lon = (lo0 + lo1) / 2, lat = (la0 + la1) / 2, f = lat * Math.PI / 180, e2 = 0.0066943800229;
    // metres per Mercator unit along the local parallel
    return { mx: (lon + 180) / 360, my: mercY(lat), Sm: 2 * Math.PI * 6378137 * Math.cos(f) / Math.sqrt(1 - e2 * Math.sin(f) ** 2) };
  })();
  const local = (lon, lat) => [((lon + 180) / 360 - GEO.mx) * GEO.Sm, (GEO.my - mercY(lat)) * GEO.Sm];
  const toLocal = (x, y) => { const q = mgaToLL(x + OX, y + OY); return local(q[0], q[1]); };
  function lngLat(X, Y) {
    const mx = GEO.mx + X / GEO.Sm, my = GEO.my - Y / GEO.Sm;
    return [mx * 360 - 180, Math.atan(Math.sinh(Math.PI * (1 - 2 * my))) * 180 / Math.PI];
  }

  // ------------------------------------------------------------------ data prep
  const N = S.nodes, nn = N.x.length;
  const CH = S.chambers, nch = CH.length;
  const chIndex = new Map(CH.map((c, i) => [c.id, i]));
  const chamberAtNode = new Map(CH.map((c, i) => [c.n, i]));
  function pipeStress(p, c) {
    const ends = [p.a, p.b].filter((n) => chamberAtNode.has(n));
    if (!ends.length || !(p.d > 0)) return null;
    const depth = S.base_depth[String(c)];
    return ends.reduce((sum, n) => sum + depth[chamberAtNode.get(n)], 0) / ends.length * 1000 / p.d;
  }
  const stressRatios = S.cases.map((_, c) => S.pipes.map((p) => pipeStress(p, c)));
  const stressOrders = stressRatios.map((ratios) => ratios.map((_, i) => i)
    .sort((a, b) => (ratios[a] ?? -Infinity) - (ratios[b] ?? -Infinity)));
  const stressWidths = [1, 1.4, 1.8, 2.3, 2.8];
  const stressBand = (v) => v === null || v < 0.25 ? 0 : v <= 0.5 ? 1 : v <= 0.75 ? 2 : v <= 1 ? 3 : 4;
  FACTS.stress_half_wet = stressRatios[1].filter((v) => v !== null && v > 0.5).length;
  FACTS.stress_half_severe = stressRatios[2].filter((v) => v !== null && v > 0.5).length;
  let stressCase = 1;
  const cover = N.cover.map((v, i) => (v > 0 ? v : N.inv[i] + 2.9));

  const pipes = S.pipes.map((p) => {
    const n = p.p.length / 2, xs = new Float64Array(n), ys = new Float64Array(n), zs = new Float64Array(n);
    let len = 0; const cum = [0];
    for (let i = 0; i < n; i++) {
      xs[i] = p.p[2 * i]; ys[i] = p.p[2 * i + 1];
      if (i) { len += Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]); cum.push(len); }
    }
    for (let i = 0; i < n; i++) zs[i] = p.za + (p.zb - p.za) * (len ? cum[i] / len : 0);
    for (let i = 0; i < n; i++) { const q = toLocal(xs[i], ys[i]); xs[i] = q[0]; ys[i] = q[1]; }   // len stays in survey metres
    return { xs, ys, zs, n, len, a: p.a, b: p.b, d: p.d, y: p.y, m: p.m, dOut: 0, onPath: false };
  });

  // pump stations (demo/pump-data.js): each rising main runs from the wet well's floor up to the
  // invert where it discharges, so the side view shows the lift
  const pumps = ((window.OSP_PUMPS && window.OSP_PUMPS.stations) || []).map((s) => {
    const n = s.p.length / 2, xs = new Float64Array(n), ys = new Float64Array(n), zs = new Float64Array(n);
    let len = 0; const cum = [0];
    for (let i = 0; i < n; i++) {
      if (i) { len += Math.hypot(s.p[2 * i] - s.p[2 * i - 2], s.p[2 * i + 1] - s.p[2 * i - 1]); cum.push(len); }
      const q = toLocal(s.p[2 * i], s.p[2 * i + 1]); xs[i] = q[0]; ys[i] = q[1];
    }
    for (let i = 0; i < n; i++) zs[i] = s.za + (s.zb - s.za) * (len ? cum[i] / len : 0);
    return { xs, ys, zs, n, wet: s.wet, modelled: s.modelled };
  });

  // nodes, manholes and homes onto the basemap plane; the one manhole with no cover level takes its node's estimate
  for (let i = 0; i < nn; i++) { const q = toLocal(N.x[i], N.y[i]); N.x[i] = q[0]; N.y[i] = q[1]; }
  CH.forEach((c) => { const q = toLocal(c.x, c.y); c.x = q[0]; c.y = q[1]; if (!(c.cover > 0)) c.cover = cover[c.n]; });
  for (let i = 0; i < S.homes.length; i += 2) { const q = toLocal(S.homes[i], S.homes[i + 1]); S.homes[i] = q[0]; S.homes[i + 1] = q[1]; }

  // distance from each node to where the network ends, along the pipes (the tree drains downhill)
  const outPipes = Array.from({ length: nn }, () => []);
  pipes.forEach((p, i) => outPipes[p.a].push(i));
  const distOut = new Float64Array(nn).fill(-1);
  function dOut(v) {
    if (distOut[v] >= 0) return distOut[v];
    distOut[v] = 0; // guards a cycle; the data has none (checked in the sandbox)
    let best = 0;
    for (const i of outPipes[v]) best = Math.max(best, pipes[i].len + dOut(pipes[i].b));
    distOut[v] = best; return best;
  }
  for (let v = 0; v < nn; v++) dOut(v);
  pipes.forEach((p) => { p.dOut = distOut[p.b]; });
  const maxOut = Math.max(...distOut);

  // the longest drainage path, for the side view
  const path = [];
  (function () {
    let v = distOut.indexOf(maxOut), guard = 0;
    while (outPipes[v].length && guard++ < 2000) {
      let pick = outPipes[v][0];
      for (const i of outPipes[v]) if (pipes[i].len + distOut[pipes[i].b] > pipes[pick].len + distOut[pipes[pick].b]) pick = i;
      pipes[pick].onPath = true; path.push(pick); v = pipes[pick].b;
    }
  })();
  FACTS.path_fall_m = (N.inv[pipes[path[0]].a] - N.inv[pipes[path[path.length - 1]].b]).toFixed(1);
  FACTS.path_km = (path.reduce((t, i) => t + pipes[i].len, 0) / 1000).toFixed(1);

  // bounds
  let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
  for (let i = 0; i < nn; i++) { bx0 = Math.min(bx0, N.x[i]); bx1 = Math.max(bx1, N.x[i]); by0 = Math.min(by0, N.y[i]); by1 = Math.max(by1, N.y[i]); }
  const zMid = (Math.min(...cover) + Math.max(...cover)) / 2;

  // ------------------------------------------------------------------ terrain (ground level from manhole covers)
  const GRID = 58, pad = 160;
  const gx0 = bx0 - pad, gy0 = by0 - pad, gw = (bx1 - bx0 + 2 * pad), gh = (by1 - by0 + 2 * pad);
  const cs = Math.max(gw, gh) / GRID, GX = Math.ceil(gw / cs) + 1, GY = Math.ceil(gh / cs) + 1;
  const bucket = new Map(), BK = 150;
  for (let i = 0; i < nn; i++) {
    const k = Math.floor(N.x[i] / BK) + "," + Math.floor(N.y[i] / BK);
    if (!bucket.has(k)) bucket.set(k, []); bucket.get(k).push(i);
  }
  function near(x, y, r) {
    const out = [], R = Math.ceil(r / BK), cx = Math.floor(x / BK), cy = Math.floor(y / BK);
    for (let a = -R; a <= R; a++) for (let b = -R; b <= R; b++) { const l = bucket.get((cx + a) + "," + (cy + b)); if (l) out.push(...l); }
    return out;
  }
  const gz = new Float64Array(GX * GY), gmask = new Float64Array(GX * GY);
  for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++) {
    const x = gx0 + i * cs, y = gy0 + j * cs;
    let cand = near(x, y, 450); if (cand.length < 3) cand = near(x, y, 1600);
    let ws = 0, zs = 0, dmin = Infinity;
    for (const v of cand) {
      const d = Math.hypot(N.x[v] - x, N.y[v] - y); dmin = Math.min(dmin, d);
      const w = 1 / Math.pow(d + 25, 2); ws += w; zs += w * cover[v];
    }
    gz[j * GX + i] = ws ? zs / ws : zMid;
    gmask[j * GX + i] = dmin < 140 ? 1 : dmin > 330 ? 0 : 1 - (dmin - 140) / 190;
  }
  function groundAt(x, y) {
    const fi = Math.max(0, Math.min(GX - 1.001, (x - gx0) / cs)), fj = Math.max(0, Math.min(GY - 1.001, (y - gy0) / cs));
    const i = Math.floor(fi), j = Math.floor(fj), u = fi - i, v = fj - j;
    const z00 = gz[j * GX + i], z10 = gz[j * GX + i + 1], z01 = gz[(j + 1) * GX + i], z11 = gz[(j + 1) * GX + i + 1];
    return (z00 * (1 - u) + z10 * u) * (1 - v) + (z01 * (1 - u) + z11 * u) * v;
  }
  const zLo = Math.min(...gz), zHi = Math.max(...gz);
  const quads = [];
  for (let j = 0; j < GY - 1; j++) for (let i = 0; i < GX - 1; i++) {
    const a = j * GX + i, m = (gmask[a] + gmask[a + 1] + gmask[a + GX] + gmask[a + GX + 1]) / 4;
    if (m <= 0.35) continue;
    const dzx = (gz[a + 1] + gz[a + GX + 1] - gz[a] - gz[a + GX]) / (2 * cs);
    const dzy = (gz[a + GX] + gz[a + GX + 1] - gz[a] - gz[a + 1]) / (2 * cs);
    const E = 7, nx = -dzx * E, ny = -dzy * E, nl = Math.hypot(nx, ny, 1);
    const shade = Math.max(0, Math.min(1, ((nx * -0.55 + ny * 0.55 + 0.63) / nl)));
    const h = ((gz[a] - zLo) / (zHi - zLo || 1));
    const base = [240 - 14 * h, 229 - 8 * h, 210 - 20 * h];   // the basemap's land tones, cream to sage
    const f = 0.86 + 0.22 * shade;
    quads.push({ i, j, m, rgb: base.map((c) => Math.min(255, Math.round(c * f))),
      darkRgb: [35 - 5 * h, 33 - 3 * h, 26 - 4 * h].map((c) => Math.round(c * f)) });
  }

  // homes on the ground
  const homes = [];
  for (let i = 0; i < S.homes.length; i += 2) homes.push([S.homes[i], S.homes[i + 1], groundAt(S.homes[i], S.homes[i + 1])]);

  // the plan
  const phase1 = S.plan.phase1.map((id) => chIndex.get(id));
  const phase2 = S.plan.phase2.map((id) => chIndex.get(id));
  const trunk = S.alt_sets.trunk.map((id) => chIndex.get(id));
  const ROLE = { "Dry": ["Dry-day watcher", "dry-day"], "Design wet": ["Wet-weather watcher", "wet-weather"], "Severe": ["Storm watcher", "storm"] };
  const CASE_NOTE = ["Sewage only, no leakage into the pipes.",
    "Leakage at the level that just meets the utility's design rating for these pipes.",
    "A heavy wet period: leakage at " + S.facts.ii_severe + " L/s per 100 m of pipe.",
    "Design-wet leakage, shifted toward the older pipes.",
    "Design wet, with half as much again arriving from outside the area."];
  const caseIdx = {}; S.cases.forEach((c, i) => { caseIdx[c.label] = i; });
  const caseRate = (c) => {
    const rate = c === 0 ? "0" : (c === 2 ? S.facts.ii_severe : S.facts.ii_design).toFixed(2);
    return `${rate} L/s per 100 m${c === 3 ? ", by pipe age" : c === 4 ? ", outside flow x1.5" : ""}`;
  };
  const CASE_SHORT = ["Dry day", "Design wet", "Storm", "Leaky old pipes", "Extra inflow"];

  // ------------------------------------------------------------------ colour helpers
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  function ramp(stops, t) {
    t = Math.max(0, Math.min(1, t));
    for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) {
      const [t0, c0] = stops[i - 1], [t1, c1] = stops[i]; return mix(c0, c1, (t - t0) / (t1 - t0 || 1));
    }
    return stops[stops.length - 1][1];
  }
  // CSS is the shared palette for canvas marks, legend swatches and inline charts.
  const C = {}, AGE = [], RISE = [], sizes = [], pipeCols = {};
  let darkTheme = false;
  const SIZE = (d) => sizes[d <= 150 ? 0 : d <= 225 ? 1 : d <= 300 ? 2 : 3];
  const riseCol = (mm) => ramp(RISE, Math.log(1 + mm) / Math.log(1 + 80));
  function updateStressColours() {
    const colours = [C.faint, mix(RISE[0][1], RISE[1][1], 0.5), RISE[1][1], RISE[2][1], RISE[3][1]];
    pipeCols.stress = stressRatios[stressCase].map((v) => colours[stressBand(v)]);
  }
  function updatePalette() {
    darkTheme = document.documentElement.dataset.theme === "dark";
    const css = getComputedStyle(document.documentElement);
    const colour = (token) => hex(css.getPropertyValue("--" + token).trim());
    for (const [key, token] of Object.entries({ ink: "canvas-ink", accent: "canvas-ink", pipe: "teal",
      faint: "canvas-faint", water: "water", growth: "amber", warn: "rust", alarm: "rust", sur: "canvas-sur",
      white: "canvas-white", paper: "canvas-paper", home: "canvas-home", trunk: "canvas-trunk", rain: "canvas-rain" })) C[key] = colour(token);
    AGE.splice(0, AGE.length, ...[0, 0.35, 0.7, 1].map((t, i) => [t, colour("age-" + i)]));
    RISE.splice(0, RISE.length, ...[0, 0.3, 0.6, 1].map((t, i) => [t, colour("rise-" + i)]));
    sizes.splice(0, sizes.length, ...[0, 1, 2, 3].map((i) => colour("size-" + i)));
    pipeCols.plain = pipes.map(() => C.pipe);
    pipeCols.age = pipes.map((p) => ramp(AGE, ((p.y || 1950) - 1896) / (2010 - 1896)));
    pipeCols.size = pipes.map((p) => SIZE(p.d));
    pipeCols.path = pipes.map((p) => p.onPath ? C.accent : C.faint);
    updateStressColours();
  }
  updatePalette();

  // ------------------------------------------------------------------ camera
  const cam = { x: (bx0 + bx1) / 2, y: (by0 + by1) / 2, z: zMid, zoom: 0.2, pitch: 0, bearing: 0, ve: 0, D: 9000, sx: 0, sy: 0 };
  const T = { cp: 1, sp: 0, cb: 1, sb: 0 };
  function trig(c) { T.cp = Math.cos(c.pitch); T.sp = Math.sin(c.pitch); T.cb = Math.cos(c.bearing); T.sb = Math.sin(c.bearing); }
  const pt = [0, 0, 0, 1];
  function P(x, y, z, c = cam, out = pt) {
    const dx = x - c.x, dy = y - c.y, dz = (z - c.z) * c.ve;
    const rx = dx * T.cb - dy * T.sb, ry = dx * T.sb + dy * T.cb;
    const up = ry * T.cp + dz * T.sp, depth = ry * T.sp - dz * T.cp;
    const k = c.D / Math.max(c.D + depth, c.D * 0.08);
    out[0] = c.sx + rx * c.zoom * k; out[1] = c.sy - up * c.zoom * k; out[2] = depth; out[3] = k;
    return out;
  }
  let W = 0, H = 0, DPR = 1;
  function freeRect() {
    const r = sheet.getBoundingClientRect(), portrait = W <= 900 || W / H < 0.8;
    if (portrait) return { x0: 20, x1: W - 20, y0: 24, y1: Math.max(160, (r.height ? r.top : H * 0.5) - 16) };
    return { x0: (r.right || 420) + 8, x1: W - 40, y0: 48, y1: H - 56 };
  }
  function fit(box, o) {
    const ext = Math.max(box.x1 - box.x0, box.y1 - box.y0, 80);
    const c = { x: (box.x0 + box.x1) / 2, y: (box.y0 + box.y1) / 2, z: o.z != null ? o.z : zMid, zoom: 1,
      pitch: (o.pitch || 0) * Math.PI / 180, bearing: (o.bearing || 0) * Math.PI / 180, ve: o.ve || 0,
      D: ext * 1.4, sx: 0, sy: 0 };
    const zs = o.ve ? [box.z0 != null ? box.z0 : zMid - 3, box.z1 != null ? box.z1 : zMid] : [c.z];
    const corners = box.pts && o.ve ? box.pts : [];
    if (!corners.length) for (const X of [box.x0, box.x1]) for (const Y of [box.y0, box.y1]) for (const Z of zs) corners.push([X, Y, Z]);
    const a = freeRect(), padf = o.pad != null ? o.pad : 0.08;
    let x0, x1, y0, y1, zoom = 1;
    for (let it = 0; it < 3; it++) {   // zoom sets the perspective distance, which changes the fit: settle in three passes
      c.zoom = 1; trig(c); x0 = Infinity; x1 = -Infinity; y0 = Infinity; y1 = -Infinity;
      for (const q of corners) {
        P(q[0], q[1], q[2], c); x0 = Math.min(x0, pt[0]); x1 = Math.max(x1, pt[0]); y0 = Math.min(y0, pt[1]); y1 = Math.max(y1, pt[1]);
      }
      zoom = Math.min((a.x1 - a.x0) * (1 - padf) / (x1 - x0 || 1), (a.y1 - a.y0) * (1 - padf) / (y1 - y0 || 1)) * (o.zoomMul || 1);
      c.D = 1.5 * H / zoom;
    }
    trig(cam);
    c.zoom = zoom;
    c.sx = (a.x0 + a.x1) / 2 - zoom * (x0 + x1) / 2;
    c.sy = (a.y0 + a.y1) / 2 - zoom * (y0 + y1) / 2 + (o.dy || 0);
    return c;
  }
  function boxOf(idx, padm, useNodes) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const i of idx) {
      const x = useNodes ? N.x[i] : CH[i].x, y = useNodes ? N.y[i] : CH[i].y;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      const zi = useNodes ? N.inv[i] : CH[i].inv, zc = useNodes ? cover[i] : CH[i].cover;
      z0 = Math.min(z0, zi); z1 = Math.max(z1, zc);
    }
    padm = padm || 0;
    return { x0: x0 - padm, x1: x1 + padm, y0: y0 - padm, y1: y1 + padm, z0, z1 };
  }
  const AX = (function () {
    let mx = 0, my = 0; for (let i = 0; i < nn; i++) { mx += N.x[i]; my += N.y[i]; } mx /= nn; my /= nn;
    let sxx = 0, syy = 0, sxy = 0; for (let i = 0; i < nn; i++) { const dx = N.x[i] - mx, dy = N.y[i] - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; }
    return 0.5 * Math.atan2(2 * sxy, sxx - syy) * 180 / Math.PI;   // long-axis angle, degrees from east
  })();
  const PTS = []; for (let i = 0; i < nn; i += 2) { PTS.push([N.x[i], N.y[i], cover[i]], [N.x[i], N.y[i], N.inv[i]]); }
  const ALL = { pts: PTS, x0: bx0, x1: bx1, y0: by0, y1: by1, z0: Math.min(...N.inv), z1: Math.max(...cover) };
  function around(i, r) { const c = CH[i]; return { x0: c.x - r, x1: c.x + r, y0: c.y - r, y1: c.y + r, z0: c.inv - 1, z1: c.cover + 1 }; }

  let tween = null;
  const ANG = (a, b, t) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * t; };
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  function flyTo(target, ms) {
    if (reduced || !ms) { Object.assign(cam, target); tween = null; return; }
    tween = { from: Object.assign({}, cam), to: target, t0: performance.now(), ms };
  }
  function stepCamera(now) {
    if (!tween) return;
    const t = Math.min(1, (now - tween.t0) / tween.ms), e = ease(t), f = tween.from, g = tween.to;
    for (const k of ["x", "y", "z", "pitch", "ve", "sx", "sy"]) cam[k] = f[k] + (g[k] - f[k]) * e;
    cam.zoom = Math.exp(Math.log(f.zoom) + (Math.log(g.zoom) - Math.log(f.zoom)) * e);
    cam.bearing = ANG(f.bearing, g.bearing, e);
    // arc out a little on long moves, so a cut across the map reads as one flight
    const lift = Math.sin(Math.PI * e) * Math.min(0.28, Math.hypot(g.x - f.x, g.y - f.y) / 9000);
    cam.zoom *= 1 - lift;
    if (t >= 1) tween = null;
  }

  // ------------------------------------------------------------------ layers and effects
  const L = {}, LT = {};
  const LAYERS = ["basemap", "terrain", "homes", "pipes", "chambers", "shafts", "water", "sensors", "phase2", "trunk", "alarm", "resp", "flow", "pumps", "rain", "spikes"];
  LAYERS.forEach((k) => { L[k] = 0; LT[k] = 0; });
  const fx = { style: "plain", prevStyle: "plain", styleMix: 1, widthMul: 1, reveal: 1, revealT0: 0, sensorT0: 0,
    resp: null, alarmCase: 1, waterCase: 1, waterShown: 1, laterals: null, drift: 0, hover: -1, focus: -1, pathLabels: false };

  function setLayers(show) { LAYERS.forEach((k) => { LT[k] = show && show[k] != null ? show[k] : k === "basemap" ? 0.58 : 0; }); }
  function stepLayers(dt) {
    const a = 1 - Math.exp(-dt / 260);
    LAYERS.forEach((k) => { L[k] += (LT[k] - L[k]) * a; if (Math.abs(LT[k] - L[k]) < 0.002) L[k] = LT[k]; });
    fx.styleMix = Math.min(1, fx.styleMix + dt / 700);
    fx.widthMul += ((fx.widthTarget || 1) - fx.widthMul) * a;
  }

  // ------------------------------------------------------------------ basemap (MapLibre), moved by the story camera
  const mapEl = $("map");
  let gl = null, glReady = false, glKey = "";
  if (window.maplibregl && typeof buildMapStyle === "function") {
    try {
      gl = new maplibregl.Map({ container: mapEl, style: buildMapStyle(), interactive: false, attributionControl: false,
        maxPitch: 85, fadeDuration: 0, center: [138.578, -34.922], zoom: 12.15 });
      gl.on("load", () => {
        glReady = true; glKey = "";
        window.applyBasemapTheme(document.documentElement.dataset.theme || "light", gl);
      });
    } catch (e) { gl = null; }   // no WebGL: the overlay still tells the story on the cream ground
  }
  function syncMap() {
    if (!gl) return;
    // fade the street map as the camera tilts, so the raised network reads against it
    const op = (L.basemap * (1 - 0.62 * Math.min(1, cam.pitch / 0.9))).toFixed(3);
    if (mapEl.style.opacity !== op) mapEl.style.opacity = op;
    const ll = lngLat(cam.x, cam.y), z = Math.log2(cam.zoom * GEO.Sm / 512);
    const key = [ll[0].toFixed(7), ll[1].toFixed(7), z.toFixed(4), cam.pitch.toFixed(4), cam.bearing.toFixed(4), cam.sx.toFixed(1), cam.sy.toFixed(1), W, H].join();
    if (key === glKey) return;
    glKey = key;
    // padding puts the basemap's centre (and vanishing point) where the overlay camera has it
    const sx = Math.max(1, Math.min(W - 1, cam.sx)), sy = Math.max(1, Math.min(H - 1, cam.sy));
    gl.jumpTo({ center: ll, zoom: z, bearing: cam.bearing * 180 / Math.PI, pitch: cam.pitch * 180 / Math.PI,
      padding: { left: Math.max(0, 2 * sx - W), right: Math.max(0, W - 2 * sx), top: Math.max(0, 2 * sy - H), bottom: Math.max(0, H - 2 * sy) } });
    if (glReady) gl.redraw();
  }

  // ------------------------------------------------------------------ drawing
  const SUR = {}; for (const k in S.base_surcharged) SUR[k] = new Set(S.base_surcharged[k]);
  const scr = new Float64Array(nch * 3); // projected chambers, for picking and labels
  let frameDt = 16;
  function draw(now) {
    trig(cam);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);   // the basemap shows through

    const zoomScale = Math.max(1, Math.min(3.4, Math.sqrt(cam.zoom / 0.22)));
    if (L.terrain > 0.01) drawTerrain();
    if (L.homes > 0.01) drawHomes(zoomScale);
    if (L.shafts > 0.01) drawShafts(zoomScale);
    if (L.pipes > 0.01) drawPipes(now, zoomScale);
    if (L.flow > 0.01) drawFlow(now, zoomScale);
    if (L.pumps > 0.01) drawPumps(now, zoomScale);
    if (fx.laterals && L.homes > 0.01) drawLaterals(now);
    if (L.water > 0.01) drawWater(zoomScale, frameDt);
    projectChambers();
    if (L.chambers > 0.01) drawChambers(zoomScale);
    if (L.alarm > 0.01) drawAlarm(now);
    if (L.resp > 0.01 && fx.resp) drawResponse(now, zoomScale);
    if (L.trunk > 0.01) drawSet(trunk, L.trunk, "trunk", now);
    if (L.phase2 > 0.01) drawSet(phase2, L.phase2, "phase2", now);
    if (L.sensors > 0.01) drawSet(phase1, L.sensors, "phase1", now);
    if (fx.hover >= 0) drawHover();
    if (L.rain > 0.01) drawRain(now);
    placeLabels();
    furniture();
  }

  function drawTerrain() {
    // the top view shows the basemap itself; the shaded ground rises in as the camera tilts
    const flat = 1 - Math.max(0, Math.min(1, (cam.pitch - 0.02) / 0.22));
    if (flat >= 0.99) return;
    const q = [], a = [0, 0, 0, 0], b = [0, 0, 0, 0], c = [0, 0, 0, 0], d = [0, 0, 0, 0];
    const sort = cam.pitch > 0.01;
    for (const t of quads) {
      const i = t.i, j = t.j, x = gx0 + i * cs, y = gy0 + j * cs;
      P(x, y, gz[j * GX + i], cam, a); P(x + cs, y, gz[j * GX + i + 1], cam, b);
      P(x + cs, y + cs, gz[(j + 1) * GX + i + 1], cam, c); P(x, y + cs, gz[(j + 1) * GX + i], cam, d);
      const minx = Math.min(a[0], b[0], c[0], d[0]), maxx = Math.max(a[0], b[0], c[0], d[0]);
      const miny = Math.min(a[1], b[1], c[1], d[1]), maxy = Math.max(a[1], b[1], c[1], d[1]);
      if (maxx < 0 || minx > W || maxy < 0 || miny > H) continue;
      q.push([a[0], a[1], b[0], b[1], c[0], c[1], d[0], d[1], sort ? a[2] + c[2] : 0, t]);
    }
    if (sort) q.sort((u, v) => v[8] - u[8]);
    ctx.lineWidth = 1; ctx.lineJoin = "round";
    const alpha = L.terrain * 0.62 * (1 - flat);
    for (const s of q) {
      const t = s[9], col = rgba(darkTheme ? t.darkRgb : t.rgb, alpha * t.m);
      ctx.fillStyle = col; ctx.strokeStyle = col;
      ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.lineTo(s[2], s[3]); ctx.lineTo(s[4], s[5]); ctx.lineTo(s[6], s[7]); ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
  }

  function drawHomes(zs) {
    ctx.fillStyle = rgba(C.home, 0.75 * L.homes);
    const s = Math.max(1.4, Math.min(4, 1.2 * zs));
    for (const h of homes) {
      P(h[0], h[1], h[2]); if (pt[0] < -5 || pt[0] > W + 5 || pt[1] < -5 || pt[1] > H + 5) continue;
      ctx.fillRect(pt[0] - s / 2, pt[1] - s / 2, s, s);
    }
  }

  function pipeWidth(p, zs) { return (1 + (p.d / 1000) * 3.6) * zs * fx.widthMul; }

  function drawPipes(now, zs) {
    const reveal = fx.reveal < 1 ? fx.reveal : 1;
    const R = reveal * (maxOut + 400);
    const prev = pipeCols[fx.prevStyle], cur = pipeCols[fx.style], m = fx.styleMix;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    const pathMode = fx.style === "path", stressMode = fx.style === "stress";
    const order = stressMode ? stressOrders[stressCase] : null;
    const widthMul = (i) => stressMode ? 1 + (stressWidths[stressBand(stressRatios[stressCase][i])] - 1) * m : 1;
    // a paper casing first, so the network reads apart from the basemap's streets
    if (L.basemap > 0.05) {
      ctx.strokeStyle = rgba(C.paper, 0.8 * L.pipes * Math.min(1, L.basemap * 1.6));
      for (let j = 0; j < pipes.length; j++) {
        const i = order ? order[j] : j, p = pipes[i];
        if (reveal < 1 && R - p.dOut < 0) continue;
        ctx.lineWidth = pipeWidth(p, zs) * (pathMode && p.onPath ? 2 : 1) * widthMul(i) + 2.4;
        ctx.beginPath();
        for (let v = 0; v < p.n; v++) { P(p.xs[v], p.ys[v], p.zs[v]); v ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1]); }
        ctx.stroke();
      }
    }
    for (let pass = 0; pass < (pathMode ? 2 : 1); pass++) {
      for (let j = 0; j < pipes.length; j++) {
        const i = order ? order[j] : j, p = pipes[i];
        if (pathMode && (pass === 0) === p.onPath) continue;
        let a = L.pipes;
        if (fx.style === "stress" && stressRatios[stressCase][i] === null) a *= 0.18;
        if (reveal < 1) a *= Math.max(0, Math.min(1, (R - p.dOut) / 380));
        if (a < 0.01) continue;
        const col = m >= 1 ? cur[i] : mix(prev[i], cur[i], m);
        ctx.strokeStyle = rgba(col, a * 0.95);
        ctx.lineWidth = pipeWidth(p, zs) * (pathMode && p.onPath ? 2 : 1) * widthMul(i);
        ctx.beginPath();
        for (let v = 0; v < p.n; v++) { P(p.xs[v], p.ys[v], p.zs[v]); v ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1]); }
        ctx.stroke();
      }
    }
  }

  function drawFlow(now, zs) {
    ctx.save();
    ctx.lineCap = "round";
    ctx.setLineDash([3 * zs, 13 * zs]);
    ctx.lineDashOffset = -(now / 1000) * 26 * zs;
    const pathOnly = fx.style === "path";
    for (const p of pipes) {
      if (pathOnly && !p.onPath) continue;
      ctx.strokeStyle = rgba(C.water, 0.85 * L.flow);
      ctx.lineWidth = pipeWidth(p, zs) * (pathOnly ? 1.6 : 1) + 0.6;
      ctx.beginPath();
      for (let v = 0; v < p.n; v++) { P(p.xs[v], p.ys[v], p.zs[v]); v ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1]); }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPumps(now, zs) {
    const top = [0, 0, 0, 0], r = 6.5;
    ctx.save();
    ctx.lineCap = "round";
    for (const s of pumps) {
      const a = L.pumps * (s.modelled ? 1 : 0.6);
      // the rising main: the dashes run uphill from the wet well to where it discharges
      ctx.setLineDash([4 * zs, 4 * zs]);
      ctx.lineDashOffset = s.modelled ? -(now / 1000) * 18 * zs : 0;
      ctx.strokeStyle = rgba(s.modelled ? C.water : C.ink, 0.95 * a); ctx.lineWidth = 1.6 * zs;
      ctx.beginPath();
      for (let v = 0; v < s.n; v++) { P(s.xs[v], s.ys[v], s.zs[v]); v ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1]); }
      ctx.stroke();
      // the station: a diamond at ground level over its wet well, on a stem down to the well floor
      const w = s.wet;
      P(N.x[w], N.y[w], cover[w], cam, top); P(N.x[w], N.y[w], N.inv[w]);
      ctx.setLineDash([]); ctx.strokeStyle = rgba(C.ink, 0.6 * a); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo(pt[0], pt[1]); ctx.stroke();
      if (!s.modelled) ctx.setLineDash([2.5, 2]);
      ctx.fillStyle = rgba(s.modelled ? C.ink : C.white, a); ctx.strokeStyle = rgba(s.modelled ? C.white : C.ink, a); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(top[0], top[1] - r); ctx.lineTo(top[0] + r, top[1]); ctx.lineTo(top[0], top[1] + r); ctx.lineTo(top[0] - r, top[1]); ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  function drawShafts(zs) {
    const a = L.shafts, top = [0, 0, 0, 0];
    ctx.lineCap = "butt";
    for (let i = 0; i < nn; i++) {
      if (!N.mh[i]) continue;
      P(N.x[i], N.y[i], cover[i], cam, top); P(N.x[i], N.y[i], N.inv[i]);
      if (top[0] < -20 || top[0] > W + 20) continue;
      ctx.strokeStyle = rgba(C.pipe, 0.45 * a); ctx.lineWidth = Math.max(1, 0.9 * zs);
      ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo(pt[0], pt[1]); ctx.stroke();
      ctx.fillStyle = rgba(C.white, 0.95 * a); ctx.strokeStyle = rgba(C.pipe, 0.7 * a); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(top[0], top[1], 2.4 * zs * 0.8, 2.4 * zs * 0.8 * Math.max(0.35, T.cp), 0, 0, 7); ctx.fill(); ctx.stroke();
    }
  }

  const shownDepth = new Float64Array(nch);
  function drawWater(zs, dt) {
    const c = String(fx.waterCase), depth = S.base_depth[c], bot = [0, 0, 0, 0], sur = SUR[c];
    const a = 1 - Math.exp(-(dt || 16) / 380);
    ctx.lineCap = "round";
    for (let i = 0; i < nch; i++) {
      shownDepth[i] += (Math.min(depth[i] || 0, 1.5) - shownDepth[i]) * a;
      const d = shownDepth[i]; if (!(d > 0.004)) continue;
      const ch = CH[i];
      P(ch.x, ch.y, ch.cover, cam, bot); P(ch.x, ch.y, ch.cover + d * 60 / Math.max(cam.ve, 1));
      const full = sur.has(i);
      ctx.strokeStyle = rgba(full ? C.sur : C.water, 0.88 * L.water);
      ctx.lineWidth = Math.max(3, 3 * zs);
      ctx.beginPath(); ctx.moveTo(bot[0], bot[1]); ctx.lineTo(pt[0], pt[1]); ctx.stroke();
    }
  }

  function projectChambers() {
    for (let i = 0; i < nch; i++) { const c = CH[i]; P(c.x, c.y, c.cover); scr[3 * i] = pt[0]; scr[3 * i + 1] = pt[1]; scr[3 * i + 2] = pt[3]; }
  }

  function drawChambers(zs) {
    const a = L.chambers, r = Math.max(1.6, Math.min(3.6, 1.5 * zs));
    const R = (fx.reveal < 1 ? fx.reveal : 1) * (maxOut + 400);
    ctx.lineWidth = 1;
    for (let i = 0; i < nch; i++) {
      let al = a;
      if (fx.reveal < 1) al *= Math.max(0, Math.min(1, (R - distOut[CH[i].n]) / 380));
      if (fx.chamberPop) al *= Math.max(0, Math.min(1, (performance.now() - fx.chamberPop - distOut[CH[i].n] / 3) / 300));
      if (al < 0.01) continue;
      ctx.fillStyle = rgba(C.white, al); ctx.strokeStyle = rgba(C.ink, 0.55 * al);
      ctx.beginPath(); ctx.arc(scr[3 * i], scr[3 * i + 1], r, 0, 7); ctx.fill(); ctx.stroke();
    }
  }

  function drawAlarm(now) {
    const c = String(fx.alarmCase), al = S.base_alarm[c], sur = new Set(S.base_surcharged[c]);
    for (const i of al) {
      const x = scr[3 * i], y = scr[3 * i + 1], s = sur.has(i);
      ctx.fillStyle = rgba(s ? C.sur : C.alarm, 0.92 * L.alarm);
      ctx.beginPath(); ctx.arc(x, y, s ? 4.4 : 3.6, 0, 7); ctx.fill();
    }
  }

  function drawResponse(now, zs) {
    const r = fx.resp, list = S.response[String(r.c)][r.site] || [];
    const age = (now - r.t0) / 1000, a = L.resp;
    const sx = scr[3 * r.site], sy = scr[3 * r.site + 1];
    // responders, in order of how much they rise
    const spikes = L.spikes;
    list.forEach(([i, mm], k) => {
      const appear = Math.max(0, Math.min(1, (age - 0.25 - k * 0.035) / 0.35));
      if (appear <= 0) return;
      const col = riseCol(mm), x = scr[3 * i], y = scr[3 * i + 1];
      const big = mm >= FACTS.rise_focus_mm;
      if (spikes > 0.01) {
        const ch = CH[i], h = Math.min(mm, 120) * appear;
        const top = [0, 0, 0, 0]; P(ch.x, ch.y, ch.cover, cam, top); P(ch.x, ch.y, ch.cover + h * 0.65 / Math.max(cam.ve, 1));
        // a ground ring at the lid, then the rise as an upright bar with a cap
        const rr = (3 + Math.sqrt(mm) * 0.9) * appear * Math.min(1.6, zs * 0.7 + 0.5);
        ctx.fillStyle = rgba(col, 0.22 * a * spikes); ctx.beginPath(); ctx.ellipse(top[0], top[1], rr, rr * Math.max(0.3, T.cp), 0, 0, 7); ctx.fill();
        ctx.lineCap = "round"; ctx.strokeStyle = rgba(col, 0.95 * a * spikes); ctx.lineWidth = Math.max(2.4, (big ? 3.2 : 2.2) * zs * 0.8);
        ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo(pt[0], pt[1]); ctx.stroke(); ctx.lineCap = "butt";
        ctx.fillStyle = rgba(col, a * spikes); ctx.beginPath(); ctx.arc(pt[0], pt[1], big ? 4.2 : 2.8, 0, 7); ctx.fill();
        if (big) { ctx.strokeStyle = rgba(C.white, 0.9 * a * spikes); ctx.lineWidth = 1.2; ctx.stroke(); }
      }
      const flat = 1 - spikes;
      if (flat > 0.01) {
        const rad = (2.4 + Math.sqrt(mm) * 1.15) * appear * Math.min(1.6, zs * 0.7 + 0.5);
        ctx.fillStyle = rgba(col, 0.82 * a * flat); ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill();
        if (big) { ctx.strokeStyle = rgba(C.ink, 0.55 * a * flat); ctx.lineWidth = 1.2; ctx.stroke(); }
      }
    });
    // the growth site
    const pulse = (age % 1.6) / 1.6;
    ctx.strokeStyle = rgba(C.growth, a * (1 - pulse)); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(sx, sy, 8 + pulse * 26, 0, 7); ctx.stroke();
    ctx.fillStyle = rgba(C.growth, a); ctx.beginPath(); ctx.arc(sx, sy, 7.5, 0, 7); ctx.fill();
    ctx.strokeStyle = rgba(C.white, a); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(sx - 3.6, sy); ctx.lineTo(sx + 3.6, sy); ctx.moveTo(sx, sy - 3.6); ctx.lineTo(sx, sy + 3.6); ctx.stroke();
  }

  function drawSet(set, a, kind, now) {
    set.forEach((i, k) => {
      if (i == null) return;
      let al = a;
      if (kind === "phase1" && fx.sensorT0) al *= Math.max(0, Math.min(1, ((now - fx.sensorT0) / 1000 - k * 0.32) / 0.35));
      if (al < 0.01) return;
      const x = scr[3 * i], y = scr[3 * i + 1];
      if (kind === "phase1") {
        const ph = ((now / 1000 + k * 0.37) % 2.2) / 2.2;
        ctx.strokeStyle = rgba(C.accent, al * 0.5 * (1 - ph)); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, 10 + ph * 22, 0, 7); ctx.stroke();
        ctx.fillStyle = rgba(C.accent, al); ctx.strokeStyle = rgba(C.white, al); ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(x, y, 10, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = rgba(C.white, al); ctx.font = "700 11px Inter, system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(String(k + 1), x, y + 0.5);
      } else if (kind === "phase2") {
        ctx.fillStyle = rgba(C.white, al * 0.95); ctx.strokeStyle = rgba(C.accent, al); ctx.lineWidth = 2.2; ctx.setLineDash([3, 2.5]);
        ctx.beginPath(); ctx.arc(x, y, 8.5, 0, 7); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = rgba(C.accent, al); ctx.font = "700 10px Inter, system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(String(k + 6), x, y + 0.5);
      } else {
        ctx.fillStyle = rgba(C.trunk, al * 0.9); ctx.strokeStyle = rgba(C.white, al); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.rect(x - 6.5, y - 6.5, 13, 13); ctx.fill(); ctx.stroke();
      }
    });
  }

  function drawHover() {
    const i = fx.hover, x = scr[3 * i], y = scr[3 * i + 1];
    ctx.strokeStyle = rgba(C.ink, 0.8); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.stroke();
  }

  const drops = Array.from({ length: 140 }, () => [Math.random(), Math.random(), 0.6 + Math.random() * 0.8]);
  function drawRain(now) {
    ctx.strokeStyle = rgba(C.rain, 0.26 * L.rain); ctx.lineWidth = 1;
    ctx.beginPath();
    for (const d of drops) {
      const y = ((d[1] + now / 1000 * 0.55 * d[2]) % 1) * (H + 40) - 20, x = d[0] * W + y * 0.12;
      ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 16 * d[2]);
    }
    ctx.stroke();
  }

  function drawLaterals(now) {
    const a = L.homes;
    const ph = (now / 1000 * 0.7) % 1;
    for (const l of fx.laterals) {
      const h = homes[l.h];
      const s0 = [0, 0, 0, 0]; P(h[0], h[1], h[2], cam, s0); P(l.x, l.y, l.z);
      ctx.strokeStyle = rgba(l.isNew ? C.growth : C.faint, (l.isNew ? 0.8 : 0.5) * a); ctx.lineWidth = l.isNew ? 1.6 : 1;
      ctx.beginPath(); ctx.moveTo(s0[0], s0[1]); ctx.lineTo(pt[0], pt[1]); ctx.stroke();
      const t = (ph + l.o) % 1;
      ctx.fillStyle = rgba(l.isNew ? C.growth : C.water, (l.isNew ? 1 : 0.55) * a);
      ctx.beginPath(); ctx.arc(s0[0] + (pt[0] - s0[0]) * t, s0[1] + (pt[1] - s0[1]) * t, l.isNew ? 2.6 : 1.6, 0, 7); ctx.fill();
      if (l.isNew) { ctx.fillStyle = rgba(C.growth, a); ctx.strokeStyle = rgba(C.white, a); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.rect(s0[0] - 4, s0[1] - 4, 8, 8); ctx.fill(); ctx.stroke(); }
    }
  }

  // ------------------------------------------------------------------ labels (HTML, anchored to the map)
  let labels = [];
  function setLabels(list) {
    labelsEl.innerHTML = ""; labels = [];
    for (const l of list || []) {
      const el = document.createElement("div");
      el.className = "lbl " + (l.cls || ""); el.innerHTML = l.html;
      labelsEl.appendChild(el);
      labels.push(Object.assign({ el }, l));
      setTimeout(() => el.classList.add("on"), (l.delay || 0) + 200);
    }
  }
  function placeLabels() {
    const a = freeRect(), placed = [];
    for (const l of labels) {
      let x, y;
      if (l.ch != null) { x = scr[3 * l.ch]; y = scr[3 * l.ch + 1]; }
      else { P(l.x, l.y, l.z != null ? l.z : groundAt(l.x, l.y)); x = pt[0]; y = pt[1]; }
      const off = x < a.x0 - 40 || x > a.x1 + 60 || y < a.y0 - 10 || y > a.y1 + 40;
      l.el.style.visibility = off ? "hidden" : "visible";
      if (!l.w) { l.w = l.el.offsetWidth; l.h = l.el.offsetHeight; }
      let top = y + (l.dy || 0) - 12 - l.h;
      for (let pass = 0; pass < 4; pass++) {
        const hit = placed.find((r) => Math.abs(r.x - x) < (r.w + l.w) / 2 + 4 && top < r.top + r.h + 3 && top + l.h > r.top - 3);
        if (!hit) break; top = hit.top - l.h - 4;
      }
      placed.push({ x, w: l.w, h: l.h, top });
      y = top + 12 + l.h - (l.dy || 0);
      l.el.style.transform = `translate(${(x + (l.dx || 0)).toFixed(1)}px, ${(y + (l.dy || 0)).toFixed(1)}px) translate(-50%, -100%)`;
    }
  }

  function furniture() {
    // scale bar: 500 m or 200 m at the target, top view only
    const sc = $("scale"), f = $("furniture");
    const tilt = cam.pitch > 0.12;
    f.style.opacity = tilt ? 0.0 : 1;
    const m = cam.zoom > 0.6 ? 100 : cam.zoom > 0.25 ? 250 : 500;
    sc.querySelector("i").style.width = (m * cam.zoom).toFixed(0) + "px";
    sc.querySelector("span").textContent = m + " m";
    $("north").querySelector("svg").style.transform = `rotate(${(-cam.bearing * 180 / Math.PI).toFixed(1)}deg)`;
  }

  // ------------------------------------------------------------------ panel
  const tok = (s) => String(s).replace(/\{\{(\w+)\}\}/g, (m, k) => (k in FACTS ? fmt(FACTS[k]) : "??" + k));
  const fmt = (v) => (typeof v === "number" ? (Number.isInteger(v) ? v.toLocaleString("en-AU") : String(v)) : v);
  function countUp(el) {
    const raw = el.textContent, m = raw.match(/^([^\d]*)([\d,]+(?:\.\d+)?)(.*)$/);
    if (!m || reduced) return;
    const target = parseFloat(m[2].replace(/,/g, "")), dec = (m[2].split(".")[1] || "").length, t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / 1100), v = target * (1 - Math.pow(1 - t, 3));
      el.textContent = m[1] + (dec ? v.toFixed(dec) : Math.round(v).toLocaleString("en-AU")) + m[3];
      if (t < 1) requestAnimationFrame(step);
    };
    el.textContent = m[1] + "0" + m[3]; requestAnimationFrame(step);
  }

  function legendHtml(key) {
    const L1 = {
      plan1: `<span class="key"><i style="background:var(--canvas-ink)"></i>Recommended sensor</span><span class="key"><i style="background:var(--canvas-white);border:1.5px solid var(--ink-muted)"></i>Manhole in the model</span>`,
      plan: `<span class="key"><i style="background:var(--canvas-ink)"></i>Sensor, phase 1</span><span class="key"><i class="ring"></i>Phase 2</span>`,
      age: `<div class="ramp">1896<i style="background:linear-gradient(90deg,var(--canvas-ink),var(--teal),var(--age-2),var(--age-3))"></i>2010</div><span class="key"><i style="background:var(--canvas-home);border-radius:2px"></i>Connected property</span>`,
      flow: `<span class="key"><i class="line" style="background:var(--water)"></i>Sewage, moving downhill</span><span class="key"><i style="background:var(--canvas-white);border:1.5px solid var(--ink-muted)"></i>Manhole in the model</span>`,
      pumps: `<span class="key"><i class="line" style="background:var(--water)"></i>Sewage, moving downhill</span><span class="key"><i style="background:var(--canvas-ink);border-radius:1px;transform:rotate(45deg) scale(.85)"></i>Pump station</span><span class="key"><i class="line" style="background:repeating-linear-gradient(90deg,var(--water) 0 4px,transparent 4px 7px)"></i>Rising main, pumped uphill</span><span class="key"><i style="background:var(--canvas-white);border:1.5px dashed var(--canvas-ink);border-radius:1px;transform:rotate(45deg) scale(.85)"></i>Not modelled</span>`,
      resp: `<div class="ramp">2 mm<i style="background:linear-gradient(90deg,var(--rise-0),var(--rise-1),var(--rust),var(--rise-3))"></i>80 mm rise</div><span class="key"><i style="background:var(--amber)"></i>New homes connect here</span><span class="key"><i style="background:var(--rise-1);border:1.5px solid var(--canvas-ink)"></i>Rises 25 mm or more</span>`,
      stress: `<b>How full each pipe runs</b>${["Under 25%", "25–50%", "50–75%", "75–100%", "Over 100% (surcharged)"].map((label, i) => `<span class="key"><i class="line" style="background:${["var(--canvas-faint)", "color-mix(in srgb, var(--rise-0), var(--rise-1))", "var(--rise-1)", "var(--rise-2)", "var(--rise-3)"][i]}"></i>${label}</span>`).join("")}`,
      alarm: `<span class="key"><i style="background:var(--rust)"></i>Over the 150 mm alarm already</span><span class="key"><i style="background:var(--canvas-sur)"></i>Pipe running full</span>`,
      beats: `<span class="key"><i style="background:var(--canvas-ink)"></i>Our five</span><span class="key"><i style="background:var(--canvas-trunk);border-radius:2px"></i>Five with the deepest flow today</span>`,
      size: `<span class="key"><i class="line" style="background:var(--size-0)"></i>150 mm</span><span class="key"><i class="line" style="background:var(--size-1)"></i>225 mm</span><span class="key"><i class="line" style="background:var(--teal)"></i>300 mm</span><span class="key"><i class="line" style="background:var(--size-3)"></i>Larger</span>`,
      water: `<span class="key"><i class="line" style="background:var(--water)"></i>Normal water depth at each manhole (bar height)</span><span class="key"><i class="line" style="background:var(--canvas-sur)"></i>Pipe running full</span>`,
    };
    return key ? `<div class="legend">${L1[key] || ""}</div>` : "";
  }

  // charts ------------------------------------------------------------
  const pctTxt = (v) => Math.round(v * 100) + "%";
  function chartFrontier() {
    const w = 380, h = 240, l = 60, r = 12, t = 16, b = 42, K = S.curves.greedy.length;
    const X = (k) => l + (k - 1) / (K - 1) * (w - l - r), Y = (v) => t + (1 - v) * (h - t - b);
    const line = (arr) => arr.map((v, i) => (i ? "L" : "M") + X(i + 1).toFixed(1) + " " + Y(v).toFixed(1)).join(" ");
    const len = 900, k1 = FACTS.plan_k1, v1 = S.curves.greedy[k1 - 1];
    let g = "";
    for (const v of [0, 0.25, 0.5, 0.75, 1]) g += `<line class="grid" x1="${l}" x2="${w - r}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${l - 6}" y="${Y(v) + 4}" text-anchor="end">${v * 100}%</text>`;
    for (let k = 1; k <= K; k++) g += `<text x="${X(k)}" y="${h - b + 18}" text-anchor="middle">${k}</text>`;
    g += `<text x="${(l + w - r) / 2}" y="${h - 8}" text-anchor="middle">Number of sensors</text>`;
    g += `<text transform="translate(12 ${(t + h - b) / 2}) rotate(-90)" text-anchor="middle">Growth seen, worst weather case</text>`;
    g += `<path class="draw" style="--len:${len}" d="${line(S.curves.random)}" fill="none" stroke="var(--chart-random)" stroke-width="2"/>`;
    g += `<path class="draw" style="--len:${len}" d="${line(S.curves.greedy)}" fill="none" stroke="var(--canvas-ink)" stroke-width="3"/>`;
    g += `<g class="pop"><line x1="${X(k1)}" x2="${X(k1)}" y1="${Y(0)}" y2="${Y(v1)}" stroke="var(--canvas-ink)" stroke-dasharray="3 3"/>`;
    S.curves.greedy.forEach((v, i) => { g += `<circle cx="${X(i + 1)}" cy="${Y(v)}" r="${i + 1 === k1 ? 5 : 2.6}" fill="var(--canvas-ink)" stroke="var(--canvas-white)" stroke-width="1.5"/>`; });
    g += `<text class="val" x="${X(k1) + 8}" y="${Y(v1) + 16}">${pctTxt(v1)}</text>`;
    g += `<text x="${X(K) - 2}" y="${Y(S.curves.greedy[K - 1]) - 9}" text-anchor="end" style="fill:var(--canvas-ink);font-weight:600">Our plan (one at a time)</text>`;
    g += `<text x="${X(K) - 2}" y="${Y(Math.min(...S.curves.random.slice(-5))) + 15}" text-anchor="end">Random (best of 20 sets)</text></g>`;
    return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Share of growth seen in the worst weather case, by number of sensors">${g}</svg>`;
  }
  function chartAxis(l, r, y, title, w) {
    return `<line class="axis" x1="${l}" x2="${r}" y1="${y}" y2="${y}"/>` + [0, 0.5, 1].map((v) => {
      const x = l + (r - l) * v;
      return `<line class="axis" x1="${x}" x2="${x}" y1="${y}" y2="${y + 4}"/><text x="${x}" y="${y + 18}" text-anchor="middle">${pctTxt(v)}</text>`;
    }).join("") + `<text x="${w / 2}" y="${y + 43}" text-anchor="middle">${title}</text>`;
  }
  function chartBars(rows, max) {
    const w = 380, rh = 30, l = 174, t = 26, y0 = t + rows.length * rh, h = y0 + 52;
    let g = `<text x="0" y="12">Plan (five sensors each)</text>`;
    rows.forEach((row, i) => {
      const y = t + i * rh + 4, bw = (w - l - 44) * row.v / (max || 1);
      g += `<text class="lab" x="0" y="${y + 15}">${row.label}</text>`;
      g += `<rect class="bar" style="transition-delay:${0.15 + i * 0.12}s" x="${l}" y="${y + 3}" width="${Math.max(2, bw)}" height="16" rx="3" fill="${row.col}"/>`;
      g += `<text class="val pop" x="${l + Math.max(2, bw) + 6}" y="${y + 15}">${pctTxt(row.v)}</text>`;
    });
    g += chartAxis(l, w - 44, y0, "Share of detectable growth seen (worst weather case)", w);
    return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Share of detectable growth seen by each five-sensor plan">${g}</svg>`;
  }
  function chartBeats() {
    const k = FACTS.plan_k1 - 1, c = S.curves;
    return chartBars([
      { label: "Our plan", v: c.greedy[k], col: "var(--canvas-ink)" },
      { label: "Random (best of 20 sets)", v: c.random[k], col: "var(--chart-other)" },
      { label: "Deepest flow today", v: c.trunk[k], col: "var(--chart-other)" },
      { label: "Most exposed alone", v: c.exposed[k], col: "var(--chart-other)" },
    ], 1);
  }
  function chartHoldout() {
    const k = FACTS.plan_k1, w = 380, rh = 40, l = 118, t = 26;
    let g = `<text x="0" y="12">Weather case left out</text>`;
    S.held_out.forEach((row, i) => {
      const y = t + i * rh + 2, a = row["seen_k" + k], b = row["unseen_k" + k], sc = (w - l - 44);
      const name = CASE_SHORT[i];
      g += `<text class="lab" x="0" y="${y + 17}">${name}</text>`;
      g += `<rect class="bar" style="transition-delay:${0.1 + i * 0.1}s" x="${l}" y="${y + 4}" width="${sc * a}" height="12" rx="2" fill="var(--canvas-ink)"/>`;
      g += `<text class="val pop" x="${l + sc * a + 5}" y="${y + 14}">${pctTxt(a)}</text>`;
      g += `<rect class="bar" style="transition-delay:${0.2 + i * 0.1}s" x="${l}" y="${y + 19}" width="${Math.max(2, sc * b)}" height="12" rx="2" fill="${b < a - 0.05 ? "var(--rust)" : "var(--chart-other)"}"/>`;
      g += `<text class="val pop" x="${l + Math.max(2, sc * b) + 5}" y="${y + 29}" style="fill:${b < a - 0.05 ? "var(--rust)" : "var(--ink-muted)"}">${pctTxt(b)}</text>`;
    });
    const y0 = t + S.held_out.length * rh, h = y0 + 52;
    g += chartAxis(l, w - 44, y0, "Share of that case’s detectable growth seen (five sensors)", w);
    return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Share of detectable growth seen for each weather case left out">${g}</svg>
      <div class="legend"><span class="key"><i style="background:var(--canvas-ink);border-radius:2px"></i>Planned with this case</span><span class="key"><i style="background:var(--rust);border-radius:2px"></i>Planned without it (grey: no change)</span></div>`;
  }
  function gaugeHtml() {
    return `<div class="gauge"><svg viewBox="0 0 120 170" aria-hidden="true">
      <rect x="30" y="4" width="60" height="150" rx="3" fill="var(--canvas-paper)" stroke="var(--chart-greedy)" stroke-width="2"/>
      <rect x="4" y="132" width="112" height="24" rx="12" fill="var(--canvas-white)" stroke="var(--chart-greedy)" stroke-width="2"/>
      <rect id="gW" x="31" y="156" width="58" height="0" fill="var(--water)" opacity=".85"/>
      <g id="gAx"></g>
      <line id="gN" x1="22" x2="98" y1="0" y2="0" stroke="var(--ink-muted)" stroke-width="1.6"/>
      <line id="gR" x1="22" x2="98" y1="0" y2="0" stroke="var(--canvas-ink)" stroke-width="1.6" stroke-dasharray="4 3"/>
      <line id="gA" x1="22" x2="98" y1="0" y2="0" stroke="var(--rust)" stroke-width="1.6" stroke-dasharray="4 3"/>
      <text id="gNt" x="100" y="0" font-size="9" fill="var(--ink-muted)" font-weight="700"></text>
      <text id="gRt" x="100" y="0" font-size="9" fill="var(--canvas-ink)" font-weight="700">+${FACTS.rise_focus_mm}</text>
      <text id="gAt" x="100" y="0" font-size="9" fill="var(--rust)" font-weight="700">${FACTS.alarm_mm}</text>
      <rect x="36" y="2" width="48" height="5" rx="2" fill="var(--ink-muted)"/></svg>
      <div><div class="read" id="gRead"></div><div class="gkey" id="gKey"></div></div></div>`;
  }

  // One shared source/info card, outside the scrolling slide.
  const sourceCard = document.createElement("div");
  sourceCard.id = "source-card"; sourceCard.className = "source-card"; sourceCard.hidden = true;
  sourceCard.setAttribute("role", "region"); sourceCard.setAttribute("aria-label", "Sources and chart information");
  document.body.appendChild(sourceCard);
  const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // `at` is a verbatim line on that page; the viewer scrolls to it and marks it in blue.
  const libraryLink = (doc, page, at) => `<a href="${esc(LIB.base + "pdf-viewer.html?paper=" + encodeURIComponent(doc.id) + "&pdf=" + encodeURIComponent(doc.pdf) + "&title=" + encodeURIComponent(doc.title) + "&page=" + page + (at ? "&q=" + encodeURIComponent(at.replace(/^…\s*/, "").slice(0, 160)) : ""))}" target="_blank" rel="noopener">Open p. ${esc(page)} at this line</a>`;
  const teamHtml = (team) => team ? `<section><h3>Team review, p. ${esc(team.page)}</h3><blockquote>“${esc(team.quote)}”</blockquote>${libraryLink(LIB.docs.team, team.page, team.quote)}</section>` : "";
  let sourceAnchor = null, sourceTimer = 0, sourcePress = null;
  function closeSource() {
    clearTimeout(sourceTimer);
    if (sourceAnchor) sourceAnchor.setAttribute("aria-expanded", "false");
    sourceCard.hidden = true; sourceAnchor = null;
  }
  function placeSource() {
    if (!sourceAnchor) return;
    const a = sourceAnchor.getBoundingClientRect(), w = window.innerWidth, h = window.innerHeight, gap = 8;
    sourceCard.style.maxHeight = Math.max(0, h - gap * 2) + "px";
    let r = sourceCard.getBoundingClientRect(), x, y;
    if (a.right + gap + r.width <= w - gap) { x = a.right + gap; y = a.top; }
    else if (a.left - gap - r.width >= gap) { x = a.left - gap - r.width; y = a.top; }
    else {
      const below = h - a.bottom - gap * 2, above = a.top - gap * 2;
      sourceCard.style.maxHeight = Math.max(0, below >= above ? below : above) + "px";
      r = sourceCard.getBoundingClientRect(); x = a.left;
      y = below >= above ? a.bottom + gap : a.top - r.height - gap;
    }
    sourceCard.style.left = Math.max(gap, Math.min(w - r.width - gap, x)) + "px";
    sourceCard.style.top = Math.max(gap, Math.min(h - r.height - gap, y)) + "px";
  }
  function showSource(el) {
    clearTimeout(sourceTimer);
    let h = "";
    if (el.dataset.info) {
      const info = LIB.info[el.dataset.info]; if (!info) return;
      h = `<h3>${esc(info.title)}</h3>${info.html}${teamHtml(info.team)}`;
    } else {
      const src = LIB.src[el.dataset.src]; if (!src) return;
      if (el.matches("span.chip")) {
        const text = el.textContent.trim(), k = el.classList.contains("confirm") ? "confirm" : Object.hasOwn(LIB.tags, text) ? text : [...el.classList].find((c) => c !== "chip" && Object.hasOwn(LIB.tags, c));
        if (LIB.tags[k]) h += `<p class="source-tag">${esc(LIB.tags[k])}</p>`;
      }
      h += (src.lib || []).map((item) => {
        const doc = LIB.docs[item.doc];
        return `<section><h3>${esc(doc.title)}</h3><p>${esc(item.says)}</p>${libraryLink(doc, item.page, item.at)}</section>`;
      }).join("");
      h += (src.web || []).map(({ title, url, says }) =>
        `<section><h3>${esc(title)}</h3><p>${esc(says)}</p><a href="${esc(url)}" target="_blank" rel="noopener">Open the source</a></section>`
      ).join("") + teamHtml(src.team);
      if (src.gap) h += `<p class="source-gap">${esc(src.gap)}</p>`;
    }
    if (sourceAnchor && sourceAnchor !== el) sourceAnchor.setAttribute("aria-expanded", "false");
    sourceAnchor = el; el.setAttribute("aria-expanded", "true");
    sourceCard.innerHTML = h; sourceCard.hidden = false; sourceCard.scrollTop = 0; placeSource();
  }
  function leaveSource() {
    clearTimeout(sourceTimer);
    sourceTimer = setTimeout(() => {
      if (sourceAnchor && !sourceAnchor.matches(":hover") && !sourceCard.matches(":hover") && !sourceCard.contains(document.activeElement)) closeSource();
    }, 200);
  }
  sourceCard.addEventListener("pointerenter", () => clearTimeout(sourceTimer));
  sourceCard.addEventListener("pointerleave", leaveSource);
  sourceCard.addEventListener("focusin", () => clearTimeout(sourceTimer));
  sourceCard.addEventListener("focusout", leaveSource);
  document.addEventListener("click", (e) => { if (sourceAnchor && !sourceAnchor.contains(e.target) && !sourceCard.contains(e.target)) closeSource(); });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !sourceAnchor) return;
    e.preventDefault();
    if (sourceCard.contains(document.activeElement)) sourceAnchor.focus();
    closeSource();
  });
  window.addEventListener("resize", placeSource);
  document.addEventListener("scroll", placeSource, true);
  function wireSources(sc) {
    if (!LIB) return;
    const selectors = { chart: "svg.chart", params: ".params", steps: ".steps", vs: ".vs", stats: ".stats", seg: ".seg", gauge: ".gauge" };
    Object.entries(sc.info || {}).forEach(([type, key]) => {
      const el = selectors[type] && card.querySelector(selectors[type]); if (!el) return;
      const host = document.createElement("div"), b = document.createElement("button");
      host.className = "info-host" + (type === "chart" ? " info-chart" : "");
      el.replaceWith(host); host.appendChild(el);
      b.type = "button"; b.className = "info-button"; b.textContent = "i"; b.dataset.info = key;
      b.setAttribute("aria-label", "About this chart/table"); host.appendChild(b);
    });
    card.querySelectorAll("span.chip[data-src], span.cite[data-src], .info-button").forEach((el) => {
      el.tabIndex = 0; el.setAttribute("role", "button");
      el.setAttribute("aria-controls", sourceCard.id); el.setAttribute("aria-expanded", "false");
      el.addEventListener("pointerenter", (e) => { if (e.pointerType !== "touch") showSource(el); });
      el.addEventListener("pointerleave", leaveSource);
      el.addEventListener("focus", () => showSource(el)); el.addEventListener("blur", leaveSource);
      el.addEventListener("pointerdown", () => { sourcePress = { el, open: sourceAnchor === el }; });
      el.addEventListener("click", () => {
        const open = sourcePress && sourcePress.el === el ? sourcePress.open : sourceAnchor === el;
        sourcePress = null; if (open) closeSource(); else showSource(el);
      });
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault(); sourcePress = null;
          if (sourceAnchor === el) closeSource(); else showSource(el);
        } else if (e.key === "Tab" && !e.shiftKey && sourceAnchor === el) {
          const link = sourceCard.querySelector("a"); if (link) { e.preventDefault(); link.focus(); }
        }
      });
    });
  }

  function renderCard(sc, i) {
    closeSource();
    if (sc.welcome) {
      card.innerHTML = tok(sc.html);
      wireSources(sc);
      card.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => enter(i + 1)));
      return;
    }
    const act = sc.act && !sc.noAct ? `<span class="act">${sc.act}</span><span>·</span>` : "";
    let h = `<div class="kicker">${act}<span>${tok(sc.kicker || "")}</span></div><h1>${tok(sc.title)}</h1>`;
    if (sc.stats) h += `<div class="stats">${sc.stats.map((s) => `<div class="stat ${s[2] || ""}"><b>${tok(s[0])}</b><span>${tok(s[1])}</span></div>`).join("")}</div>`;
    if (sc.html) h += `<div>${tok(sc.html)}</div>`;
    if (sc.chart === "frontier") h += chartFrontier();
    if (sc.chart === "beats") h += chartBeats();
    if (sc.chart === "holdout") h += chartHoldout();
    if (sc.gauge) h += gaugeHtml();
    if (sc.seg) h += `<div class="seg" role="group" aria-label="Weather case">${sc.seg.map((c) => `<button type="button" data-case="${c}">${CASE_SHORT[c]}</button>`).join("")}</div>`;
    if (sc.readout) h += `<div class="readout" id="readout"></div>`;
    if (sc.after) h += `<div>${tok(sc.after)}</div>`;
    if (sc.legend) h += legendHtml(sc.legend);
    card.innerHTML = h;
    wireSources(sc);
    card.scrollTop = 0;
    card.querySelectorAll(".stat b").forEach(countUp);
  }

  // ------------------------------------------------------------------ scene runtime
  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const every = (fn, ms) => timers.push(setInterval(fn, ms));
  function clearTimers() { while (timers.length) { const t = timers.pop(); clearTimeout(t); clearInterval(t); } }

  function setStyle(s) { if (s === fx.style) return; fx.prevStyle = fx.style; fx.style = s; fx.styleMix = 0; }
  function respond(site, c, opts) { fx.resp = Object.assign({ site, c, t0: performance.now() }, opts || {}); }
  function rolesOf() {
    return S.plan.roles.map((r, k) => ({ ch: phase1[k], cls: "accent", delay: 250 * k,
      html: `${k + 1} · ${ROLE[r.case][0]}<small>sees ${r.share}% of ${ROLE[r.case][1]} growth on its own</small>` }));
  }
  // sites whose growth shows widely, spread over the map, for the what-if loop
  function exampleSites(c, n) {
    const resp = S.response[String(c)];
    const ranked = resp.map((l, i) => [i, l.filter((t) => t[1] >= FACTS.rise_focus_mm).length]).filter((t) => t[1] >= 3).sort((a, b) => b[1] - a[1]);
    const out = [];
    for (const [i] of ranked) {
      if (out.every((j) => Math.hypot(CH[i].x - CH[j].x, CH[i].y - CH[j].y) > 700)) out.push(i);
      if (out.length >= n) break;
    }
    return out;
  }
  function seenBy(site, c, set) {
    const l = S.response[String(c)][site] || [];
    const hit = l.filter(([i, mm]) => mm >= FACTS.rise_focus_mm && set.includes(i)).sort((a, b) => b[1] - a[1]);
    return { list: l, hit };
  }
  function describe(site, c) {
    const { list, hit } = seenBy(site, c, phase1);
    const n25 = list.filter((t) => t[1] >= FACTS.rise_focus_mm).length;
    const top = list[0];
    let s = `<b>${S.focus_size} new homes at manhole ${CH[site].id}</b> (${CASE_SHORT[c].toLowerCase()}, ${caseRate(c)}): `;
    if (!n25) return s + `no manhole rises ${FACTS.rise_focus_mm} mm${top ? `; the largest rise is ${top[1]} mm` : ""}. Growth this small here is not detectable by any sensor, so it does not count against the plan.`;
    s += `${n25} manhole${n25 > 1 ? "s" : ""} rise ${FACTS.rise_focus_mm} mm or more. `;
    if (hit.length) s += `<b class="hit">Seen by sensor ${phase1.indexOf(hit[0][0]) + 1}</b> (+${hit[0][1]} mm).`;
    else s += `<b class="miss">Not seen by the first five</b>${(() => { const h2 = seenBy(site, c, phase2).hit; return h2.length ? `; sensor ${phase2.indexOf(h2[0][0]) + 6} in phase 2 sees it (+${h2[0][1]} mm).` : "."; })()}`;
    return s;
  }

  const V = {}; // named views, resolved at scene entry so they follow the window size
  V.all = () => fit(ALL, { pad: 0.06 });
  // the welcome page's own view of Greater Adelaide (index.html VIEWS.adelaide), centred on the screen
  V.region = () => { const q = local(138.578, -34.922), zoom = 512 * Math.pow(2, 12.15) / GEO.Sm;
    return { x: q[0], y: q[1], z: zMid, zoom, pitch: 0, bearing: 0, ve: 0, D: 1.5 * H / zoom, sx: W / 2, sy: H / 2 }; };
  V.plan = () => fit(boxOf(phase1.concat(phase2), 350), { pad: 0.1 });
  V.p1 = () => fit(boxOf(phase1, 420), { pad: 0.12 });
  V.beats = () => fit(boxOf(phase1.concat(trunk), 380), { pad: 0.1 });
  V.tilt = () => fit(ALL, { pitch: 54, bearing: -AX + 14, ve: 9, z: zMid, pad: 0.04 });
  V.tilt2 = () => fit(ALL, { pitch: 50, bearing: -AX - 10, ve: 9, z: zMid, pad: 0.04 });
  V.side = () => {
    const ids = new Set(); path.forEach((i) => { ids.add(pipes[i].a); ids.add(pipes[i].b); });
    const b = boxOf([...ids], 120, true);
    const a = pipes[path[0]], z = pipes[path[path.length - 1]];
    const ang = Math.atan2(N.y[z.b] - N.y[a.a], N.x[z.b] - N.x[a.a]);
    return fit(b, { pitch: 74, bearing: ang * 180 / Math.PI - 90 + 180 + 8, ve: 14, z: (b.z0 + b.z1) / 2, pad: 0.06, persp: 4 });
  };
  V.phase1 = (k) => phase1[k];
  V.close = (i, r, o) => fit(around(i, r), Object.assign({ pitch: 58, bearing: -32, ve: 9, z: CH[i].cover - 2, pad: 0.04, persp: 2.2 }, o || {}));

  let cur = -1, sceneT0 = 0;
  const SCN = {
    welcome() { fx.reveal = 0; },
    title() {
      // the network draws itself from the outlet uphill while the camera lands
      fx.reveal = 0; fx.revealT0 = performance.now() + (cur > 0 && SCENES[cur - 1].welcome ? 1500 : 0);
      setLabels([{ x: N.x[S.outlet], y: N.y[S.outlet], html: "Where Walkerville's network ends", cls: "quiet", delay: 2600 }]);
    },
    brief() {
      // every manhole is a candidate site: pop them all, label the one nearest the middle
      fx.chamberPop = performance.now();
      let cx = 0, cy = 0; CH.forEach((c) => { cx += N.x[c.n]; cy += N.y[c.n]; }); cx /= CH.length; cy /= CH.length;
      const d2 = (c) => (N.x[c.n] - cx) ** 2 + (N.y[c.n] - cy) ** 2;
      const mid = CH.reduce((b, c) => (d2(c) < d2(b) ? c : b), CH[0]);
      setLabels([{ x: N.x[mid.n], y: N.y[mid.n], html: fmt(FACTS.sites) + " manholes, each a possible sensor site", cls: "quiet", delay: 900 }]);
    },
    answer() { fx.sensorT0 = performance.now(); setLabels(rolesOf().map((l) => Object.assign(l, { html: "Sensor " + (phase1.indexOf(l.ch) + 1), cls: "accent quiet" }))); },
    roles() { setLabels(rolesOf()); },
    infill() { setStyle("age"); },
    downhill() { setLabels([{ x: N.x[S.outlet], y: N.y[S.outlet], html: "Lowest point: the network drains here", cls: "accent" }]); },
    swmm() { fx.chamberPop = performance.now(); },
    whatif() {
      const sites = exampleSites(1, 5); let k = 0;
      const show = () => {
        const s = sites[k++ % sites.length]; respond(s, 1);
        setLabels([{ ch: s, html: `+${S.focus_size} homes`, cls: "growth", dy: -10 }]);
        const ro = $("readout"); if (ro) ro.innerHTML = describe(s, 1);
      };
      show(); every(show, 3600);
    },
    cases() {
      let k = 0; const order = [0, 1, 2, 3, 4];
      const show = (c) => {
        fx.alarmCase = c;
        card.querySelectorAll(".seg button").forEach((b) => b.classList.toggle("on", +b.dataset.case === c));
        const ro = $("readout");
        const b = S.base_alarm[String(c)].length, s = S.base_surcharged[String(c)].length;
        if (ro) ro.innerHTML = `<span class="casepill">${CASE_SHORT[c]}</span> ${caseRate(c)}. ${CASE_NOTE[c]}<br><b>${b}</b> manholes over the ${FACTS.alarm_mm} mm alarm and <b>${s}</b> pipes running full, before any new home connects.`;
      };
      show(0);
      every(() => show(order[++k % order.length]), 2600);
      card.querySelectorAll(".seg button").forEach((b) => b.addEventListener("click", () => { clearTimers(); show(+b.dataset.case); }));
    },
    stress() {
      const show = (c) => {
        stressCase = c; updateStressColours();
        card.querySelectorAll(".seg button").forEach((b) => b.classList.toggle("on", +b.dataset.case === c));
        $("readout").innerHTML = `<span class="casepill">${CASE_SHORT[c]}</span> ${caseRate(c)}`;
      };
      show(1);
      card.querySelectorAll(".seg button").forEach((b) => b.addEventListener("click", () => show(+b.dataset.case)));
    },
    beats() { setLabels([{ ch: trunk[0], html: "Deepest flow today", cls: "quiet", dy: -6 }, { ch: phase1[0], html: "Our plan", cls: "accent", dy: -8 }]); },
    tryit() {
      let c = 1, user = false;
      const pick = (s) => { respond(s, c); setLabels([{ ch: s, html: `+${S.focus_size} homes`, cls: "growth", dy: -10 }]); const ro = $("readout"); if (ro) ro.innerHTML = describe(s, c); };
      const setCase = (v) => { c = v; card.querySelectorAll(".seg button").forEach((b) => b.classList.toggle("on", +b.dataset.case === c)); if (fx.resp) pick(fx.resp.site); };
      card.querySelectorAll(".seg button").forEach((b) => b.addEventListener("click", () => { user = true; setCase(+b.dataset.case); }));
      setCase(1);
      const demo = exampleSites(1, 6); let k = 0;
      pick(demo[0]);
      every(() => { if (!user) pick(demo[++k % demo.length]); }, 3800);
      fx.onPick = (s) => { user = true; pick(s); };
    },
    below() { fx.drift = 1; },
    fall() {
      setStyle("path");
      const a = pipes[path[0]], z = pipes[path[path.length - 1]];
      setLabels([
        { x: N.x[a.a], y: N.y[a.a], z: N.inv[a.a], html: `Pipe floor ${N.inv[a.a].toFixed(1)} m`, cls: "quiet", dy: -6 },
        { x: N.x[z.b], y: N.y[z.b], z: N.inv[z.b], html: `${N.inv[z.b].toFixed(1)} m above sea level`, cls: "accent", dy: -6 },
        ...pumps.map((s, k) => ({ x: N.x[s.wet], y: N.y[s.wet], z: cover[s.wet], html: s.modelled ? "Pump station" : "Pump station<small>not modelled</small>",
          cls: "quiet", dy: -10, delay: 600 + k * 250 })),
      ]);
    },
    pipes() {
      setStyle("size"); fx.widthTarget = 2.2;
      const c = CH[phase1[2]];
      const pick = pipes.map((p, i) => [i, Math.hypot(p.xs[Math.floor(p.n / 2)] - c.x, p.ys[Math.floor(p.n / 2)] - c.y)]).sort((a, b) => a[1] - b[1]).slice(0, 30);
      const seen = new Set(), list = [];
      for (const [i] of pick) {
        const p = pipes[i], key = p.d + "-" + p.m; if (seen.has(key) || list.length >= 3 || p.len < 40) continue; seen.add(key);
        const v = Math.floor(p.n / 2);
        list.push({ x: p.xs[v], y: p.ys[v], z: p.zs[v], html: `${p.d} mm ${["clay", "uPVC", "concrete"][p.m] || ""}<small>laid ${p.y}</small>`, cls: "quiet", delay: list.length * 250 });
      }
      setLabels(list);
    },
    load() {
      const c = CH[phase1[1]];
      const hs = homes.map((h, i) => [i, Math.hypot(h[0] - c.x, h[1] - c.y)]).filter((t) => t[1] < 260).slice(0, 80);
      fx.laterals = hs.map(([i]) => {
        const h = homes[i]; let best = null;
        for (const p of pipes) for (let v = 0; v < p.n; v++) {
          const d = Math.hypot(p.xs[v] - h[0], p.ys[v] - h[1]); if (!best || d < best.d) best = { d, x: p.xs[v], y: p.ys[v], z: p.zs[v] };
        }
        return { h: i, x: best.x, y: best.y, z: best.z, o: Math.random(), isNew: false };
      });
      fx.laterals.filter((_, k) => k % 11 === 0).forEach((l) => { l.isNew = true; });
      const first = fx.laterals.find((l) => l.isNew);
      setLabels(first ? [{ x: homes[first.h][0], y: homes[first.h][1], z: homes[first.h][2], html: `New home: about ${FACTS.dwelling_peak_l_per_day} L a day<small>at the peak rate</small>`, cls: "growth", dy: -8 }] : []);
    },
    rain() {
      const order = [0, 1, 2]; let k = 0;
      const show = (c) => {
        fx.waterCase = c; L.rain = 0; LT.rain = c === 2 ? 1 : c === 1 ? 0.45 : 0;
        card.querySelectorAll(".seg button").forEach((b) => b.classList.toggle("on", +b.dataset.case === c));
        const ro = $("readout");
        if (ro) ro.innerHTML = `<span class="casepill">${CASE_SHORT[c]}</span> ${caseRate(c)}. ${CASE_NOTE[c]} <b>${S.base_surcharged[String(c)].length}</b> pipes running full before any growth.`;
      };
      show(0); every(() => show(order[++k % order.length]), 3200);
      card.querySelectorAll(".seg button").forEach((b) => b.addEventListener("click", () => { clearTimers(); show(+b.dataset.case); }));
    },
    sees() {
      // the wet-weather sensor and the growth site that raises it most while it stays under the alarm
      const resp = S.response["1"];
      let sIdx = phase1[S.plan.roles.findIndex((r) => r.case === "Design wet")] ?? phase1[0], best = null;
      const base = S.base_depth["1"][sIdx], normal = base * 1000;
      resp.forEach((l, site) => l.forEach(([i, mm]) => { if (i === sIdx && mm >= FACTS.rise_focus_mm && normal + mm < FACTS.alarm_mm && (!best || mm > best.mm)) best = { site, mm }; }));
      if (!best) resp.forEach((l, site) => l.forEach(([i, mm]) => { if (i === sIdx && (!best || mm > best.mm)) best = { site, mm }; }));
      flyTo(fit(boxOf([sIdx, best.site], 260), { pitch: 60, bearing: -38, ve: 9, z: CH[sIdx].cover - 2, pad: 0.12, persp: 2.4 }), 1800);
      respond(best.site, 1);
      setLabels([{ ch: best.site, html: `+${S.focus_size} homes`, cls: "growth", dy: -10 }, { ch: sIdx, html: `Sensor ${phase1.indexOf(sIdx) + 1}`, cls: "accent", dy: -12 }]);
      const rise = best.mm, alarm = FACTS.alarm_mm, thr = FACTS.rise_focus_mm;
      const maxMM = Math.max(220, Math.ceil((normal + rise + 60) / 50) * 50);
      const yOf = (mm) => 154 - mm * 150 / maxMM;
      const gN = $("gN"), gR = $("gR"), gA = $("gA"), gW = $("gW");
      const set = (el, mm) => { el.setAttribute("y1", yOf(mm)); el.setAttribute("y2", yOf(mm)); };
      set(gN, normal); set(gR, normal + thr); set(gA, alarm);
      $("gNt").setAttribute("y", yOf(normal) + 3); $("gRt").setAttribute("y", yOf(normal + thr) + 3); $("gAt").setAttribute("y", yOf(alarm) + 3);
      $("gNt").textContent = Math.round(normal); $("gRt").textContent = Math.round(normal + thr); $("gAt").textContent = alarm;
      const gAx = $("gAx"), step = maxMM <= 250 ? 50 : 100;
      gAx.innerHTML = "";
      for (let t = 0; t <= maxMM; t += step) {
        const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
        tick.setAttribute("x1", 25); tick.setAttribute("x2", 30);
        tick.setAttribute("y1", yOf(t)); tick.setAttribute("y2", yOf(t));
        tick.setAttribute("stroke", "var(--ink-muted)"); tick.setAttribute("stroke-width", 1);
        gAx.appendChild(tick);
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("text-anchor", "end"); label.setAttribute("x", 23); label.setAttribute("y", yOf(t) + 3);
        label.setAttribute("font-size", 8); label.setAttribute("fill", "var(--ink-muted)"); label.textContent = t;
        gAx.appendChild(label);
      }
      const unit = document.createElementNS("http://www.w3.org/2000/svg", "text");
      unit.setAttribute("text-anchor", "end"); unit.setAttribute("x", 23); unit.setAttribute("y", 167);
      unit.setAttribute("font-size", 8); unit.setAttribute("fill", "var(--ink-muted)"); unit.textContent = "mm";
      gAx.appendChild(unit);
      $("gKey").innerHTML = `<span class="k"><i class="n"></i>Normal level, ${Math.round(normal)} mm</span>
        <span class="k"><i class="r"></i>Rise rule: normal + ${thr} mm = ${Math.round(normal + thr)} mm</span>
        <span class="k"><i class="a"></i>Float-switch alarm, ${alarm} mm</span>`;
      const read = $("gRead"), name = "sensor " + (phase1.indexOf(sIdx) + 1);
      const verdict = normal >= alarm
        ? `Already over the ${alarm} mm alarm before any growth, so a fixed alarm can never report it. Against its own normal level the rise is clear.`
        : normal + rise < alarm ? `Stays under the ${alarm} mm alarm, so a fixed alarm misses it. The rise rule sees it.`
          : `Crosses the ${alarm} mm alarm as well.`;
      const anim = (from, to, ms) => {
        const t0 = performance.now();
        const st = (now) => {
          const t = Math.min(1, (now - t0) / ms), v = from + (to - from) * ease(t), up = v - normal;
          gW.setAttribute("y", yOf(v)); gW.setAttribute("height", Math.max(0, 154 - yOf(v)));
          read.innerHTML = `<b class="${up >= thr ? "hit" : ""}">+${Math.round(up)} mm</b>rise at ${name} (normal ${Math.round(normal)} mm, now ${Math.round(v)} mm)` +
            (t >= 1 ? `<br>${verdict}` : "");
          if (t < 1) requestAnimationFrame(st);
        };
        requestAnimationFrame(st);
      };
      const cycle = () => { anim(normal, normal, 10); later(() => { respond(best.site, 1); anim(normal, normal + rise, 1600); }, 900); };
      cycle(); every(cycle, 6200);
    },
    register() { setLabels([]); },
    close() { fx.sensorT0 = performance.now(); setLabels(rolesOf().map((l) => Object.assign(l, { html: "Sensor " + (phase1.indexOf(l.ch) + 1), cls: "accent quiet" }))); },
  };

  function enter(i, instant) {
    i = Math.max(0, Math.min(SCENES.length - 1, i));
    if (i === cur && !instant) return;
    closeSource();
    clearTimers(); fx.onPick = null; fx.laterals = null; fx.chamberPop = 0; fx.drift = 0; fx.widthTarget = 1; fx.reveal = 1;
    document.body.classList.toggle("is-welcome", !!SCENES[i].welcome);
    fx.resp = null; fx.hover = -1;
    const sc = SCENES[i], prev = cur; cur = i; sceneT0 = performance.now();
    card.classList.remove("in"); card.classList.add("out");
    const swap = () => {
      renderCard(sc, i);
      card.classList.remove("out"); void card.offsetWidth; card.classList.add("in");
      setStyle(sc.style || "plain");
      setLayers(sc.show);
      setLabels([]);
      const view = typeof sc.view === "function" ? sc.view(V) : (V[sc.view || "all"] || V.all)();
      flyTo(view, instant ? 0 : sc.ms || 1700);
      if (sc.fx && SCN[sc.fx]) SCN[sc.fx]();
      updateBar();
      try { history.replaceState(null, "", "#" + sc.id); } catch (e) { /* file:// in some browsers */ }
    };
    if (prev < 0 || instant || reduced) swap(); else setTimeout(swap, 230);
  }

  // ------------------------------------------------------------------ bar and navigation
  const acts = [];
  const lead = SCENES[0] && SCENES[0].welcome ? 1 : 0;   // the welcome page is not a numbered step
  SCENES.forEach((s, i) => { if (s.welcome) return; if (!acts.length || acts[acts.length - 1].name !== s.act) acts.push({ name: s.act, first: i, n: 0 }); acts[acts.length - 1].n++; });
  $("acts").innerHTML = acts.map((a, k) => `<button class="act-seg" type="button" style="--n:${a.n}" data-k="${k}" aria-label="${a.name}"><span>${a.name}</span><i></i></button>`).join("");
  $("acts").querySelectorAll(".act-seg").forEach((b) => b.addEventListener("click", () => enter(acts[+b.dataset.k].first)));
  function updateBar() {
    $("count").textContent = String(Math.max(1, cur + 1 - lead)).padStart(2, "0") + " / " + (SCENES.length - lead);
    const act = acts.find((a) => cur >= a.first && cur < a.first + a.n); $("actname").textContent = act ? act.name : "";
    $("prev").disabled = cur === 0; $("next").disabled = cur === SCENES.length - 1;
    $("acts").querySelectorAll(".act-seg").forEach((b, k) => {
      const a = acts[k], done = Math.max(0, Math.min(a.n, cur - a.first + 1));
      b.querySelector("i").style.width = (100 * done / a.n) + "%";
      b.classList.toggle("cur", cur >= a.first && cur < a.first + a.n);
    });
  }
  const themeButton = $("theme-toggle");
  function updateThemeButton() {
    const dark = document.documentElement.dataset.theme === "dark";
    themeButton.textContent = dark ? "Light" : "Dark";
    themeButton.setAttribute("aria-pressed", String(dark));
  }
  function toggleTheme() {
    const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    if (theme === "dark") document.documentElement.dataset.theme = "dark";
    else document.documentElement.removeAttribute("data-theme");
    try { localStorage.setItem("walkerville-theme", theme); } catch (e) { /* Keep the session choice. */ }
    document.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
  }
  themeButton.addEventListener("click", toggleTheme);
  document.addEventListener("themechange", () => {
    updatePalette();
    updateThemeButton();
    if (glReady) window.applyBasemapTheme(document.documentElement.dataset.theme || "light");
    draw(performance.now());
  });
  updateThemeButton();
  document.addEventListener("keydown", (e) => {
    if (e.defaultPrevented || e.repeat || e.isComposing || e.ctrlKey || e.metaKey || e.altKey || e.key.toLowerCase() !== "t") return;
    const focused = document.activeElement;
    if (focused && (focused.isContentEditable || focused.closest("input, textarea, select, [role=textbox]"))) return;
    e.preventDefault(); toggleTheme();
  });
  $("prev").addEventListener("click", () => enter(cur - 1));
  $("next").addEventListener("click", () => enter(cur + 1));
  document.addEventListener("keydown", (e) => {
    if (e.target.closest && e.target.closest("input, select, textarea, .source-card")) return;
    const k = e.key;
    if ((k === " " || k === "Enter") && e.target.closest && e.target.closest("a, [role=button], #theme-toggle")) return;
    if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(k)) { e.preventDefault(); enter(cur + 1); }
    else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(k)) { e.preventDefault(); enter(cur - 1); }
    else if (k === "Home") enter(0);
    else if (k === "End") enter(SCENES.length - 1);
    else if (k === "f" || k === "F") { if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); else document.exitFullscreen(); }
  });
  let wheelAcc = 0, wheelLock = 0, wheelIdle = 0;
  window.addEventListener("wheel", (e) => {
    if (e.target.closest && e.target.closest(".source-card")) return;
    if (e.target.closest && e.target.closest(".card") && card.scrollHeight > card.clientHeight + 2) return;
    e.preventDefault();
    const now = performance.now();
    clearTimeout(wheelIdle); wheelIdle = setTimeout(() => { wheelAcc = 0; wheelLock = 0; }, 260);
    if (wheelLock) return;
    wheelAcc += e.deltaY + e.deltaX;
    if (Math.abs(wheelAcc) > 70) { enter(cur + (wheelAcc > 0 ? 1 : -1)); wheelAcc = 0; wheelLock = now; }
  }, { passive: false });
  let touch = null;
  window.addEventListener("touchstart", (e) => { if (e.target.closest && e.target.closest(".source-card")) { touch = null; return; } const t = e.touches[0]; touch = { x: t.clientX, y: t.clientY, t: performance.now() }; }, { passive: true });
  window.addEventListener("touchend", (e) => {
    if (!touch) return; const t = e.changedTouches[0], dx = t.clientX - touch.x, dy = t.clientY - touch.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4 && performance.now() - touch.t < 700) enter(cur + (dx < 0 ? 1 : -1));
    touch = null;
  }, { passive: true });

  // hover and pick
  function nearestChamber(mx, my, r) {
    let best = -1, bd = r * r;
    for (let i = 0; i < nch; i++) { const dx = scr[3 * i] - mx, dy = scr[3 * i + 1] - my, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = i; } }
    return best;
  }
  canvas.addEventListener("mousemove", (e) => {
    if (L.chambers < 0.3 && L.sensors < 0.3) { tip.classList.remove("on"); fx.hover = -1; return; }
    const i = nearestChamber(e.clientX, e.clientY, 12);
    fx.hover = i; canvas.style.cursor = i >= 0 && fx.onPick ? "pointer" : "default";
    if (i < 0) { tip.classList.remove("on"); return; }
    const c = CH[i], k1 = phase1.indexOf(i), k2 = phase2.indexOf(i), d = S.base_depth["1"][i];
    let h = `<b>${k1 >= 0 ? "Sensor " + (k1 + 1) + " · " : k2 >= 0 ? "Phase-2 sensor " + (k2 + 6) + " · " : ""}Manhole ${c.id}</b><br>`;
    h += `Ground ${c.cover.toFixed(1)} m · pipe floor ${c.inv.toFixed(1)} m (${(c.cover - c.inv).toFixed(1)} m deep)<br>Normal wet-weather depth ${Math.round(d * 1000)} mm`;
    if (fx.onPick) h += `<br><i>Click to connect ${S.focus_size} homes here</i>`;
    tip.innerHTML = h; tip.style.left = e.clientX + "px"; tip.style.top = e.clientY + "px"; tip.classList.add("on");
  });
  canvas.addEventListener("mouseleave", () => { tip.classList.remove("on"); fx.hover = -1; });
  canvas.addEventListener("click", (e) => {
    if (!fx.onPick) return;
    const i = nearestChamber(e.clientX, e.clientY, 22); if (i >= 0) fx.onPick(i);
  });

  // ------------------------------------------------------------------ loop
  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1); W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    if (cur >= 0) { const sc = SCENES[cur]; const v = typeof sc.view === "function" ? sc.view(V) : (V[sc.view || "all"] || V.all)(); flyTo(v, 0); }
  }
  let last = performance.now();
  const drift = { t0: -1, base: 0 };
  function loop(now) {
    const dt = Math.min(64, now - last); last = now;
    stepCamera(now); stepLayers(dt); frameDt = dt;
    cam.D = 1.5 * H / cam.zoom;
    if (fx.reveal < 1 && !SCENES[cur].welcome) fx.reveal = Math.max(0, Math.min(1, (now - fx.revealT0) / 2600));
    // once a tilted camera lands it keeps breathing: a slow sway from where it stopped, starting at rest
    if (!tween && !reduced && cam.pitch > 0.35) {
      if (drift.t0 < 0) { drift.t0 = now; drift.base = cam.bearing; }
      cam.bearing = drift.base + (fx.drift ? 0.32 : 0.06) * (1 - Math.cos((now - drift.t0) / (fx.drift ? 6200 : 4800)));
    } else drift.t0 = -1;
    syncMap();
    draw(now);
    requestAnimationFrame(loop);
  }
  window.addEventListener("resize", () => { clearTimeout(resize.t); resize.t = setTimeout(resize, 120); });
  resize();
  const start = Math.max(0, SCENES.findIndex((s) => "#" + s.id === location.hash));
  enter(start, true);
  // Live presentation sync sets the hash on followers' pages to the presenter's scene.
  window.addEventListener("hashchange", () => {
    const i = SCENES.findIndex((s) => "#" + s.id === location.hash);
    if (i >= 0 && i !== cur) enter(i);
  });
  requestAnimationFrame(loop);
  setTimeout(() => $("loading").classList.add("done"), 60);
  window.__story = { enter, cam, L, fx, scenes: SCENES, get cur() { return cur; } }; // for the smoke test
})();
