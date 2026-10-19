// Story page engine: one map stage that never reloads, a camera that moves between scenes, and the
// scene copy from content/story.js. The map is drawn on a 2D canvas with a small perspective
// camera, so the top view and the 3D view are the same drawing with a different pitch and
// vertical exaggeration: the move from 2D to 3D is a camera move, not a page change.
// Data: data/story.js (build/export_story.py). No dependencies.
(function () {
  "use strict";
  const S = window.OSP_STORY, SCENES = window.OSP_SCENES, STATIC = window.OSP_STATIC || {};
  const FACTS = Object.assign({}, S.facts, STATIC);
  const $ = (id) => document.getElementById(id);
  const canvas = $("map"), ctx = canvas.getContext("2d");
  const card = $("card"), labelsEl = $("labels"), tip = $("tip");
  const reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ------------------------------------------------------------------ data prep
  const N = S.nodes, nn = N.x.length;
  const CH = S.chambers, nch = CH.length;
  const chIndex = new Map(CH.map((c, i) => [c.id, i]));
  const cover = N.cover.map((v, i) => (v > 0 ? v : N.inv[i] + 2.9));

  const pipes = S.pipes.map((p) => {
    const n = p.p.length / 2, xs = new Float64Array(n), ys = new Float64Array(n), zs = new Float64Array(n);
    let len = 0; const cum = [0];
    for (let i = 0; i < n; i++) {
      xs[i] = p.p[2 * i]; ys[i] = p.p[2 * i + 1];
      if (i) { len += Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]); cum.push(len); }
    }
    for (let i = 0; i < n; i++) zs[i] = p.za + (p.zb - p.za) * (len ? cum[i] / len : 0);
    return { xs, ys, zs, n, len, a: p.a, b: p.b, d: p.d, y: p.y, m: p.m, dOut: 0, onPath: false };
  });

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
    const base = [226 + 16 * h, 232 + 9 * h, 238 - 4 * h];
    const f = 0.86 + 0.22 * shade;
    quads.push({ i, j, m, rgb: base.map((c) => Math.min(255, Math.round(c * f))) });
  }

  // the same ground as a smooth shaded image, for the top view (quads take over as the camera tilts)
  const FINE = 4, IW = (GX - 1) * FINE + 1, IH = (GY - 1) * FINE + 1;
  const terrainImg = document.createElement("canvas"); terrainImg.width = IW; terrainImg.height = IH;
  (function () {
    const tc = terrainImg.getContext("2d"), img = tc.createImageData(IW, IH), fz = new Float64Array(IW * IH), fm = new Float64Array(IW * IH);
    for (let v = 0; v < IH; v++) for (let u = 0; u < IW; u++) {
      const fi = u / FINE, fj = v / FINE, i = Math.min(GX - 2, Math.floor(fi)), j = Math.min(GY - 2, Math.floor(fj)), a = fi - i, b = fj - j, k = j * GX + i;
      fz[v * IW + u] = (gz[k] * (1 - a) + gz[k + 1] * a) * (1 - b) + (gz[k + GX] * (1 - a) + gz[k + GX + 1] * a) * b;
      fm[v * IW + u] = (gmask[k] * (1 - a) + gmask[k + 1] * a) * (1 - b) + (gmask[k + GX] * (1 - a) + gmask[k + GX + 1] * a) * b;
    }
    const step = cs / FINE;
    for (let v = 0; v < IH; v++) for (let u = 0; u < IW; u++) {
      const at = (uu, vv) => fz[Math.max(0, Math.min(IH - 1, vv)) * IW + Math.max(0, Math.min(IW - 1, uu))];
      const dzx = (at(u + 1, v) - at(u - 1, v)) / (2 * step), dzy = (at(u, v + 1) - at(u, v - 1)) / (2 * step);
      const E = 9, nx = -dzx * E, ny = -dzy * E, nl = Math.hypot(nx, ny, 1);
      const shade = Math.max(0, Math.min(1, (nx * -0.55 + ny * 0.55 + 0.63) / nl));
      const h = (fz[v * IW + u] - zLo) / (zHi - zLo || 1), f = 0.84 + 0.24 * shade;
      const row = (IH - 1 - v) * IW + u, o = row * 4;   // image rows run north to south
      img.data[o] = Math.min(255, (222 + 22 * h) * f); img.data[o + 1] = Math.min(255, (230 + 12 * h) * f);
      img.data[o + 2] = Math.min(255, (238 - 6 * h) * f);
      const m = fm[v * IW + u]; img.data[o + 3] = Math.round(255 * m * m * (3 - 2 * m));
    }
    tc.putImageData(img, 0, 0);
  })();

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
  const C = { ink: hex("#1f2933"), accent: hex("#0b3d91"), pipe: hex("#6b7884"), faint: hex("#b9c2cb"), water: hex("#1d6fd8"),
    growth: hex("#d97706"), warn: hex("#c2410c"), alarm: hex("#ea580c"), sur: hex("#b91c1c"), white: [255, 255, 255], home: hex("#a7b1bb") };
  const AGE = [[0, hex("#0b3d91")], [0.35, hex("#3f6fb5")], [0.7, hex("#8fb0d8")], [1, hex("#d4e1f1")]];
  const RISE = [[0, hex("#fde68a")], [0.3, hex("#f59e0b")], [0.6, hex("#ea580c")], [1, hex("#9a3412")]];
  const riseCol = (mm) => ramp(RISE, Math.log(1 + mm) / Math.log(1 + 80));
  const SIZE = (d) => (d <= 150 ? hex("#9db3cc") : d <= 225 ? hex("#4f7fbd") : d <= 300 ? hex("#1e4f9c") : hex("#0b2a5c"));
  const pipeCols = {
    plain: pipes.map(() => C.pipe),
    age: pipes.map((p) => ramp(AGE, ((p.y || 1950) - 1896) / (2010 - 1896))),
    size: pipes.map((p) => SIZE(p.d)),
    path: pipes.map((p) => (p.onPath ? C.accent : C.faint)),
  };

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
    const r = card.getBoundingClientRect(), bottom = H - 62, portrait = W <= 900 || W / H < 0.8;
    if (portrait) return { x0: 14, x1: W - 14, y0: 58, y1: Math.max(140, (r.height ? r.top : H * 0.5) - 14) };
    return { x0: (r.right || 420) + 28, x1: W - 28, y0: 40, y1: bottom };
  }
  function fit(box, o) {
    const ext = Math.max(box.x1 - box.x0, box.y1 - box.y0, 80);
    const c = { x: (box.x0 + box.x1) / 2, y: (box.y0 + box.y1) / 2, z: o.z != null ? o.z : zMid, zoom: 1,
      pitch: (o.pitch || 0) * Math.PI / 180, bearing: (o.bearing || 0) * Math.PI / 180, ve: o.ve || 0,
      D: ext * (o.persp || 2.4), sx: 0, sy: 0 };
    trig(c);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    const zs = o.ve ? [box.z0 != null ? box.z0 : zMid - 3, box.z1 != null ? box.z1 : zMid] : [c.z];
    const corners = box.pts && o.ve ? box.pts : [];
    if (!corners.length) for (const X of [box.x0, box.x1]) for (const Y of [box.y0, box.y1]) for (const Z of zs) corners.push([X, Y, Z]);
    for (const q of corners) {
      P(q[0], q[1], q[2], c); x0 = Math.min(x0, pt[0]); x1 = Math.max(x1, pt[0]); y0 = Math.min(y0, pt[1]); y1 = Math.max(y1, pt[1]);
    }
    trig(cam);
    const a = freeRect(), padf = o.pad != null ? o.pad : 0.08;
    const zoom = Math.min((a.x1 - a.x0) * (1 - padf) / (x1 - x0 || 1), (a.y1 - a.y0) * (1 - padf) / (y1 - y0 || 1)) * (o.zoomMul || 1);
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
    for (const k of ["x", "y", "z", "pitch", "ve", "D", "sx", "sy"]) cam[k] = f[k] + (g[k] - f[k]) * e;
    cam.zoom = Math.exp(Math.log(f.zoom) + (Math.log(g.zoom) - Math.log(f.zoom)) * e);
    cam.bearing = ANG(f.bearing, g.bearing, e);
    // arc out a little on long moves, so a cut across the map reads as one flight
    const lift = Math.sin(Math.PI * e) * Math.min(0.28, Math.hypot(g.x - f.x, g.y - f.y) / 9000);
    cam.zoom *= 1 - lift;
    if (t >= 1) tween = null;
  }

  // ------------------------------------------------------------------ layers and effects
  const L = {}, LT = {};
  const LAYERS = ["terrain", "homes", "pipes", "chambers", "shafts", "water", "sensors", "phase2", "trunk", "alarm", "resp", "flow", "rain", "spikes"];
  LAYERS.forEach((k) => { L[k] = 0; LT[k] = 0; });
  const fx = { style: "plain", prevStyle: "plain", styleMix: 1, widthMul: 1, reveal: 1, revealT0: 0, sensorT0: 0,
    resp: null, alarmCase: 1, waterCase: 1, waterShown: 1, laterals: null, drift: 0, hover: -1, focus: -1, pathLabels: false };

  function setLayers(show) { LAYERS.forEach((k) => { LT[k] = show && show[k] != null ? show[k] : 0; }); }
  function stepLayers(dt) {
    const a = 1 - Math.exp(-dt / 260);
    LAYERS.forEach((k) => { L[k] += (LT[k] - L[k]) * a; if (Math.abs(LT[k] - L[k]) < 0.002) L[k] = LT[k]; });
    fx.styleMix = Math.min(1, fx.styleMix + dt / 700);
    fx.widthMul += ((fx.widthTarget || 1) - fx.widthMul) * a;
  }

  // ------------------------------------------------------------------ drawing
  const SUR = {}; for (const k in S.base_surcharged) SUR[k] = new Set(S.base_surcharged[k]);
  const scr = new Float64Array(nch * 3); // projected chambers, for picking and labels
  let frameDt = 16;
  function draw(now) {
    trig(cam);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    const tilt = Math.min(1, cam.pitch / 0.9);
    g.addColorStop(0, rgba(mix([244, 246, 248], [233, 238, 244], tilt), 1));
    g.addColorStop(1, rgba(mix([244, 246, 248], [246, 248, 250], tilt), 1));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    const zoomScale = Math.max(1, Math.min(3.4, Math.sqrt(cam.zoom / 0.22)));
    if (L.terrain > 0.01) drawTerrain();
    if (L.homes > 0.01) drawHomes(zoomScale);
    if (L.shafts > 0.01) drawShafts(zoomScale);
    if (L.pipes > 0.01) drawPipes(now, zoomScale);
    if (L.flow > 0.01) drawFlow(now, zoomScale);
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
    const flat = 1 - Math.max(0, Math.min(1, (cam.pitch - 0.02) / 0.22));
    if (flat > 0.01) {
      const o = [0, 0, 0, 0], ex = [0, 0, 0, 0], ey = [0, 0, 0, 0], top = gy0 + (GY - 1) * cs;
      P(gx0, top, cam.z, cam, o); P(gx0 + (GX - 1) * cs, top, cam.z, cam, ex); P(gx0, gy0, cam.z, cam, ey);
      ctx.save(); ctx.globalAlpha = L.terrain * flat; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
      ctx.setTransform(DPR * (ex[0] - o[0]) / IW, DPR * (ex[1] - o[1]) / IW, DPR * (ey[0] - o[0]) / IH, DPR * (ey[1] - o[1]) / IH, DPR * o[0], DPR * o[1]);
      ctx.drawImage(terrainImg, 0, 0); ctx.restore();
      if (flat >= 0.99) return;
    }
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
      const t = s[9], col = rgba(t.rgb, alpha * t.m);
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

  function pipeWidth(p, zs) { return (0.75 + (p.d / 1000) * 3.6) * zs * fx.widthMul; }

  function drawPipes(now, zs) {
    const reveal = fx.reveal < 1 ? fx.reveal : 1;
    const R = reveal * (maxOut + 400);
    const prev = pipeCols[fx.prevStyle], cur = pipeCols[fx.style], m = fx.styleMix;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    const pathMode = fx.style === "path";
    for (let pass = 0; pass < (pathMode ? 2 : 1); pass++) {
      for (let i = 0; i < pipes.length; i++) {
        const p = pipes[i];
        if (pathMode && (pass === 0) === p.onPath) continue;
        let a = L.pipes;
        if (reveal < 1) a *= Math.max(0, Math.min(1, (R - p.dOut) / 380));
        if (a < 0.01) continue;
        const col = m >= 1 ? cur[i] : mix(prev[i], cur[i], m);
        ctx.strokeStyle = rgba(col, a * 0.95);
        ctx.lineWidth = pipeWidth(p, zs) * (pathMode && p.onPath ? 2 : 1);
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
        const top = [0, 0, 0, 0]; P(ch.x, ch.y, ch.cover, cam, top); P(ch.x, ch.y, ch.cover + h * 0.4 / Math.max(cam.ve, 1));
        ctx.strokeStyle = rgba(col, 0.9 * a * spikes); ctx.lineWidth = Math.max(2, 2.2 * zs);
        ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo(pt[0], pt[1]); ctx.stroke();
        ctx.fillStyle = rgba(col, a * spikes); ctx.beginPath(); ctx.arc(pt[0], pt[1], big ? 3.6 : 2.4, 0, 7); ctx.fill();
      }
      const rad = (2.4 + Math.sqrt(mm) * 1.15) * appear * Math.min(1.6, zs * 0.7 + 0.5);
      ctx.fillStyle = rgba(col, 0.82 * a); ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill();
      if (big) { ctx.strokeStyle = rgba(C.ink, 0.55 * a); ctx.lineWidth = 1.2; ctx.stroke(); }
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
        ctx.fillStyle = rgba(C.white, al); ctx.font = "700 11px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(String(k + 1), x, y + 0.5);
      } else if (kind === "phase2") {
        ctx.fillStyle = rgba(C.white, al * 0.95); ctx.strokeStyle = rgba(C.accent, al); ctx.lineWidth = 2.2; ctx.setLineDash([3, 2.5]);
        ctx.beginPath(); ctx.arc(x, y, 8.5, 0, 7); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = rgba(C.accent, al); ctx.font = "700 10px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(String(k + 6), x, y + 0.5);
      } else {
        ctx.fillStyle = rgba([120, 130, 140], al * 0.9); ctx.strokeStyle = rgba(C.white, al); ctx.lineWidth = 2;
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
    ctx.strokeStyle = rgba([90, 120, 160], 0.22 * L.rain); ctx.lineWidth = 1;
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
      plan1: `<span class="key"><i style="background:#0b3d91"></i>Recommended sensor</span><span class="key"><i style="background:#fff;border:1.5px solid #5b6670"></i>Manhole in the model</span>`,
      plan: `<span class="key"><i style="background:#0b3d91"></i>Sensor, phase 1</span><span class="key"><i class="ring"></i>Phase 2</span>`,
      age: `<div class="ramp">1896<i style="background:linear-gradient(90deg,#0b3d91,#3f6fb5,#8fb0d8,#d4e1f1)"></i>2010</div><span class="key"><i style="background:#a7b1bb;border-radius:2px"></i>Connected property</span>`,
      flow: `<span class="key"><i class="line" style="background:#1d6fd8"></i>Sewage, moving downhill</span><span class="key"><i style="background:#fff;border:1.5px solid #5b6670"></i>Manhole in the model</span>`,
      resp: `<div class="ramp">2 mm<i style="background:linear-gradient(90deg,#fde68a,#f59e0b,#ea580c,#9a3412)"></i>80 mm rise</div><span class="key"><i style="background:#d97706"></i>New homes connect here</span><span class="key"><i style="background:#f59e0b;border:1.5px solid #1f2933"></i>Rises 25 mm or more</span>`,
      alarm: `<span class="key"><i style="background:#ea580c"></i>Over the 150 mm alarm already</span><span class="key"><i style="background:#b91c1c"></i>Pipe running full</span>`,
      beats: `<span class="key"><i style="background:#0b3d91"></i>Our five</span><span class="key"><i style="background:#78828c;border-radius:2px"></i>Five with the deepest flow today</span>`,
      size: `<span class="key"><i class="line" style="background:#9db3cc"></i>150 mm</span><span class="key"><i class="line" style="background:#4f7fbd"></i>225 mm</span><span class="key"><i class="line" style="background:#1e4f9c"></i>300 mm</span><span class="key"><i class="line" style="background:#0b2a5c"></i>Larger</span>`,
      water: `<span class="key"><i class="line" style="background:#1d6fd8"></i>Normal water depth at each manhole (bar height)</span><span class="key"><i class="line" style="background:#b91c1c"></i>Pipe running full</span>`,
    };
    return key ? `<div class="legend">${L1[key] || ""}</div>` : "";
  }

  // charts ------------------------------------------------------------
  const pctTxt = (v) => Math.round(v * 100) + "%";
  function chartFrontier() {
    const w = 380, h = 190, l = 34, r = 12, t = 12, b = 30, K = S.curves.optimum.length;
    const X = (k) => l + (k - 1) / (K - 1) * (w - l - r), Y = (v) => t + (1 - v) * (h - t - b);
    const line = (arr) => arr.map((v, i) => (i ? "L" : "M") + X(i + 1).toFixed(1) + " " + Y(v).toFixed(1)).join(" ");
    const len = 900, k1 = FACTS.plan_k1, v1 = S.curves.optimum[k1 - 1];
    let g = "";
    for (const v of [0, 0.25, 0.5, 0.75, 1]) g += `<line class="grid" x1="${l}" x2="${w - r}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${l - 6}" y="${Y(v) + 4}" text-anchor="end">${v * 100}%</text>`;
    for (let k = 1; k <= K; k++) g += `<text x="${X(k)}" y="${h - 12}" text-anchor="middle">${k}</text>`;
    g += `<text x="${(l + w - r) / 2}" y="${h}" text-anchor="middle">sensors</text>`;
    g += `<path class="draw" style="--len:${len}" d="${line(S.curves.random)}" fill="none" stroke="#c4ccd4" stroke-width="2"/>`;
    g += `<path class="draw" style="--len:${len}" d="${line(S.curves.greedy)}" fill="none" stroke="#8a96a3" stroke-width="2" stroke-dasharray="0"/>`;
    g += `<path class="draw" style="--len:${len}" d="${line(S.curves.optimum)}" fill="none" stroke="#0b3d91" stroke-width="3"/>`;
    g += `<g class="pop"><line x1="${X(k1)}" x2="${X(k1)}" y1="${Y(0)}" y2="${Y(v1)}" stroke="#0b3d91" stroke-dasharray="3 3"/>`;
    S.curves.optimum.forEach((v, i) => { g += `<circle cx="${X(i + 1)}" cy="${Y(v)}" r="${i + 1 === k1 ? 5 : 2.6}" fill="#0b3d91" stroke="#fff" stroke-width="1.5"/>`; });
    g += `<text class="val" x="${X(k1) + 8}" y="${Y(v1) + 16}">${pctTxt(v1)}</text>`;
    g += `<text x="${X(K) - 2}" y="${Y(S.curves.optimum[K - 1]) - 9}" text-anchor="end" style="fill:#0b3d91;font-weight:600">Best possible (proven)</text>`;
    g += `<text x="${X(K - 2)}" y="${Y(S.curves.greedy[K - 3]) + 16}" text-anchor="middle">One at a time</text>`;
    g += `<text x="${X(K) - 2}" y="${Y(S.curves.random[K - 1]) + 15}" text-anchor="end">Best of 20 random</text></g>`;
    return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Share of growth seen in the worst weather case, by number of sensors">${g}</svg>`;
  }
  function chartBars(rows, max) {
    const w = 380, rh = 30, l = 150, h = rows.length * rh + 4;
    let g = "";
    rows.forEach((row, i) => {
      const y = i * rh + 4, bw = (w - l - 44) * row.v / (max || 1);
      g += `<text class="lab" x="0" y="${y + 15}">${row.label}</text>`;
      g += `<rect class="bar" style="transition-delay:${0.15 + i * 0.12}s" x="${l}" y="${y + 3}" width="${Math.max(2, bw)}" height="16" rx="3" fill="${row.col}"/>`;
      g += `<text class="val pop" x="${l + Math.max(2, bw) + 6}" y="${y + 15}">${pctTxt(row.v)}</text>`;
    });
    return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img">${g}</svg>`;
  }
  function chartBeats() {
    const k = FACTS.plan_k1 - 1, c = S.curves;
    return chartBars([
      { label: "Our plan", v: c.optimum[k], col: "#0b3d91" },
      { label: "One at a time", v: c.greedy[k], col: "#8a96a3" },
      { label: "Best of 20 random", v: c.random[k], col: "#b4bdc6" },
      { label: "Deepest flow today", v: c.trunk[k], col: "#b4bdc6" },
      { label: "Most exposed alone", v: c.exposed[k], col: "#b4bdc6" },
    ], 1);
  }
  function chartHoldout() {
    const k = FACTS.plan_k1, w = 380, rh = 40, l = 118;
    let g = "";
    S.held_out.forEach((row, i) => {
      const y = i * rh + 2, a = row["seen_k" + k], b = row["unseen_k" + k], sc = (w - l - 44);
      const name = CASE_SHORT[i];
      g += `<text class="lab" x="0" y="${y + 17}">${name}</text>`;
      g += `<rect class="bar" style="transition-delay:${0.1 + i * 0.1}s" x="${l}" y="${y + 4}" width="${sc * a}" height="12" rx="2" fill="#0b3d91"/>`;
      g += `<text class="val pop" x="${l + sc * a + 5}" y="${y + 14}">${pctTxt(a)}</text>`;
      g += `<rect class="bar" style="transition-delay:${0.2 + i * 0.1}s" x="${l}" y="${y + 19}" width="${Math.max(2, sc * b)}" height="12" rx="2" fill="${b < a - 0.05 ? "#c2410c" : "#b4bdc6"}"/>`;
      g += `<text class="val pop" x="${l + Math.max(2, sc * b) + 5}" y="${y + 29}" style="fill:${b < a - 0.05 ? "#c2410c" : "#5b6670"}">${pctTxt(b)}</text>`;
    });
    const h = S.held_out.length * rh + 4;
    return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img">${g}</svg>
      <div class="legend"><span class="key"><i style="background:#0b3d91;border-radius:2px"></i>Planned with this case</span><span class="key"><i style="background:#c2410c;border-radius:2px"></i>Planned without it (grey: no change)</span></div>`;
  }
  function gaugeHtml() {
    return `<div class="gauge"><svg viewBox="0 0 120 170" aria-hidden="true">
      <rect x="30" y="4" width="60" height="150" rx="3" fill="#f4f6f8" stroke="#8a96a3" stroke-width="2"/>
      <rect x="4" y="132" width="112" height="24" rx="12" fill="#fff" stroke="#8a96a3" stroke-width="2"/>
      <rect id="gW" x="31" y="156" width="58" height="0" fill="#1d6fd8" opacity=".85"/>
      <line id="gR" x1="22" x2="98" y1="0" y2="0" stroke="#0b3d91" stroke-width="1.6" stroke-dasharray="4 3"/>
      <line id="gA" x1="22" x2="98" y1="0" y2="0" stroke="#c2410c" stroke-width="1.6" stroke-dasharray="4 3"/>
      <text id="gRt" x="100" y="0" font-size="9" fill="#0b3d91" font-weight="700">+${FACTS.rise_focus_mm}</text>
      <text id="gAt" x="100" y="0" font-size="9" fill="#c2410c" font-weight="700">${FACTS.alarm_mm}</text>
      <rect x="36" y="2" width="48" height="5" rx="2" fill="#5b6670"/></svg>
      <div class="read" id="gRead"></div></div>`;
  }

  function renderCard(sc, i) {
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
    let s = `<b>${S.focus_size} new homes at manhole ${CH[site].id}</b> (${CASE_SHORT[c].toLowerCase()}): `;
    if (!n25) return s + `no manhole rises ${FACTS.rise_focus_mm} mm${top ? `; the largest rise is ${top[1]} mm` : ""}. Growth this small here is not detectable by any sensor, so it does not count against the plan.`;
    s += `${n25} manhole${n25 > 1 ? "s" : ""} rise ${FACTS.rise_focus_mm} mm or more. `;
    if (hit.length) s += `<b class="hit">Seen by sensor ${phase1.indexOf(hit[0][0]) + 1}</b> (+${hit[0][1]} mm).`;
    else s += `<b class="miss">Not seen by the first five</b>${(() => { const h2 = seenBy(site, c, phase2).hit; return h2.length ? `; sensor ${phase2.indexOf(h2[0][0]) + 6} in phase 2 sees it (+${h2[0][1]} mm).` : "."; })()}`;
    return s;
  }

  const V = {}; // named views, resolved at scene entry so they follow the window size
  V.all = () => fit(ALL, { pad: 0.06 });
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
    title() {
      fx.reveal = 0; fx.revealT0 = performance.now();
      setLabels([{ x: N.x[S.outlet], y: N.y[S.outlet], html: "Where Walkerville's network ends", cls: "quiet", delay: 2600 }]);
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
        if (ro) ro.innerHTML = `<span class="casepill">${CASE_SHORT[c]}</span> ${CASE_NOTE[c]}<br><b>${b}</b> manholes over the ${FACTS.alarm_mm} mm alarm and <b>${s}</b> pipes running full, before any new home connects.`;
      };
      show(0);
      every(() => show(order[++k % order.length]), 2600);
      card.querySelectorAll(".seg button").forEach((b) => b.addEventListener("click", () => { clearTimers(); show(+b.dataset.case); }));
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
        if (ro) ro.innerHTML = `<span class="casepill">${CASE_SHORT[c]}</span> ${CASE_NOTE[c]} <b>${S.base_surcharged[String(c)].length}</b> pipes running full before any growth.`;
      };
      show(0); every(() => show(order[++k % order.length]), 3200);
      card.querySelectorAll(".seg button").forEach((b) => b.addEventListener("click", () => { clearTimers(); show(+b.dataset.case); }));
    },
    sees() {
      // the wet-weather sensor and the growth site that raises it most while it stays under the alarm
      const resp = S.response["1"];
      let sIdx = phase1[S.plan.roles.findIndex((r) => r.case === "Design wet")] ?? phase1[0], best = null;
      resp.forEach((l, site) => l.forEach(([i, mm]) => { if (i === sIdx && (!best || mm > best.mm)) best = { site, mm }; }));
      const base = S.base_depth["1"][sIdx];
      flyTo(fit(boxOf([sIdx, best.site], 260), { pitch: 60, bearing: -38, ve: 9, z: CH[sIdx].cover - 2, pad: 0.12, persp: 2.4 }), 1800);
      respond(best.site, 1);
      setLabels([{ ch: best.site, html: `+${S.focus_size} homes`, cls: "growth", dy: -10 }, { ch: sIdx, html: `Sensor ${phase1.indexOf(sIdx) + 1}`, cls: "accent", dy: -12 }]);
      const normal = base * 1000, rise = best.mm, alarm = FACTS.alarm_mm, thr = FACTS.rise_focus_mm;
      const maxMM = Math.max(220, Math.ceil((normal + rise + 60) / 50) * 50);
      const yOf = (mm) => 154 - mm * 150 / maxMM;
      const gR = $("gR"), gA = $("gA"), gW = $("gW");
      const set = (el, mm) => { el.setAttribute("y1", yOf(mm)); el.setAttribute("y2", yOf(mm)); };
      set(gR, normal + thr); set(gA, alarm);
      $("gRt").setAttribute("y", yOf(normal + thr) + 3); $("gAt").setAttribute("y", yOf(alarm) + 3);
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
    clearTimers(); fx.onPick = null; fx.laterals = null; fx.chamberPop = 0; fx.drift = 0; fx.widthTarget = 1; fx.reveal = 1;
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
  SCENES.forEach((s, i) => { if (!acts.length || acts[acts.length - 1].name !== s.act) acts.push({ name: s.act, first: i, n: 0 }); acts[acts.length - 1].n++; });
  $("acts").innerHTML = acts.map((a, k) => `<button class="act-seg" type="button" style="--n:${a.n}" data-k="${k}" aria-label="${a.name}"><span>${a.name}</span><i></i></button>`).join("");
  $("acts").querySelectorAll(".act-seg").forEach((b) => b.addEventListener("click", () => enter(acts[+b.dataset.k].first)));
  function updateBar() {
    $("count").textContent = String(cur + 1).padStart(2, "0") + " / " + SCENES.length;
    $("prev").disabled = cur === 0; $("next").disabled = cur === SCENES.length - 1;
    $("acts").querySelectorAll(".act-seg").forEach((b, k) => {
      const a = acts[k], done = Math.max(0, Math.min(a.n, cur - a.first + 1));
      b.querySelector("i").style.width = (100 * done / a.n) + "%";
      b.classList.toggle("cur", cur >= a.first && cur < a.first + a.n);
    });
  }
  $("prev").addEventListener("click", () => enter(cur - 1));
  $("next").addEventListener("click", () => enter(cur + 1));
  document.addEventListener("keydown", (e) => {
    if (e.target.closest && e.target.closest("input, select, textarea")) return;
    const k = e.key;
    if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(k)) { e.preventDefault(); enter(cur + 1); }
    else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(k)) { e.preventDefault(); enter(cur - 1); }
    else if (k === "Home") enter(0);
    else if (k === "End") enter(SCENES.length - 1);
    else if (k === "f" || k === "F") { if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); else document.exitFullscreen(); }
  });
  let wheelAcc = 0, wheelLock = 0, wheelIdle = 0;
  window.addEventListener("wheel", (e) => {
    if (e.target.closest && e.target.closest(".card") && card.scrollHeight > card.clientHeight + 2) return;
    e.preventDefault();
    const now = performance.now();
    clearTimeout(wheelIdle); wheelIdle = setTimeout(() => { wheelAcc = 0; wheelLock = 0; }, 260);
    if (wheelLock) return;
    wheelAcc += e.deltaY + e.deltaX;
    if (Math.abs(wheelAcc) > 70) { enter(cur + (wheelAcc > 0 ? 1 : -1)); wheelAcc = 0; wheelLock = now; }
  }, { passive: false });
  let touch = null;
  window.addEventListener("touchstart", (e) => { const t = e.touches[0]; touch = { x: t.clientX, y: t.clientY, t: performance.now() }; }, { passive: true });
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
  function loop(now) {
    const dt = Math.min(64, now - last); last = now;
    stepCamera(now); stepLayers(dt); frameDt = dt;
    if (fx.reveal < 1) fx.reveal = Math.min(1, (now - fx.revealT0) / 2600);
    if (fx.drift && !tween) cam.bearing += Math.sin((now - sceneT0) / 5200) * 0.00022 * dt;
    draw(now);
    requestAnimationFrame(loop);
  }
  window.addEventListener("resize", () => { clearTimeout(resize.t); resize.t = setTimeout(resize, 120); });
  resize();
  const start = Math.max(0, SCENES.findIndex((s) => "#" + s.id === location.hash));
  enter(start, true);
  requestAnimationFrame(loop);
  setTimeout(() => $("loading").classList.add("done"), 60);
  window.__story = { enter, cam, L, fx, scenes: SCENES, get cur() { return cur; } }; // for the smoke test
})();
