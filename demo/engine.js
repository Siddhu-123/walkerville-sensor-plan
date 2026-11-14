// Story page engine: one map stage that never reloads, a camera that moves between scenes, and the
// scene copy from content/story.js. The map is drawn on a 2D canvas with a small perspective
// camera, so the top view and the 3D view are the same drawing with a different pitch and
// vertical exaggeration: the move from 2D to 3D is a camera move, not a page change.
// Data: demo/story-data.js. Underneath runs the vintage MapLibre basemap from index.html, moved by
// the same camera every frame, so the network sits on real Adelaide streets at any zoom or tilt.
(function () {
  "use strict";
  const S = window.OSP_STORY, SCENES = window.OSP_SCENES, LIB = window.OSP_LIB, STATIC = window.OSP_STATIC || {}, SIM4 = window.OSP_SIM4 || {}, REGIONS = window.OSP_SIM4_REGIONS || {};
  const FACTS = Object.assign({}, STATIC, SIM4.facts || {});
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

  // Region membership can overlap, including the R9 corridor.
  const regionList = (REGIONS.regions || []).map((r) => ({ ...r,
    triage: r.triage || (REGIONS.triage || {})[r.id] || "leave",
    indices: (r.manholes || []).map((id) => chIndex.get(Number(id))).filter((i) => i != null),
    ids: new Set((r.manholes || []).map(Number)) }));
  const memberships = CH.map((c) => regionList.filter((r) => r.ids.has(Number(c.id))));
  const pipeRegions = pipes.map((p) => regionList.filter((r) => {
    const a = chamberAtNode.get(p.a), b = chamberAtNode.get(p.b);
    return a != null && b != null && r.ids.has(Number(CH[a].id)) && r.ids.has(Number(CH[b].id));
  }));
  const phase1 = (SIM4.ladder5 || []).map((id) => chIndex.get(Number(id)));
  const trunk = (SIM4.floatSites || []).map((id) => chIndex.get(Number(id))).filter((i) => i != null);
  const weatherNames = { design: "Design wet", beyond: "Beyond design", severe: "Severe" };
  const surcharge = Object.fromEntries(Object.keys(weatherNames).map((key) => [key,
    new Set(((REGIONS.baseline || {})[key]?.surcharged || []).map(Number))]));
  let weather = "design";

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
  const triageColour = (triage) => triage === "monitor" ? C.warn : triage === "watch" ? C.growth : C.leave;
  function updatePalette() {
    darkTheme = document.documentElement.dataset.theme === "dark";
    const css = getComputedStyle(document.documentElement);
    const colour = (token) => hex(css.getPropertyValue("--" + token).trim());
    for (const [key, token] of Object.entries({ ink: "canvas-ink", accent: "canvas-ink", pipe: "teal",
      leave: "triage-leave", faint: "canvas-faint", water: "water", growth: "amber", warn: "rust", alarm: "rust", sur: "canvas-sur",
      white: "canvas-white", paper: "canvas-paper", home: "canvas-home", trunk: "canvas-trunk", rain: "canvas-rain" })) C[key] = colour(token);
    AGE.splice(0, AGE.length, ...[0, 0.35, 0.7, 1].map((t, i) => [t, colour("age-" + i)]));
    RISE.splice(0, RISE.length, ...[0, 0.3, 0.6, 1].map((t, i) => [t, colour("rise-" + i)]));
    sizes.splice(0, sizes.length, ...[0, 1, 2, 3].map((i) => colour("size-" + i)));
    pipeCols.plain = pipes.map(() => C.pipe);
    pipeCols.age = pipes.map((p) => ramp(AGE, ((p.y || 1950) - 1896) / (2010 - 1896)));
    pipeCols.size = pipes.map((p) => SIZE(p.d));
    pipeCols.path = pipes.map((p) => p.onPath ? C.accent : C.faint);
    pipeCols.regions = pipeRegions.map((rs) => triageColour(rs.find((r) => r.id !== "R9")?.triage));
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
    if (!idx.length) return ALL;
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
    tween = { from: Object.assign({}, cam), to: target, t0: performance.now(), ms: Math.min(1400, ms) };
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
  const LAYERS = ["basemap", "terrain", "homes", "pipes", "chambers", "shafts", "water", "sensors", "trunk", "alarm", "resp", "flow", "pumps", "rain", "spikes"];
  LAYERS.forEach((k) => { L[k] = 0; LT[k] = 0; });
  const fx = { style: "plain", prevStyle: "plain", styleMix: 1, widthMul: 1, reveal: 1, revealT0: 0, sensorT0: 0,
    resp: null, alarmCase: 1, waterCase: 1, waterShown: 1, laterals: null, drift: 0, hover: -1, focus: -1, pathLabels: false };

  function setLayers(show) {
    LAYERS.forEach((k) => { LT[k] = show && show[k] != null ? show[k] : k === "basemap" ? 0.58 : 0; });
    if (!(show && show.sensors > 0)) { L.sensors = 0; L.trunk = 0; LT.trunk = 0; }
  }
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
  let mapNeedsResize = true;
  const mapVisible = () => mapEl.clientWidth > 0 && mapEl.clientHeight > 0;
  const matrixError = (e) => /failed to invert matrix/i.test(String(e?.message || e?.error?.message || e));
  function mapCall(fn) {
    try { fn(); return true; }
    catch (e) { if (!matrixError(e)) throw e; glKey = ""; mapNeedsResize = true; return false; }
  }
  if (gl) gl.on("error", (e) => { if (matrixError(e)) { glKey = ""; mapNeedsResize = true; } });
  if (window.ResizeObserver) new ResizeObserver(() => { resize(); }).observe(mapEl);
  function syncMap() {
    if (!gl) return;
    if (!mapVisible()) { mapNeedsResize = true; glKey = ""; return; }
    if (mapNeedsResize) {
      if (!mapCall(() => gl.resize())) return;
      mapNeedsResize = false; glKey = "";
    }
    // fade the street map as the camera tilts, so the raised network reads against it
    const op = (L.basemap * (1 - 0.62 * Math.min(1, cam.pitch / 0.9))).toFixed(3);
    if (mapEl.style.opacity !== op) mapEl.style.opacity = op;
    const ll = lngLat(cam.x, cam.y), z = Math.log2(cam.zoom * GEO.Sm / 512);
    const key = [ll[0].toFixed(7), ll[1].toFixed(7), z.toFixed(4), cam.pitch.toFixed(4), cam.bearing.toFixed(4), cam.sx.toFixed(1), cam.sy.toFixed(1), W, H].join();
    if (key === glKey) return;
    // padding puts the basemap's centre (and vanishing point) where the overlay camera has it
    const sx = Math.max(1, Math.min(W - 1, cam.sx)), sy = Math.max(1, Math.min(H - 1, cam.sy));
    if (!mapCall(() => gl.jumpTo({ center: ll, zoom: z, bearing: cam.bearing * 180 / Math.PI, pitch: cam.pitch * 180 / Math.PI,
      padding: { left: Math.max(0, 2 * sx - W), right: Math.max(0, W - 2 * sx), top: Math.max(0, 2 * sy - H), bottom: Math.max(0, H - 2 * sy) } }))) return;
    glKey = key;
    if (glReady) mapCall(() => gl.redraw ? gl.redraw() : gl.triggerRepaint());
  }

  // ------------------------------------------------------------------ drawing
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
    projectChambers();
    if (L.chambers > 0.01) drawChambers(zoomScale);
    if (fx.style === "regions") drawRegionOverlay(zoomScale);
    if (SCENES[cur]?.show?.sensors > 0 && LT.sensors > 0 && L.sensors > 0.01) {
      const compare = SCENES[cur]?.chart === "type";
      if (compare) drawSet(trunk, L.trunk, "trunk", now);
      drawSet(compare ? phase1.slice(0, 3) : phase1, L.sensors, "phase1", now);
    }
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
    const pathMode = fx.style === "path", order = null;
    const widthMul = () => 1;
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
      const region = memberships[i].find((r) => r.id !== "R9");
      const full = fx.problem && surcharge[weather].has(Number(CH[i].id));
      const col = full ? C.sur : fx.style === "regions" ? triageColour(region?.triage) : C.white;
      ctx.fillStyle = rgba(col, al); ctx.strokeStyle = rgba(full ? C.warn : C.ink, 0.65 * al);
      ctx.beginPath(); ctx.arc(scr[3 * i], scr[3 * i + 1], r, 0, 7); ctx.fill(); ctx.stroke();
    }
  }

  function drawRegionOverlay(zs) {
    const overlap = regionList.find((r) => r.id === "R9");
    if (!overlap) return;
    ctx.save(); ctx.strokeStyle = rgba(triageColour(overlap.triage), L.pipes); ctx.lineWidth = 1.8;
    // Outline the shared pipes and ring the shared manholes, preserving the underlying region tint.
    ctx.setLineDash([5, 3]);
    pipes.forEach((p, i) => {
      if (!pipeRegions[i].includes(overlap)) return;
      ctx.lineWidth = pipeWidth(p, zs) + 4;
      ctx.beginPath();
      for (let v = 0; v < p.n; v++) { P(p.xs[v], p.ys[v], p.zs[v]); v ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1]); }
      ctx.stroke();
    });
    ctx.setLineDash([]); ctx.lineWidth = 1.8;
    overlap.indices.forEach((i) => { ctx.beginPath(); ctx.arc(scr[3 * i], scr[3 * i + 1], 4.5 * Math.min(zs, 1.8), 0, 7); ctx.stroke(); });
    ctx.restore();
  }

  function drawSet(set, a, kind, now) {
    set.forEach((i, k) => {
      if (i == null) return;
      if (kind === "phase1" && fx.onlyK1 && k > 0) return;
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
      const hidden = x < a.x0 - 40 || x > a.x1 + 40 || y < a.y0 - 20 || y > a.y1 + 40 || (l.sensor && !(LT.sensors > 0));
      l.el.style.visibility = hidden ? "hidden" : "visible";
      if (hidden) continue;
      const w = l.el.offsetWidth, h = l.el.offsetHeight;
      let left = Math.max(a.x0, Math.min(a.x1 - w, x - w / 2)), top = Math.max(a.y0, y - h - 18);
      for (let pass = 0; pass < 40; pass++) {
        const box = { left, top, right: left + w, bottom: top + h };
        const hit = placed.find((r) => box.left < r.right + 5 && box.right > r.left - 5 && box.top < r.bottom + 5 && box.bottom > r.top - 5);
        const marker = l.sensor && phase1.some((i) => i != null && scr[3 * i] > box.left - 12 && scr[3 * i] < box.right + 12 && scr[3 * i + 1] > box.top - 12 && scr[3 * i + 1] < box.bottom + 12);
        if (!hit && !marker) break;
        top += h + 7;
        if (top + h > a.y1) { top = a.y0; left = Math.min(a.x1 - w, left + w + 8); }
      }
      placed.push({ left, top, right: left + w, bottom: top + h });
      l.el.style.transform = `translate(${left.toFixed(1)}px, ${top.toFixed(1)}px)`;
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
    const dot = (colour, label, style = "") => `<span class="key"><i style="background:var(--${colour});${style}"></i>${label}</span>`;
    const entries = {
      problem: dot("canvas-sur", "Surcharged manhole"),
      triage: dot("rust", "Monitor") + dot("amber", "Watch") + dot("triage-leave", "Room on a design wet day"),
      sensors: dot("canvas-ink", "Level sensors 1 to 5"),
      type: dot("canvas-ink", "Level sensor") + dot("canvas-trunk", "Float switch", "border-radius:0"),
    };
    return entries[key] ? `<div class="legend">${entries[key]}</div>` : "";
  }

  // Charts read only Sim 4 tables. Missing optional series are simply omitted.
  const pct = (v) => Math.round(Number(v) <= 1 ? Number(v) * 100 : Number(v));
  const pctTxt = (v) => pct(v) + "%";
  const missingChart = () => `<p class="note">Chart data is not available.</p>`;
  function chartFrontier() {
    const curves = SIM4.curves || {}, average = curves.average || [], worst = curves.worst || [];
    if (!average.length && !worst.length) return missingChart();
    const w = 380, h = 230, l = 38, r = 100, t = 22, b = 38, K = 8;
    const X = (k) => l + (k - 1) / (K - 1) * (w - l - r);
    const Y = (v) => t + (1 - pct(v) / 100) * (h - t - b);
    let g = "";
    for (const v of [0, .25, .5, .75, 1]) g += `<line class="grid" x1="${l}" x2="${w - r}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${l - 6}" y="${Y(v) + 4}" text-anchor="end">${pctTxt(v)}</text>`;
    for (let k = 1; k <= K; k++) g += `<text x="${X(k)}" y="${h - b + 18}" text-anchor="middle">${k}</text>`;
    const series = [
      [worst, "canvas-ink", "Worst, 10 mm", 14, false],
      [average, "chart-greedy", "Average, 10 mm", -12, false],
      [curves.average_25 || [], "chart-greedy", "Average, 25 mm", 0, true],
    ];
    series.forEach(([values, colour, label, dy, dashed]) => {
      const data = values.slice(0, K);
      if (!data.length) return;
      const d = data.map((v, i) => `${i ? "L" : "M"}${X(i + 1).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ");
      // A reveal mask preserves the dashed 25 mm line during the draw animation.
      if (dashed) g += `<defs><mask id="ladder-25-reveal" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}"><path class="draw" style="--len:900" d="${d}" fill="none" stroke="white" stroke-width="6"/></mask></defs>`;
      g += `<path ${dashed ? 'mask="url(#ladder-25-reveal)" stroke-dasharray="6 4"' : 'class="draw" style="--len:900"'} d="${d}" fill="none" stroke="var(--${colour})" stroke-width="${colour === "canvas-ink" ? 3 : 2}"/>`;
      const v = data[data.length - 1], x = X(data.length) + 7, y = Y(v) + dy;
      g += `<text class="pop" x="${x}" y="${y}" style="fill:var(--${colour})">${label}<tspan x="${x}" dy="12">${pctTxt(v)}</tspan></text>`;
    });
    if (worst[4] != null) g += `<g class="pop"><line x1="${X(5)}" x2="${X(5)}" y1="${Y(0)}" y2="${Y(worst[4])}" stroke="var(--canvas-ink)" stroke-dasharray="3 3"/><circle cx="${X(5)}" cy="${Y(worst[4])}" r="5" fill="var(--canvas-ink)" stroke="var(--canvas-white)" stroke-width="1.5"/><text class="val" x="${X(5) + 8}" y="${Y(worst[4]) + 16}">${pctTxt(worst[4])}</text></g>`;
    g += `<text x="${(l + w - r) / 2}" y="${h - 6}" text-anchor="middle">Number of level sensors</text>`;
    return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Growth seen by one to eight level sensors: worst case and average at the 10 mm rise rule, and average at 25 mm">${g}</svg>`;
  }
  function chartAxis(l, r, y, title, w) {
    return `<line class="axis" x1="${l}" x2="${r}" y1="${y}" y2="${y}"/>` + [0, .5, 1].map((v) => {
      const x = l + (r - l) * v;
      return `<line class="axis" x1="${x}" x2="${x}" y1="${y}" y2="${y + 4}"/><text x="${x}" y="${y + 18}" text-anchor="middle">${pctTxt(v)}</text>`;
    }).join("") + `<text x="${w / 2}" y="${y + 43}" text-anchor="middle">${title}</text>`;
  }
  function chartBeats() {
    const comparison = (SIM4.budget_compare || []).find((row) => row.budget === "$75k");
    if (!comparison) return missingChart();
    const rows = [["level", "Staged level plan"], ["floats", "Float switches only"], ["mix", "Separately chosen mix"]];
    const w = 380, rh = 30, l = 154, t = 26, right = w - 44, y0 = t + rows.length * rh, h = y0 + 52;
    let g = `<text x="0" y="12">$75k budget · worst case</text>`;
    rows.forEach(([key, label], i) => {
      const v = comparison[key]?.worst;
      if (!Number.isFinite(Number(v))) return;
      const y = t + i * rh + 4, bw = (right - l) * pct(v) / 100;
      g += `<text class="lab" x="0" y="${y + 15}">${label}</text>`;
      g += `<rect class="bar" style="transition-delay:${.15 + i * .12}s" x="${l}" y="${y + 3}" width="${bw}" height="16" rx="3" fill="var(--${key === "level" ? "canvas-ink" : "chart-other"})"/>`;
      g += `<text class="val pop" x="${l + bw + 6}" y="${y + 15}">${pctTxt(v)}</text>`;
    });
    g += chartAxis(l, right, y0, "Share of detectable growth seen (worst case)", w);
    return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Worst-case growth seen at a $75k budget by the staged level plan, float switches only and a separately chosen mix">${g}</svg>`;
  }
  function chartHoldout() {
    const data = SIM4.holdout_k5 || [];
    if (!data.length) return missingChart();
    const labels = {
      "In-sample worst wet case": "Chosen with all weather · worst case",
      "In-sample average (7 wet cases)": "Chosen with all weather · average",
      "Unseen weather (held-out case)": "Weather left out · average",
      "Unseen region (held-out region)": "Region left out · average",
      "Random responsive manholes (5,000 draws)": "Random responsive · average",
      "Random any manholes (5,000 draws)": "Random any · average",
    };
    // Keep the worst case before the average; the other checks report averages.
    const rows = Object.keys(labels).flatMap((label) => data.filter((row) => row.label === label));
    const w = 380, rh = 34, t = 4, l = 0, right = w - 44, y0 = t + rows.length * rh, h = y0 + 52;
    const reference = data.find((row) => row.label === "In-sample average (7 wet cases)")?.v;
    let g = "";
    rows.forEach((row, i) => {
      if (!Number.isFinite(Number(row.v))) return;
      const y = t + i * rh, bw = (right - l) * pct(row.v) / 100;
      const heldOut = row.label.startsWith("Unseen "), chosen = row.label.startsWith("In-sample ");
      const colour = heldOut && Number(row.v) < Number(reference) ? "rust" : chosen ? row.label.includes("worst") ? "canvas-ink" : "chart-greedy" : "chart-other";
      g += `<text class="lab" x="0" y="${y + 12}">${labels[row.label]}</text><rect class="bar" style="transition-delay:${.1 + i * .1}s" x="${l}" y="${y + 17}" width="${bw}" height="11" rx="2" fill="var(--${colour})"/><text class="val pop" x="${l + bw + 6}" y="${y + 27}" style="fill:var(--${colour})">${pctTxt(row.v)}</text>`;
    });
    g += chartAxis(l, right, y0, "Share of detectable growth seen (five level sensors)", w);
    return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Five level sensors: chosen with all weather, weather left out, region left out, random responsive and random any manholes">${g}</svg>`;
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
    const selectors = { chart: "svg.chart", params: ".params", steps: ".steps", vs: ".vs", stats: ".stats", seg: ".seg" };
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
    const act = sc.act && !sc.noAct ? `<span class="act">${tok(sc.act)}</span><span>·</span>` : "";
    let h = `<div class="kicker">${act}<span>${tok(sc.kicker || "")}</span></div><h1>${tok(sc.title)}</h1>`;
    if (sc.stats) h += `<div class="stats">${sc.stats.map((s) => `<div class="stat ${s[2] || ""}"><b>${tok(s[0])}</b><span>${tok(s[1])}</span></div>`).join("")}</div>`;
    if (sc.html) h += `<div>${tok(sc.html)}</div>`;
    if (sc.chart === "ladder") h += chartFrontier();
    if (sc.chart === "type") h += chartBeats();
    if (sc.chart === "holdout") h += chartHoldout();
    if (sc.fx === "problem") h += `<div class="seg" role="group" aria-label="Weather case">${Object.entries(weatherNames).map(([key, name]) => `<button type="button" data-weather="${key}" aria-pressed="${key === "design"}">${name}</button>`).join("")}</div>`;
    if (sc.readout || sc.fx === "problem") h += `<div class="readout" id="readout" role="status"></div>`;
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
  const V = {}; // named views, resolved at scene entry so they follow the window size
  V.all = () => fit(ALL, { pad: 0.06 });
  // the welcome page's own view of Greater Adelaide (index.html VIEWS.adelaide), centred on the screen
  V.region = () => { const q = local(138.578, -34.922), zoom = 512 * Math.pow(2, 12.15) / GEO.Sm;
    return { x: q[0], y: q[1], z: zMid, zoom, pitch: 0, bearing: 0, ve: 0, D: 1.5 * H / zoom, sx: W / 2, sy: H / 2 }; };
  V.plan = () => fit(boxOf(phase1.filter((i) => i != null), 350), { pad: 0.1 });
  V.p1 = () => fit(boxOf(phase1.filter((i) => i != null), 420), { pad: 0.12 });
  V.beats = () => fit(boxOf(phase1.filter((i) => i != null).concat(trunk), 380), { pad: 0.1 });
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
  function sensorLabels() {
    if (!(LT.sensors > 0)) return;
    fx.sensorT0 = performance.now();
    const sc = SCENES[cur];
    if (sc.chart === "type") {
      setLabels([
        ...phase1.slice(0, 3).flatMap((ch, k) => ch == null ? [] : [{ ch, sensor: true, html: "Level sensor " + (k + 1), cls: "accent quiet" }]),
        ...trunk.map((ch) => ({ ch, html: "Float switch", cls: "quiet" })),
      ]);
    } else {
      setLabels(sc.id === "close" && phase1[0] != null ? [{ ch: phase1[0], sensor: true, html: "Sensor 1", cls: "accent quiet" }] : []);
    }
  }
  const SCN = {
    welcome() { fx.reveal = 0; },
    all() { if (LT.sensors > 0) sensorLabels(); },
    infill() { setStyle("age"); },
    problem() {
      fx.problem = true;
      const show = (key) => {
        weather = key;
        card.querySelectorAll("[data-weather]").forEach((b) => {
          const selected = b.dataset.weather === key;
          b.classList.toggle("on", selected); b.setAttribute("aria-pressed", String(selected));
        });
        const readout = $("readout");
        if (readout) readout.textContent = `${surcharge[key].size} manholes surcharged (water above the pipe top)`;
      };
      show("design");
      card.querySelectorAll("[data-weather]").forEach((b) => b.addEventListener("click", () => show(b.dataset.weather)));
    },
    regions() {
      setStyle("regions");
      setLabels(regionList.filter((r) => r.indices.length).map((r) => ({
        x: r.indices.reduce((v, i) => v + CH[i].x, 0) / r.indices.length,
        y: r.indices.reduce((v, i) => v + CH[i].y, 0) / r.indices.length,
        html: r.id, cls: "region-label" + (r.id === "R9" ? " overlap" : ""),
      })));
    },
    ladder: sensorLabels, holdout: sensorLabels, plan: sensorLabels, beats: sensorLabels, close: sensorLabels,
  };

  function enter(i, instant) {
    i = Math.max(0, Math.min(SCENES.length - 1, i));
    if (i === cur && !instant) return;
    closeSource();
    clearTimers(); fx.onPick = null; fx.laterals = null; fx.chamberPop = 0; fx.drift = 0; fx.widthTarget = 1; fx.reveal = 1; fx.onlyK1 = false; fx.problem = false; tip.classList.remove("on");
    document.body.classList.toggle("is-welcome", !!SCENES[i].welcome);
    fx.resp = null; fx.hover = -1;
    const sc = SCENES[i], prev = cur; cur = i; sceneT0 = performance.now();
    setLayers(sc.show);
    if (!(sc.show && sc.show.sensors > 0)) setLabels([]);
    card.classList.remove("in"); card.classList.add("out");
    const swap = () => {
      renderCard(sc, i);
      card.classList.remove("out"); void card.offsetWidth; card.classList.add("in");
      setStyle(sc.style || "plain");
      setLayers(sc.show);
      setLabels([]);
      if (W > 0 && H > 0) {
        const view = typeof sc.view === "function" ? sc.view(V) : (V[sc.view || "all"] || V.all)();
        flyTo(view, instant ? 0 : Math.min(1400, sc.ms ?? 1400));
      }
      if (sc.fx && SCN[sc.fx]) SCN[sc.fx]();
      else if (LT.sensors > 0) sensorLabels();
      updateBar();
      try { history.replaceState(null, "", "#" + sc.id); } catch (e) { /* file:// in some browsers */ }
    };
    if (prev < 0 || instant || reduced) swap(); else later(swap, 180);
  }

  // ------------------------------------------------------------------ bar and navigation
  const acts = [];
  const lead = SCENES[0] && SCENES[0].welcome ? 1 : 0;   // the welcome page is not a numbered step
  SCENES.forEach((s, i) => { if (s.welcome) return; if (!acts.length || acts[acts.length - 1].name !== s.act) acts.push({ name: s.act, first: i, n: 0 }); acts[acts.length - 1].n++; });
  $("acts").innerHTML = acts.map((a, k) => `<button class="act-seg" type="button" style="--n:${a.n}" data-k="${k}" aria-label="${a.name}"><span>${a.name}</span><i></i></button>`).join("");
  $("acts").querySelectorAll(".act-seg").forEach((b) => b.addEventListener("click", () => enter(acts[+b.dataset.k].first)));
  function updateBar() {
    $("count").textContent = String(Math.max(1, cur + 1 - lead)).padStart(2, "0") + " / " + String(SCENES.length - lead).padStart(2, "0");
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
    if (glReady) window.applyBasemapTheme(document.documentElement.dataset.theme || "light", gl);
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
    if ((k === " " || k === "Enter") && e.target.closest && e.target.closest("a, button, [role=button]")) return;
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
    fx.hover = i; canvas.style.cursor = i >= 0 ? "pointer" : "default";
    if (i < 0) { tip.classList.remove("on"); return; }
    const h = chamberReadout(i, LT.sensors > 0);
    tip.innerHTML = h; tip.style.left = e.clientX + "px"; tip.style.top = e.clientY + "px"; tip.classList.add("on");
  });
  canvas.addEventListener("mouseleave", () => { tip.classList.remove("on"); fx.hover = -1; });
  function chamberReadout(i, showSensor = true) {
    const regions = memberships[i].map((r) => `${r.id}: ${r.triage[0].toUpperCase() + r.triage.slice(1)}`).join(" · ");
    const k = phase1.indexOf(i);
    return `<b>MH${CH[i].id}</b><br>${regions || "Outside the study regions"}${k >= 0 && showSensor ? `<br>Sensor ${k + 1}` : ""}`;
  }
  canvas.addEventListener("click", (e) => {
    const i = nearestChamber(e.clientX, e.clientY, 22);
    if (i < 0) return;
    tip.innerHTML = chamberReadout(i); tip.style.left = Math.min(W - 270, e.clientX) + "px";
    tip.style.top = Math.min(H - 100, e.clientY) + "px"; tip.classList.add("on");
  });

  // ------------------------------------------------------------------ loop
  function resize() {
    const bounds = canvas.getBoundingClientRect();
    if (!(bounds.width > 0 && bounds.height > 0)) { mapNeedsResize = true; return; }
    DPR = Math.min(2, window.devicePixelRatio || 1); W = bounds.width; H = bounds.height;
    mapNeedsResize = true; glKey = "";
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    if (cur >= 0) { const sc = SCENES[cur]; const v = typeof sc.view === "function" ? sc.view(V) : (V[sc.view || "all"] || V.all)(); flyTo(v, 0); }
  }
  let last = performance.now();
  const drift = { t0: -1, base: 0 };
  function loop(now) {
    const dt = Math.min(64, now - last); last = now;
    if (!(W > 0 && H > 0)) { resize(); requestAnimationFrame(loop); return; }
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
  window.addEventListener("resize", () => { cancelAnimationFrame(resize.t); resize.t = requestAnimationFrame(resize); });
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
