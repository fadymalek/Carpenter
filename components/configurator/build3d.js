import * as THREE from "three";

/* ============================================================== *
 *  HEWN & OAK — 3D modeling engine
 *  Detailed-but-clean parametric models for kitchens and desks.
 *  Built from reusable blocks: carcasses, shaker doors, handles,
 *  worktops, plus modelled appliances (fridge / oven / hob / hood /
 *  sink + tap) and desk hardware (legs, pedestals, monitor, grommet).
 *  Units are metres (cm / 100). Each builder receives an empty
 *  THREE.Group `model`; the caller centres + frames it.
 * ============================================================== */

/* colour lookups (kept local so this module has no UI dependency) */
const WOOD = { oak: "#C49A6C", walnut: "#5C3B22", ash: "#D6C5A6", espresso: "#3B2A1E", white: "#ECE7DD", charcoalw: "#34302B", sage: "#8C9281", navy: "#33414F" };
const COUNTER = { quartzw: "#ECEAE4", granite: "#2B2B2D", butcher: "#B0793F", marble: "#E7E3DB", concrete: "#9C988F" };
const SPLASH = { tile: "#DCD3C4", glass: "#CAD6D2", stone: "#BDB4A6", none: null };
const TOP = { oak: "#C49A6C", walnut: "#5C3B22", ash: "#D6C5A6", white: "#ECE7DD", blacklam: "#26252A", bamboo: "#CDB386" };
const STONE_IDS = ["quartzw", "granite", "marble"];

const STEEL = "#C7CACC";
const DARKGLASS = "#1A1A1E";
const HANDLE_DK = "#2A2724";

/* ============================================================== *
 *  Procedural material textures (drawn once, cached by colour).
 *  Gives real wood grain ("السمرة"), painted-MDF lacquer, and
 *  stone veining/speckle so finishes read like Egyptian-market
 *  MDF, melamine, quartz, granite and marble — not flat plastic.
 * ============================================================== */

/* which finish a raw hex colour represents (keys are lowercase, no #) */
const GRAIN_BY_HEX = { c49a6c: "oak", "5c3b22": "walnut", d6c5a6: "ash", "3b2a1e": "espresso", cdb386: "bamboo", b0793f: "butcher" };
const PAINTED_HEX = new Set(["ece7dd", "34302b", "8c9281", "33414f", "26252a"]);
const STONE_BY_HEX = { eceae4: "quartz", "2b2b2d": "granite", e7e3db: "marble", "9c988f": "concrete", bdb4a6: "stone" };
const TILE_HEX = new Set(["dcd3c4"]);
const hexOf = (c) => new THREE.Color(c).getHexString();

const _hasDoc = typeof document !== "undefined";
const _texCache = new Map();
const _canvas = (s) => { const c = document.createElement("canvas"); c.width = c.height = s; return c; };
const _seedRand = (seed) => { let x = seed >>> 0 || 1; return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; }; };
const _clamp255 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v) | 0;

function _canvasTex(canvas, srgb) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  if (srgb && "sRGBEncoding" in THREE) t.encoding = THREE.sRGBEncoding;
  t.needsUpdate = true;
  return t;
}

/* derive a tangent-space normal map from a height (uses red channel) */
function _normalFrom(srcCanvas, strength) {
  const S = srcCanvas.width;
  const src = srcCanvas.getContext("2d").getImageData(0, 0, S, S).data;
  const out = _canvas(S), octx = out.getContext("2d"), od = octx.createImageData(S, S);
  const H = (x, y) => src[(((y + S) % S) * S + ((x + S) % S)) * 4] / 255;
  let i = 0;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = (H(x - 1, y) - H(x + 1, y)) * strength;
      const dy = (H(x, y - 1) - H(x, y + 1)) * strength;
      const len = Math.hypot(dx, dy, 1) || 1;
      od.data[i] = _clamp255((dx / len * 0.5 + 0.5) * 255);
      od.data[i + 1] = _clamp255((dy / len * 0.5 + 0.5) * 255);
      od.data[i + 2] = _clamp255((1 / len * 0.5 + 0.5) * 255);
      od.data[i + 3] = 255;
      i += 4;
    }
  }
  octx.putImageData(od, 0, 0);
  return out;
}

/* natural wood: wavy vertical grain + fine fibre noise */
function woodTextures(hex) {
  const key = "wood:" + hex;
  if (_texCache.has(key)) return _texCache.get(key);
  const S = 512, cc = _canvas(S), ctx = cc.getContext("2d"), hc = _canvas(S), hx = hc.getContext("2d");
  const base = new THREE.Color("#" + hex);
  const br = base.r * 255, bg = base.g * 255, bb = base.b * 255;
  const img = ctx.createImageData(S, S), hd = hx.createImageData(S, S);
  const rnd = _seedRand(parseInt(hex, 16));
  let i = 0;
  for (let y = 0; y < S; y++) {
    const warp = Math.sin(y * 0.013) * 6 + Math.sin(y * 0.061 + 1.3) * 2.4;
    for (let x = 0; x < S; x++) {
      const xx = x + warp;
      let ring = Math.sin(xx * 0.20 + Math.sin(xx * 0.018) * 3.0); // -1..1
      ring = (ring + 1) * 0.5;
      const grain = Math.pow(ring, 1.7);                            // sharpen to thin figure
      const noise = (rnd() - 0.5) * 0.07;
      const s = 0.82 + grain * 0.30 + noise;                        // ~0.78..1.16
      img.data[i] = _clamp255(br * s); img.data[i + 1] = _clamp255(bg * s); img.data[i + 2] = _clamp255(bb * s); img.data[i + 3] = 255;
      const hv = _clamp255(grain * 255);
      hd.data[i] = hv; hd.data[i + 1] = hv; hd.data[i + 2] = hv; hd.data[i + 3] = 255;
      i += 4;
    }
  }
  ctx.putImageData(img, 0, 0); hx.putImageData(hd, 0, 0);
  const res = { map: _canvasTex(cc, true), normalMap: _canvasTex(_normalFrom(hc, 2.2), false) };
  _texCache.set(key, res);
  return res;
}

/* stone surfaces: quartz / granite / marble / concrete / generic slab */
function stoneTextures(hex, type) {
  const key = "stone:" + hex;
  if (_texCache.has(key)) return _texCache.get(key);
  const S = 512, cc = _canvas(S), ctx = cc.getContext("2d");
  const rnd = _seedRand(parseInt(hex, 16) ^ 0x9e37);
  ctx.fillStyle = "#" + hex; ctx.fillRect(0, 0, S, S);

  if (type === "granite") {
    const cols = ["#1c1c1f", "#3a3a3f", "#6b6b72", "#9a8f86", "#c9c2bb"];
    for (let n = 0; n < 14000; n++) {
      ctx.fillStyle = cols[(rnd() * cols.length) | 0];
      ctx.globalAlpha = 0.35 + rnd() * 0.5;
      const r = 0.6 + rnd() * 2.2;
      ctx.beginPath(); ctx.arc(rnd() * S, rnd() * S, r, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else if (type === "quartz") {
    for (let n = 0; n < 5000; n++) {
      const g = 150 + (rnd() * 90) | 0;
      ctx.fillStyle = `rgba(${g},${g},${g - 8},${0.12 + rnd() * 0.18})`;
      ctx.beginPath(); ctx.arc(rnd() * S, rnd() * S, 0.5 + rnd() * 1.1, 0, 6.283); ctx.fill();
    }
  } else if (type === "concrete") {
    for (let n = 0; n < 60; n++) {
      const x = rnd() * S, y = rnd() * S, r = 40 + rnd() * 130;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const d = rnd() > 0.5 ? 1 : -1, a = 0.05 + rnd() * 0.06;
      g.addColorStop(0, `rgba(${d > 0 ? 255 : 0},${d > 0 ? 255 : 0},${d > 0 ? 255 : 0},${a})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
    }
    for (let n = 0; n < 1200; n++) { ctx.fillStyle = `rgba(40,40,40,${rnd() * 0.18})`; ctx.beginPath(); ctx.arc(rnd() * S, rnd() * S, rnd() * 0.9, 0, 6.283); ctx.fill(); }
  } else {
    // marble / generic slab: soft flowing veins
    const veinC = type === "stone" ? "rgba(120,110,96," : "rgba(150,150,158,";
    for (let v = 0; v < 9; v++) {
      ctx.strokeStyle = veinC + (0.10 + rnd() * 0.22) + ")";
      ctx.lineWidth = 0.6 + rnd() * 2.4;
      ctx.beginPath();
      let x = rnd() * S, y = -10;
      ctx.moveTo(x, y);
      while (y < S + 10) { x += (rnd() - 0.5) * 60; y += 18 + rnd() * 26; ctx.quadraticCurveTo(x + (rnd() - 0.5) * 40, y - 12, x, y); }
      ctx.stroke();
    }
    for (let n = 0; n < 2500; n++) { const g = (rnd() * 255) | 0; ctx.fillStyle = `rgba(${g},${g},${g},${rnd() * 0.05})`; ctx.fillRect(rnd() * S, rnd() * S, 1, 1); }
  }

  const strength = type === "granite" ? 1.6 : type === "concrete" ? 1.5 : type === "quartz" ? 0.5 : 0.9;
  const res = { map: _canvasTex(cc, true), normalMap: _canvasTex(_normalFrom(cc, strength), false) };
  _texCache.set(key, res);
  return res;
}

/* ceramic backsplash tile with grout lines */
function tileTextures(hex) {
  const key = "tile:" + hex;
  if (_texCache.has(key)) return _texCache.get(key);
  const S = 512, n = 4, cell = S / n, cc = _canvas(S), ctx = cc.getContext("2d");
  const rnd = _seedRand(parseInt(hex, 16) ^ 0x55);
  ctx.fillStyle = "#9b8f7c"; ctx.fillRect(0, 0, S, S); // grout
  const base = new THREE.Color("#" + hex);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const sh = 0.93 + rnd() * 0.12;
    ctx.fillStyle = `rgb(${_clamp255(base.r * 255 * sh)},${_clamp255(base.g * 255 * sh)},${_clamp255(base.b * 255 * sh)})`;
    ctx.fillRect(c * cell + 3, r * cell + 3, cell - 6, cell - 6);
  }
  const res = { map: _canvasTex(cc, true), normalMap: _canvasTex(_normalFrom(cc, 3.0), false) };
  _texCache.set(key, res);
  return res;
}

/* ---------------- material + primitive helpers ---------------- */
function pbr(color, o = {}) {
  const col = new THREE.Color(color);
  if (o.glass) return new THREE.MeshStandardMaterial({ color: col, roughness: 0.08, metalness: 0.25, envMapIntensity: 1.0 });
  if (o.metal) return new THREE.MeshStandardMaterial({ color: col, roughness: o.rough ?? 0.32, metalness: 0.95, envMapIntensity: 1.15 });

  const hx = hexOf(color);

  // stone worktops / slabs
  const stoneType = o.stone ? (STONE_BY_HEX[hx] || "quartz") : STONE_BY_HEX[hx];
  if (stoneType) {
    const m = new THREE.MeshPhysicalMaterial({
      color: col, metalness: 0.0, envMapIntensity: 1.0,
      roughness: stoneType === "granite" ? 0.4 : stoneType === "concrete" ? 0.72 : 0.22,
      clearcoat: stoneType === "concrete" ? 0.0 : 0.6, clearcoatRoughness: 0.25,
    });
    if (_hasDoc) { const t = stoneTextures(hx, stoneType); m.map = t.map; m.normalMap = t.normalMap; m.normalScale = new THREE.Vector2(0.4, 0.4); }
    return m;
  }

  // ceramic tile backsplash
  if (TILE_HEX.has(hx)) {
    const m = new THREE.MeshStandardMaterial({ color: col, roughness: 0.45, metalness: 0.0, envMapIntensity: 0.8 });
    if (_hasDoc) { const t = tileTextures(hx); m.map = t.map; m.normalMap = t.normalMap; m.normalScale = new THREE.Vector2(0.6, 0.6); }
    return m;
  }

  // natural wood (oak / walnut / ash / espresso / bamboo / butcher block)
  const grain = GRAIN_BY_HEX[hx];
  if (grain) {
    const gl = o.gloss;
    const m = new THREE.MeshPhysicalMaterial({
      color: col, metalness: 0.0, envMapIntensity: gl ? 1.0 : 0.7,
      roughness: gl ? 0.3 : 0.62, clearcoat: gl ? 0.9 : 0.12, clearcoatRoughness: gl ? 0.1 : 0.5,
    });
    if (_hasDoc) { const t = woodTextures(hx); m.map = t.map; m.normalMap = t.normalMap; const s = gl ? 0.45 : 0.85; m.normalScale = new THREE.Vector2(s, s); }
    return m;
  }

  // painted MDF / laminate (white, charcoal, sage, navy, black laminate)
  if (PAINTED_HEX.has(hx)) {
    const gl = o.gloss;
    return new THREE.MeshPhysicalMaterial({
      color: col, metalness: 0.0,
      roughness: gl ? 0.16 : 0.5, clearcoat: gl ? 1.0 : 0.25, clearcoatRoughness: gl ? 0.06 : 0.4,
      envMapIntensity: gl ? 1.25 : 0.7,
    });
  }

  // fallback (toe kicks, neutrals)
  return new THREE.MeshStandardMaterial({ color: col, roughness: 0.82, metalness: 0.04, envMapIntensity: 0.6 });
}
function box(w, h, d, color, o = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), pbr(color, o));
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function put(parent, mesh, x, y, z) { mesh.position.set(x, y, z); parent.add(mesh); return mesh; }
function cyl(r, h, color, o = {}, seg = 20) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), pbr(color, o));
  m.castShadow = true; m.receiveShadow = true; return m;
}

/* ---------------- shaker door + handle ---------------- */
function addHandle(parent, style, x, y, frontZ, vertical) {
  if (style === "edge" || style === "recessed") return;
  if (style === "knob") {
    const k = cyl(0.016, 0.028, HANDLE_DK, { metal: true, rough: 0.4 }, 16);
    k.rotation.x = Math.PI / 2;
    put(parent, k, x, y, frontZ + 0.014);
    return;
  }
  const bar = vertical ? box(0.016, 0.12, 0.02, HANDLE_DK, { metal: true, rough: 0.4 })
    : box(0.12, 0.016, 0.02, HANDLE_DK, { metal: true, rough: 0.4 });
  put(parent, bar, x, y, frontZ + 0.014);
}
function addDoor(parent, fw, fh, cx, cy, frontZ, color, o, handle, vertical, style = "shaker") {
  if (style === "flat" || style === "slab") {
    // single flat front (handleless modern / slab)
    put(parent, box(fw - 0.014, fh - 0.014, 0.02, color, o), cx, cy, frontZ + 0.011);
  } else if (style === "glass" && fw > 0.16 && fh > 0.16) {
    // framed glass door (display cabinet)
    put(parent, box(fw - 0.014, fh - 0.014, 0.02, color, o), cx, cy, frontZ + 0.011);
    put(parent, box(fw - 0.10, fh - 0.10, 0.012, "#2A3438", { glass: true }), cx, cy, frontZ + 0.016);
  } else {
    // shaker: proud frame + recessed centre
    put(parent, box(fw - 0.018, fh - 0.018, 0.02, color, o), cx, cy, frontZ + 0.011);
    if (fw > 0.18 && fh > 0.18)
      put(parent, box(fw - 0.13, fh - 0.13, 0.012, color, o), cx, cy, frontZ + 0.005);
  }
  const hx = vertical ? cx + fw * 0.34 : cx;
  const hy = vertical ? cy : cy + fh * 0.34;
  addHandle(parent, handle, hx, hy, frontZ + 0.011, vertical);
}

/* ---------------- one base cabinet: detailed carcass + face ---------------- */
const UNIT_DEFAULT_W = { door: 60, doors2: 90, drawers: 60, open: 60, sink: 90, oven: 60, dishwasher: 60 };
function addCarcass(ug, w, D, bodyH, baseY, col, o) {
  const t = 0.018;
  put(ug, box(w, bodyH, t, col, o), 0, baseY + bodyH / 2, t / 2);                 // back panel
  put(ug, box(t, bodyH, D, col, o), -w / 2 + t / 2, baseY + bodyH / 2, D / 2);    // left gable
  put(ug, box(t, bodyH, D, col, o), w / 2 - t / 2, baseY + bodyH / 2, D / 2);     // right gable
  put(ug, box(w - 2 * t, t, D - t, col, o), 0, baseY + t / 2, D / 2);             // bottom panel
  put(ug, box(w - 2 * t, t, 0.09, col, o), 0, baseY + bodyH - t / 2, 0.06);       // top front rail
  put(ug, box(w - 2 * t, t, 0.09, col, o), 0, baseY + bodyH - t / 2, D - 0.05);   // top back rail
}
function addBaseUnit(ug, o) {
  const { kind, w, D, bodyH, baseY, topY, woodC, gloss, handle, lowerStyle, counterC, stone, shelves, drawers } = o;
  if (kind === "gap") return; // empty space / knee gap — reserves width, draws nothing
  addCarcass(ug, w, D, bodyH, baseY, woodC, { gloss });
  const fz = D;
  if (kind === "drawers" || kind === "file") {
    const n = kind === "file" ? 2 : Math.max(1, Math.min(6, drawers || (bodyH > 0.7 ? 4 : 3))), fh = (bodyH - 0.02) / n;
    for (let i = 0; i < n; i++) addDoor(ug, w - 0.01, fh - 0.012, 0, baseY + 0.01 + fh / 2 + i * fh, fz, woodC, { gloss }, handle, false, lowerStyle);
  } else if (kind === "open") {
    const n = Math.max(1, Math.min(5, shelves || 2));
    for (let i = 1; i <= n; i++) put(ug, box(w - 0.045, 0.02, D - 0.05, woodC, { gloss }), 0, baseY + (bodyH / (n + 1)) * i, D / 2);
  } else if (kind === "sink") {
    const half = (w - 0.01) / 2;
    addDoor(ug, half, bodyH, -half / 2, baseY + bodyH / 2, fz, woodC, { gloss }, handle, true, lowerStyle);
    addDoor(ug, half, bodyH, half / 2, baseY + bodyH / 2, fz, woodC, { gloss }, handle, true, lowerStyle);
    addSink(ug, 0, D, topY, counterC, stone);
  } else if (kind === "oven") {
    addOven(ug, 0, D); addHob(ug, 0, D, topY); addHood(ug, 0, D, woodC, gloss);
    addDoor(ug, w - 0.01, 0.16, 0, baseY + 0.09, fz, woodC, { gloss }, handle, false, lowerStyle);
  } else if (kind === "dishwasher") {
    put(ug, box(w - 0.012, bodyH - 0.012, 0.02, woodC, { gloss }), 0, baseY + bodyH / 2, fz + 0.011);
    put(ug, box(w - 0.1, 0.02, 0.024, "#2A2724", { metal: true }), 0, baseY + bodyH - 0.06, fz + 0.02);
  } else { // door
    if (w > 0.62) {
      const half = (w - 0.01) / 2;
      addDoor(ug, half, bodyH, -half / 2, baseY + bodyH / 2, fz, woodC, { gloss }, handle, true, lowerStyle);
      addDoor(ug, half, bodyH, half / 2, baseY + bodyH / 2, fz, woodC, { gloss }, handle, true, lowerStyle);
    } else {
      const drwH = 0.14;
      addDoor(ug, w - 0.01, drwH, 0, baseY + bodyH - drwH / 2 - 0.01, fz, woodC, { gloss }, handle, false, lowerStyle);
      addDoor(ug, w - 0.01, bodyH - drwH - 0.02, 0, baseY + (bodyH - drwH) / 2 - 0.01, fz, woodC, { gloss }, handle, true, lowerStyle);
    }
  }
}

/* ---------------- room shell (floor + corner walls) ---------------- */
function buildRoom(parent, RW, RL, RH) {
  const g = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(RW + 1.2, RL + 1.2), pbr("#E6DDCD", { floor: true }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(RW / 2, -0.003, RL / 2); floor.receiveShadow = true; g.add(floor);
  const wallMat = pbr("#EFE9DF", { wall: true });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(RW, RH), wallMat);
  back.position.set(RW / 2, RH / 2, -0.01); back.receiveShadow = true; g.add(back);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(RL, RH), wallMat);
  left.rotation.y = Math.PI / 2; left.position.set(-0.01, RH / 2, RL / 2); left.receiveShadow = true; g.add(left);
  parent.add(g);
  return g;
}

/* ---------------- cabinet run (absolute widths, laid from the corner) ---------------- */
function addCabinetRun(parent, o) {
  const g = new THREE.Group();
  const { depth: D, units, nUpper, woodC, counterC, splashC, gloss, handle, stone, skipUpperAt, doorStyle = "shaker", led, selectedId } = o;
  const lowerStyle = doorStyle === "glass" ? "shaker" : doorStyle;
  const KICK = 0.1, H = 0.9, gap = 0.004, topY = H;
  const list = units && units.length ? units : [{ kind: "door", w: 60 }];
  const bodyH = H - KICK;

  // lay units left -> right at their real widths, starting at the corner (x = 0)
  let cursor = 0;
  list.forEach((u, i) => {
    const uw = (u.w || 60) / 100;
    const cx = cursor + uw / 2;
    const ug = new THREE.Group();
    ug.position.x = cx;
    ug.userData = { unitId: u.id, unitIndex: i, pickable: true };
    addBaseUnit(ug, { kind: u.kind, w: uw - gap, D, bodyH, baseY: KICK, topY, woodC, gloss, handle, lowerStyle, counterC, stone, shelves: u.shelves, drawers: u.drawers });
    if (selectedId && u.id === selectedId) {
      const eg = new THREE.EdgesGeometry(new THREE.BoxGeometry(uw - gap + 0.02, bodyH + 0.04, D + 0.04));
      const ls = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color: 0xB0794A }));
      ls.position.set(0, KICK + bodyH / 2, D / 2);
      ug.add(ls);
    }
    g.add(ug);
    cursor += uw;
  });
  const runLen = Math.max(cursor, 0.3);

  // continuous plinth (toe kick)
  put(g, box(runLen - 0.02, KICK, D - 0.07, "#262320"), runLen / 2, KICK / 2, D / 2 - 0.02);

  // worktop with overhang + slim front fascia
  if (counterC) {
    put(g, box(runLen + 0.02, 0.04, D + 0.035, counterC, { stone, gloss: !stone }), runLen / 2, H + 0.02, D / 2 + 0.005);
    put(g, box(runLen + 0.02, 0.018, 0.012, counterC, { stone, gloss: !stone }), runLen / 2, H + 0.001, D + 0.022);
  }
  // backsplash
  if (splashC) put(g, box(runLen, 0.5, 0.018, splashC, {}), runLen / 2, H + 0.04 + 0.25, 0.009);

  // upper carcasses + doors + cornice + LED
  if (nUpper > 0) {
    const Du = 0.34, Hu = 0.72, yb = 1.5;
    const m = nUpper, segWu = (runLen - gap * (m - 1)) / m;
    for (let i = 0; i < m; i++) {
      if (skipUpperAt != null && i === skipUpperAt) continue;
      const x = segWu / 2 + i * (segWu + gap);
      put(g, box(segWu - 0.006, Hu, Du, woodC, { gloss }), x, yb + Hu / 2, Du / 2);
      addDoor(g, segWu - 0.01, Hu, x, yb + Hu / 2, Du, woodC, { gloss }, handle, true, doorStyle);
    }
    put(g, box(runLen, 0.04, Du + 0.03, woodC, { gloss }), runLen / 2, yb + Hu + 0.02, Du / 2); // cornice
    if (led) {
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(runLen - 0.08, 0.018, 0.05),
        new THREE.MeshStandardMaterial({ color: 0xfff3da, emissive: 0xffe6b8, emissiveIntensity: 1.4, roughness: 0.5 })
      );
      put(g, strip, runLen / 2, yb - 0.02, 0.07);
    }
  }
  g.userData.runLen = runLen;
  parent.add(g);
  return g;
}

/* ---------------- modelled appliances ---------------- */
function makeFridge(woodGloss) {
  const g = new THREE.Group();
  const W = 0.62, H = 1.9, D = 0.62;
  put(g, box(W, H, D, STEEL, { metal: true, rough: 0.28 }), 0, H / 2, 0);
  // door split + recessed faces
  put(g, box(W - 0.06, H * 0.6 - 0.02, 0.012, "#B9BCBE", { metal: true }), 0, H * 0.7, D / 2 + 0.006);
  put(g, box(W - 0.06, H * 0.4 - 0.02, 0.012, "#B9BCBE", { metal: true }), 0, H * 0.2, D / 2 + 0.006);
  // vertical bar handles
  put(g, box(0.022, H * 0.5, 0.03, HANDLE_DK, { metal: true }), -W / 2 + 0.06, H * 0.7, D / 2 + 0.03);
  put(g, box(0.022, H * 0.32, 0.03, HANDLE_DK, { metal: true }), -W / 2 + 0.06, H * 0.2, D / 2 + 0.03);
  return g;
}
function addOven(parent, x, D) {
  // built-in oven occupying lower cabinet face: dark glass door + control panel + bar handle
  const g = new THREE.Group();
  put(g, box(0.56, 0.5, 0.02, DARKGLASS, { glass: true }), 0, 0.4, D + 0.012);
  put(g, box(0.56, 0.08, 0.022, "#2C2A28", { metal: true }), 0, 0.72, D + 0.013); // controls
  put(g, box(0.4, 0.022, 0.026, STEEL, { metal: true }), 0, 0.62, D + 0.024);     // handle
  // knobs
  for (let i = -1; i <= 1; i++) put(g, cyl(0.012, 0.018, "#3A3835", { metal: true }, 14), x * 0 + i * 0.12, 0.72, D + 0.026).rotation.x = Math.PI / 2;
  parent.add(g); g.position.x = x; return g;
}
function addHob(parent, x, D, topY) {
  const g = new THREE.Group();
  put(g, box(0.56, 0.012, 0.46, DARKGLASS, { glass: true }), 0, topY + 0.028, D / 2);
  const off = [[-0.13, -0.1], [0.13, -0.1], [-0.13, 0.12], [0.13, 0.12]];
  off.forEach(([dx, dz]) => {
    const ring = cyl(0.05, 0.004, "#3A3A3D", { metal: true }, 24);
    put(g, ring, dx, topY + 0.036, D / 2 + dz);
  });
  parent.add(g); g.position.x = x; return g;
}
function addHood(parent, x, D, woodC, gloss) {
  const g = new THREE.Group();
  put(g, box(0.6, 0.12, 0.42, STEEL, { metal: true, rough: 0.3 }), 0, 1.62, D / 2);
  // tapered chimney
  const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 0.5, 4), pbr(STEEL, { metal: true, rough: 0.3 }));
  ch.rotation.y = Math.PI / 4; ch.castShadow = true;
  put(g, ch, 0, 1.95, D / 2 - 0.02);
  parent.add(g); g.position.x = x; return g;
}
function addSink(parent, x, D, topY, counterC, stone) {
  const g = new THREE.Group();
  // basin rim flush in counter + recessed interior
  put(g, box(0.5, 0.012, 0.42, "#9DA0A2", { metal: true }), 0, topY + 0.026, D / 2);
  put(g, box(0.42, 0.1, 0.34, "#7E8183", { metal: true, rough: 0.5 }), 0, topY - 0.02, D / 2); // bowl
  // tap: riser + curved spout
  put(g, cyl(0.014, 0.26, "#B9BCBE", { metal: true }, 16), 0, topY + 0.14, D - 0.07);
  const spout = cyl(0.013, 0.16, "#B9BCBE", { metal: true }, 16);
  spout.rotation.x = Math.PI / 2; put(g, spout, 0, topY + 0.26, D - 0.13);
  parent.add(g); g.position.x = x; return g;
}
function addMicrowave(parent, x, yb, Du) {
  const g = new THREE.Group();
  put(g, box(0.46, 0.3, Du - 0.02, "#2A2825", { gloss: true }), 0, yb + 0.16, Du / 2);
  put(g, box(0.3, 0.24, 0.012, DARKGLASS, { glass: true }), -0.06, yb + 0.16, Du / 2 + 0.008);
  put(g, box(0.022, 0.2, 0.02, STEEL, { metal: true }), 0.16, yb + 0.16, Du / 2 + 0.012);
  parent.add(g); g.position.x = x; return g;
}

/* default modular run when a saved layout isn't supplied */
export function defaultKitchenUnits(n = 5) {
  const kinds = ["drawers", "sink", "door", "oven", "door", "drawers", "door", "door"];
  const out = [];
  for (let i = 0; i < Math.max(2, n); i++) out.push({ id: "u" + i + "_" + Math.random().toString(36).slice(2, 7), kind: kinds[i % kinds.length], w: 60 });
  return out;
}

/* ============================ KITCHEN ============================ */
export function buildKitchen(model, cfg) {
  const D = cfg.kD / 100;
  const woodC = WOOD[cfg.wood] || WOOD.oak;
  const counterC = COUNTER[cfg.counter] || COUNTER.quartzw;
  const splashC = cfg.backsplash === "none" ? null : SPLASH[cfg.backsplash];
  const stone = STONE_IDS.includes(cfg.counter);
  const gloss = cfg.gloss;

  const units = (cfg.kUnits && cfg.kUnits.length) ? cfg.kUnits : defaultKitchenUnits(cfg.kLower || 5);
  const sumW = units.reduce((a, u) => a + (u.w || 60), 0);
  const doorStyle = cfg.doorStyle || "shaker";
  const lowerStyle = doorStyle === "glass" ? "shaker" : doorStyle;
  const led = !!cfg.led;

  // reserve the upper slot above the oven unit for the hood
  let skipUpperAt = null;
  const ovenIdx = units.findIndex((u) => u.kind === "oven");
  if (ovenIdx >= 0 && cfg.kUpper > 0) {
    let acc = 0; for (let k = 0; k < ovenIdx; k++) acc += (units[k].w || 60);
    const f = (acc + (units[ovenIdx].w || 60) / 2) / sumW;
    skipUpperAt = Math.max(0, Math.min(cfg.kUpper - 1, Math.round(f * cfg.kUpper - 0.5)));
  }

  // main run laid along the back wall, starting at the corner (x = 0)
  const main = addCabinetRun(model, {
    depth: D, units, nUpper: cfg.kUpper, woodC, counterC, splashC,
    gloss, handle: cfg.handle, stone, doorStyle, led, skipUpperAt, selectedId: cfg.selectedUnit,
  });
  const runLen = main.userData.runLen;
  main.position.set(0, 0, 0);

  // the room — wall is at least as long as the run
  const RW = Math.max((cfg.kW || 360) / 100, runLen);
  const RL = (cfg.roomL || 320) / 100;
  const RH = (cfg.kH || 270) / 100;
  buildRoom(model, RW, RL, RH);

  // appliances / extras anchored to the back wall, to the right of the run
  let rightX = runLen;
  if (cfg.kTall || cfg.pantry) {
    const tallCount = (cfg.kTall ? 1 : 0) + (cfg.pantry ? 1 : 0);
    for (let i = 0; i < tallCount; i++) {
      const x = rightX + 0.3;
      put(model, box(0.6, 2.1, D, woodC, { gloss }), x, 1.05, D / 2);
      addDoor(model, 0.58, 1.0, x, 1.55, D, woodC, { gloss }, cfg.handle, true, doorStyle);
      addDoor(model, 0.58, 0.95, x, 0.55, D, woodC, { gloss }, cfg.handle, true, lowerStyle);
      rightX += 0.6;
    }
  }
  if (cfg.fridge) { put(model, makeFridge(gloss), rightX + 0.34, 0, D / 2); rightX += 0.7; }

  if (cfg.microwave) addMicrowave(model, Math.min(runLen * 0.86, runLen - 0.3), 1.5, 0.34);

  // wall open shelves above the run
  if (cfg.openShelf) {
    put(model, box(0.85, 0.04, 0.26, woodC, { gloss }), runLen * 0.3, 1.78, 0.13);
    put(model, box(0.85, 0.04, 0.26, woodC, { gloss }), runLen * 0.3, 2.05, 0.13);
  }

  // island with a waterfall worktop + seating overhang
  if (cfg.kIsland) {
    const iw = Math.min(runLen * 0.6, 1.7), id = 0.95;
    const ig = new THREE.Group();
    put(ig, box(iw, 0.9, id - 0.25, woodC, { gloss }), 0, 0.45, -0.05);
    addDoor(ig, iw * 0.45, 0.8, -iw * 0.24, 0.46, id - 0.25, woodC, { gloss }, cfg.handle, true, lowerStyle);
    addDoor(ig, iw * 0.45, 0.8, iw * 0.24, 0.46, id - 0.25, woodC, { gloss }, cfg.handle, true, lowerStyle);
    put(ig, box(iw + 0.05, 0.05, id, counterC, { stone, gloss: !stone }), 0, 0.925, 0.02);
    put(ig, box(0.05, 0.92, id - 0.24, counterC, { stone, gloss: !stone }), -iw / 2, 0.46, -0.04);
    put(ig, box(0.05, 0.92, id - 0.24, counterC, { stone, gloss: !stone }), iw / 2, 0.46, -0.04);
    ig.position.set(runLen / 2, 0, Math.min(D + 1.4, RL - 0.7));
    model.add(ig);
  }

  // camera focus = centre of the room
  model.userData.focus = { cx: RW / 2, cy: RH * 0.45, cz: RL * 0.5, radius: Math.max(RW, RL, RH) * 1.15 + 0.5 };
}

/* default desk starts empty (a bare top on legs) — modules are added one by one */
export function defaultDeskUnits() { return []; }

/* ============================ DESK (modular) ============================ */
export function buildDesk(model, cfg) {
  const D = cfg.dD / 100, H = cfg.dH / 100;
  const topC = TOP[cfg.deskTop] || TOP.oak;
  const woodC = WOOD[cfg.wood] || WOOD.oak;
  const gloss = cfg.gloss;
  const isExec = cfg.dShape === "exec";
  const dStyle = cfg.doorStyle || "shaker";
  const dLower = dStyle === "glass" ? "shaker" : dStyle;
  const topT = isExec ? 0.055 : 0.04;
  const bodyH = H - topT;
  const handle = cfg.handle;

  const units = cfg.dUnits || [];
  const sumW = units.reduce((a, u) => a + (u.w || 45), 0) / 100;
  const topW = Math.max(sumW + (units.length ? 0.12 : 0), (cfg.dW || 140) / 100);

  // top + slim edge band (centred at origin)
  put(model, box(topW, topT, D, topC, { gloss }), 0, H - topT / 2, 0);
  put(model, box(topW + 0.004, 0.012, D + 0.004, topC, { gloss }), 0, H - topT, 0);

  // four corner legs + back apron
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    put(model, box(0.06, bodyH, 0.06, woodC, { gloss }), sx * (topW / 2 - 0.06), bodyH / 2, sz * (D / 2 - 0.07));
  });
  put(model, box(topW - 0.16, 0.08, 0.025, woodC, { gloss }), 0, H - topT - 0.05, -(D / 2) + 0.05);

  // pedestal modules laid left -> right under the top, each pickable
  let cursor = -sumW / 2;
  units.forEach((u, i) => {
    const uw = (u.w || 45) / 100;
    const ug = new THREE.Group();
    ug.position.set(cursor + uw / 2, 0, 0);
    ug.userData = { unitId: u.id, unitIndex: i, pickable: true };
    addBaseUnit(ug, { kind: u.kind, w: uw - 0.01, D: D - 0.02, bodyH, baseY: 0, topY: H, woodC, gloss, handle, lowerStyle: dLower, counterC: null, stone: false, shelves: u.shelves, drawers: u.drawers });
    if (cfg.selectedUnit && u.id === cfg.selectedUnit) {
      const eg = new THREE.EdgesGeometry(new THREE.BoxGeometry(uw - 0.01 + 0.02, bodyH + 0.04, D + 0.02));
      const ls = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color: 0xB0794A }));
      ls.position.set(0, bodyH / 2, (D - 0.02) / 2);
      ug.add(ls);
    }
    model.add(ug);
    cursor += uw;
  });

  // monitor shelf + modelled monitor
  if (cfg.dMonitor) {
    const mw = Math.min(topW * 0.5, 0.74);
    put(model, box(mw, 0.04, 0.2, topC, { gloss }), 0, H + 0.12, -(D / 2) + 0.16);
    [-1, 1].forEach((s) => put(model, box(0.04, 0.1, 0.04, woodC, { gloss }), s * (mw / 2 - 0.05), H + 0.06, -(D / 2) + 0.16));
    put(model, box(0.5, 0.3, 0.02, DARKGLASS, { glass: true }), 0, H + 0.32, -(D / 2) + 0.2);
    put(model, box(0.08, 0.08, 0.02, "#3A3835", { metal: true }), 0, H + 0.16, -(D / 2) + 0.2);
    put(model, box(0.2, 0.014, 0.1, "#3A3835", { metal: true }), 0, H + 0.155, -(D / 2) + 0.22);
  }
  // keyboard tray
  if (cfg.dKeyboard) {
    put(model, box(Math.min(topW * 0.5, 0.72), 0.02, 0.28, woodC, { gloss }), 0, H - 0.14, D / 2 - 0.18);
    put(model, box(0.42, 0.015, 0.14, "#2A2825", {}), 0, H - 0.125, D / 2 - 0.18);
  }
  // executive modesty panel
  if (isExec) put(model, box(topW - 0.2, 0.34, 0.04, woodC, { gloss }), 0, H - topT - 0.2, D / 2 - 0.05);
  // L-shape return with its own leg
  if (cfg.dShape === "l") {
    const rw = 0.75, rd = Math.min(D, 0.6);
    put(model, box(rw, topT, rd, topC, { gloss }), -(topW / 2) + rw / 2, H - topT / 2, D / 2 + rd / 2);
    put(model, box(0.06, bodyH, 0.06, woodC, { gloss }), -(topW / 2) + 0.07, bodyH / 2, D / 2 + rd - 0.07);
  }
  // cable tray + grommet ring
  if (cfg.dCable) put(model, box(topW - 0.22, 0.06, 0.05, "#2A2724", {}), 0, H - 0.13, -(D / 2) + 0.06);
  if (cfg.grommet || cfg.cableHole) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.01, 12, 24), pbr("#201E1C", { metal: true }));
    ring.rotation.x = Math.PI / 2; ring.castShadow = true;
    put(model, ring, topW * 0.3, H - topT + 0.001, -(D / 2) + 0.14);
    put(model, cyl(0.03, 0.02, "#141312", {}, 16), topW * 0.3, H - topT - 0.01, -(D / 2) + 0.14);
  }

  // room around the desk (floor + corner walls), centred on the desk
  const RW = Math.max(topW + 2.0, 3.0), RL = Math.max(D + 2.0, 2.6), RH = Math.max(H + 1.6, 2.5);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(RW + 1, RL + 1), pbr("#E6DDCD"));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, -0.002, 0); floor.receiveShadow = true; model.add(floor);
  const wallMat = pbr("#EFE9DF");
  const back = new THREE.Mesh(new THREE.PlaneGeometry(RW, RH), wallMat);
  back.position.set(0, RH / 2, -(D / 2) - 0.25); back.receiveShadow = true; model.add(back);
  const side = new THREE.Mesh(new THREE.PlaneGeometry(RL, RH), wallMat);
  side.rotation.y = Math.PI / 2; side.position.set(-(RW / 2), RH / 2, 0); side.receiveShadow = true; model.add(side);

  model.userData.focus = { cx: 0, cy: H * 0.7, cz: 0, radius: Math.max(topW, D, H) * 1.7 + 1.0 };
}

/* ---------------- disposal ---------------- */
export function disposeGroup(obj) {
  obj.traverse((c) => {
    if (c.geometry) c.geometry.dispose();
    if (c.material) Array.isArray(c.material) ? c.material.forEach((m) => m.dispose()) : c.material.dispose();
  });
}
