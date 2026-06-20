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

/* ---------------- material + primitive helpers ---------------- */
function pbr(color, o = {}) {
  if (o.glass) return new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 0.1, metalness: 0.2 });
  if (o.metal) return new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: o.rough ?? 0.34, metalness: 0.92 });
  if (o.stone) return new THREE.MeshPhysicalMaterial({ color: new THREE.Color(color), roughness: 0.28, metalness: 0.02, clearcoat: 0.5, clearcoatRoughness: 0.3 });
  if (o.gloss) return new THREE.MeshPhysicalMaterial({ color: new THREE.Color(color), roughness: 0.36, metalness: 0.0, clearcoat: 0.72, clearcoatRoughness: 0.16 });
  return new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 0.82, metalness: 0.04 });
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
function addDoor(parent, fw, fh, cx, cy, frontZ, color, o, handle, vertical) {
  // proud frame
  put(parent, box(fw - 0.018, fh - 0.018, 0.02, color, o), cx, cy, frontZ + 0.011);
  // recessed shaker centre
  if (fw > 0.18 && fh > 0.18)
    put(parent, box(fw - 0.13, fh - 0.13, 0.012, color, o), cx, cy, frontZ + 0.005);
  // handle near a vertical edge / top
  const hx = vertical ? cx + fw * 0.34 : cx;
  const hy = vertical ? cy : cy + fh * 0.34;
  addHandle(parent, handle, hx, hy, frontZ + 0.011, vertical);
}

/* ---------------- cabinet run (lowers + worktop + uppers) ---------------- */
function addCabinetRun(parent, o) {
  const g = new THREE.Group();
  const { length: W, depth: D, nLower, nUpper, woodC, counterC, splashC, gloss, handle, stone, skipUpperAt } = o;
  const KICK = 0.1, H = 0.9, gap = 0.016;

  // toe kick (recessed dark base)
  put(g, box(W - 0.02, KICK, D - 0.07, "#262320"), 0, KICK / 2, D / 2 - 0.02);

  // lower carcasses + doors
  const n = Math.max(1, nLower);
  const segW = (W - gap * (n - 1)) / n;
  const bodyH = H - KICK;
  for (let i = 0; i < n; i++) {
    const x = -W / 2 + segW / 2 + i * (segW + gap);
    put(g, box(segW - 0.006, bodyH, D, woodC, { gloss }), x, KICK + bodyH / 2, D / 2);
    // a wide cabinet reads as two doors; a tall-ish one keeps a drawer at top
    if (segW > 0.62) {
      const half = (segW - 0.01) / 2;
      addDoor(g, half, bodyH, x - half / 2, KICK + bodyH / 2, D, woodC, { gloss }, handle, true);
      addDoor(g, half, bodyH, x + half / 2, KICK + bodyH / 2, D, woodC, { gloss }, handle, true);
    } else {
      const drwH = 0.14;
      addDoor(g, segW - 0.01, drwH, x, KICK + bodyH - drwH / 2 - 0.01, D, woodC, { gloss }, handle, false);
      addDoor(g, segW - 0.01, bodyH - drwH - 0.02, x, KICK + (bodyH - drwH) / 2 - 0.01, D, woodC, { gloss }, handle, false);
    }
  }

  // worktop with overhang + slim front fascia
  if (counterC) {
    put(g, box(W + 0.03, 0.04, D + 0.035, counterC, { stone: stone, gloss: !stone }), 0, H + 0.02, D / 2 + 0.005);
    put(g, box(W + 0.03, 0.018, 0.012, counterC, { stone: stone, gloss: !stone }), 0, H + 0.001, D + 0.022);
  }
  // backsplash
  if (splashC) put(g, box(W, 0.5, 0.018, splashC, {}), 0, H + 0.04 + 0.25, 0.009);

  // upper carcasses + doors
  if (nUpper > 0) {
    const Du = 0.34, Hu = 0.72, yb = 1.5;
    const m = nUpper, segWu = (W - gap * (m - 1)) / m;
    for (let i = 0; i < m; i++) {
      if (skipUpperAt != null && i === skipUpperAt) continue;
      const x = -W / 2 + segWu / 2 + i * (segWu + gap);
      put(g, box(segWu - 0.006, Hu, Du, woodC, { gloss }), x, yb + Hu / 2, Du / 2);
      addDoor(g, segWu - 0.01, Hu, x, yb + Hu / 2, Du, woodC, { gloss }, handle, true);
    }
  }
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

/* ============================ KITCHEN ============================ */
export function buildKitchen(model, cfg) {
  const W = cfg.kW / 100, D = cfg.kD / 100;
  const woodC = WOOD[cfg.wood] || WOOD.oak;
  const counterC = COUNTER[cfg.counter] || COUNTER.quartzw;
  const splashC = cfg.backsplash === "none" ? null : SPLASH[cfg.backsplash];
  const stone = STONE_IDS.includes(cfg.counter);
  const gloss = cfg.gloss;
  const Lside = Math.min(Math.max(W * 0.55, 1.0), 2.2);
  const topY = 0.9;

  // cooking zone sits mid-run; reserve an upper slot for the hood
  const hoodIdx = Math.max(0, Math.min(cfg.kUpper - 1, Math.round(cfg.kUpper * 0.5)));
  const main = addCabinetRun(model, {
    length: W, depth: D, nLower: cfg.kLower, nUpper: cfg.kUpper, woodC, counterC, splashC,
    gloss, handle: cfg.handle, stone, skipUpperAt: (cfg.oven || cfg.microwave) ? hoodIdx : null,
  });
  main.position.set(W / 2, 0, 0);

  if (cfg.kLayout === "l" || cfg.kLayout === "u") {
    const sn = Math.max(1, Math.round(cfg.kLower / 3)), su = Math.max(0, Math.round(cfg.kUpper / 3));
    const right = addCabinetRun(model, { length: Lside, depth: D, nLower: sn, nUpper: su, woodC, counterC, splashC, gloss, handle: cfg.handle, stone });
    right.rotation.y = -Math.PI / 2; right.position.set(W, 0, D + Lside / 2);
  }
  if (cfg.kLayout === "u") {
    const sn = Math.max(1, Math.round(cfg.kLower / 3)), su = Math.max(0, Math.round(cfg.kUpper / 3));
    const left = addCabinetRun(model, { length: Lside, depth: D, nLower: sn, nUpper: su, woodC, counterC, splashC, gloss, handle: cfg.handle, stone });
    left.rotation.y = Math.PI / 2; left.position.set(0, 0, D + Lside / 2);
  }

  // sink position along main width
  const sinkX = cfg.sink === "left" ? W * 0.2 : cfg.sink === "right" ? W * 0.8 : W * 0.5;
  addSink(model, sinkX, D, topY, counterC, stone);

  // cooking zone (oven + hob + hood) placed away from the sink
  const cookX = cfg.sink === "right" ? W * 0.3 : W * 0.7;
  if (cfg.oven) { addOven(model, cookX, D); addHob(model, cookX, D, topY); addHood(model, cookX, D, woodC, gloss); }
  if (cfg.microwave) addMicrowave(model, W * 0.86, 1.5, 0.34);

  // fridge (right of main run)
  if (cfg.fridge) put(model, makeFridge(gloss), W + 0.34, 0, D / 2);

  // tall unit / pantry (left of main run) — full-height larders with doors
  const addTall = (x) => {
    put(model, box(0.6, 2.1, D, woodC, { gloss }), x, 1.05, D / 2);
    addDoor(model, 0.58, 1.0, x, 1.55, D, woodC, { gloss }, cfg.handle, true);
    addDoor(model, 0.58, 0.95, x, 0.55, D, woodC, { gloss }, cfg.handle, true);
  };
  if (cfg.kTall) addTall(-0.34);
  if (cfg.pantry) addTall(cfg.kTall ? -1.0 : -0.34);

  // wall open shelves
  if (cfg.openShelf) {
    put(model, box(0.85, 0.04, 0.26, woodC, { gloss }), W * 0.28, 1.78, 0.13);
    put(model, box(0.85, 0.04, 0.26, woodC, { gloss }), W * 0.28, 2.05, 0.13);
  }

  // island with a waterfall worktop + seating overhang
  if (cfg.kIsland) {
    const iw = Math.min(W * 0.55, 1.7), id = 0.95;
    const zc = D + (cfg.kLayout === "straight" ? 1.4 : Lside * 0.62);
    const ig = new THREE.Group();
    put(ig, box(iw, 0.9, id - 0.25, woodC, { gloss }), 0, 0.45, -0.05);
    addDoor(ig, iw * 0.45, 0.8, -iw * 0.24, 0.46, id - 0.25, woodC, { gloss }, cfg.handle, true);
    addDoor(ig, iw * 0.45, 0.8, iw * 0.24, 0.46, id - 0.25, woodC, { gloss }, cfg.handle, true);
    // worktop with overhang one side
    put(ig, box(iw + 0.05, 0.05, id, counterC, { stone, gloss: !stone }), 0, 0.925, 0.02);
    // waterfall ends
    put(ig, box(0.05, 0.92, id - 0.24, counterC, { stone, gloss: !stone }), -iw / 2 - 0.0, 0.46, -0.04);
    put(ig, box(0.05, 0.92, id - 0.24, counterC, { stone, gloss: !stone }), iw / 2 + 0.0, 0.46, -0.04);
    ig.position.set(W / 2, 0, zc);
    model.add(ig);
  }
}

/* ============================ DESK ============================ */
export function buildDesk(model, cfg) {
  const W = cfg.dW / 100, D = cfg.dD / 100, H = cfg.dH / 100;
  const topC = TOP[cfg.deskTop] || TOP.oak;
  const woodC = WOOD[cfg.wood] || WOOD.oak;
  const gloss = cfg.gloss;
  const isExec = cfg.dShape === "exec";
  const topT = isExec ? 0.055 : 0.04;
  const legH = H - topT;

  // top + slim edge band
  put(model, box(W, topT, D, topC, { gloss }), 0, H - topT / 2, 0);
  put(model, box(W + 0.004, 0.012, D + 0.004, topC, { gloss }), 0, H - topT, 0);

  // base / legs
  if (cfg.leg === "timber" || isExec) {
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      put(model, box(0.06, legH, 0.06, woodC, { gloss }), sx * (W / 2 - 0.07), legH / 2, sz * (D / 2 - 0.07));
    });
    // stretcher rails for a built feel
    put(model, box(W - 0.18, 0.04, 0.04, woodC, { gloss }), 0, 0.12, -(D / 2 - 0.07));
    put(model, box(0.04, 0.04, D - 0.18, woodC, { gloss }), -(W / 2 - 0.07), 0.12, 0);
    put(model, box(0.04, 0.04, D - 0.18, woodC, { gloss }), (W / 2 - 0.07), 0.12, 0);
  } else if (cfg.leg === "panel") {
    [-1, 1].forEach((sx) => put(model, box(0.04, legH - 0.02, D - 0.06, woodC, { gloss }), sx * (W / 2 - 0.02), (legH - 0.02) / 2, 0));
    put(model, box(W - 0.1, legH * 0.5, 0.04, woodC, { gloss }), 0, legH * 0.35, -(D / 2) + 0.05);
  } else if (cfg.leg === "steel") {
    // flat-bar inverted-U legs each end
    [-1, 1].forEach((sx) => {
      const lx = sx * (W / 2 - 0.06);
      put(model, box(0.03, legH, 0.05, "#2C2C2E", { metal: true }), lx, legH / 2, D / 2 - 0.07);
      put(model, box(0.03, legH, 0.05, "#2C2C2E", { metal: true }), lx, legH / 2, -(D / 2 - 0.07));
      put(model, box(0.03, 0.04, D - 0.1, "#2C2C2E", { metal: true }), lx, legH - 0.04, 0);
    });
  } else if (cfg.leg === "pedestal") {
    [-1, 1].forEach((sx) => put(model, box(0.42, legH, D - 0.06, woodC, { gloss }), sx * (W / 2 - 0.23), legH / 2, 0));
  }

  // RIGHT pedestal: drawers with reveals + handles
  if (cfg.dDrawers > 0) {
    const pw = 0.42, ph = legH, px = W / 2 - 0.23, pd = D - 0.06;
    put(model, box(pw, ph, pd, woodC, { gloss }), px, ph / 2, 0);
    const n = cfg.dDrawers, fh = (ph - 0.02) / n;
    for (let i = 0; i < n; i++) {
      const y = 0.01 + fh / 2 + i * fh;
      put(model, box(pw - 0.03, fh - 0.016, 0.02, woodC, { gloss }), px, y, pd / 2 + 0.012);
      put(model, box(0.13, 0.016, 0.024, HANDLE_DK, { metal: true }), px, y, pd / 2 + 0.026);
    }
  }

  // LEFT slot (priority: file > closed > shelves > cpu)
  const leftKind = cfg.fileCab ? "file" : cfg.closed ? "closed" : cfg.dShelves > 0 ? "shelves" : cfg.cpu ? "cpu" : isExec ? "closed" : null;
  if (leftKind) {
    const pw = 0.42, ph = legH, px = -(W / 2 - 0.23), pd = D - 0.06;
    if (leftKind === "shelves" || leftKind === "cpu") {
      [-1, 1].forEach((s) => put(model, box(0.02, ph, pd, woodC, { gloss }), px + s * (pw / 2), ph / 2, 0));
      put(model, box(pw, 0.02, pd, woodC, { gloss }), px, 0.01, 0);
      put(model, box(pw, 0.02, pd, woodC, { gloss }), px, ph, 0);
      const nb = leftKind === "shelves" ? Math.max(1, cfg.dShelves) : 1;
      for (let i = 1; i <= nb; i++) put(model, box(pw - 0.02, 0.02, pd - 0.02, woodC, { gloss }), px, (ph / (nb + 1)) * i, 0);
    } else {
      put(model, box(pw, ph, pd, woodC, { gloss }), px, ph / 2, 0);
      const fronts = leftKind === "file" ? 2 : 1, fh = (ph - 0.02) / fronts;
      for (let i = 0; i < fronts; i++) {
        const y = 0.01 + fh / 2 + i * fh;
        addDoor(model, pw - 0.02, fh - 0.014, px, y, pd / 2 + 0.0, woodC, { gloss }, "bar", false);
      }
    }
  }

  // extra wall shelves if not used on the left
  if (cfg.dShelves > 0 && leftKind !== "shelves") {
    for (let i = 0; i < Math.min(cfg.dShelves, 2); i++)
      put(model, box(0.5, 0.03, 0.2, woodC, { gloss }), -(W / 2) + 0.3, H + 0.2 + i * 0.24, -(D / 2) + 0.12);
  }

  // side storage unit (extends left)
  if (cfg.dSide) {
    put(model, box(0.4, H, D - 0.04, woodC, { gloss }), -(W / 2 + 0.22), H / 2, 0);
    addDoor(model, 0.36, H * 0.5, -(W / 2 + 0.22), H * 0.62, (D - 0.04) / 2, woodC, { gloss }, cfg.handle, false);
  }
  if (cfg.printer) put(model, box(0.42, 0.03, 0.32, woodC, { gloss }), -(W / 2 + 0.22), H + 0.02, 0);

  // monitor shelf + modelled monitor
  if (cfg.dMonitor) {
    const mw = Math.min(W * 0.5, 0.74);
    put(model, box(mw, 0.04, 0.2, topC, { gloss }), 0, H + 0.12, -(D / 2) + 0.16);
    [-1, 1].forEach((s) => put(model, box(0.04, 0.1, 0.04, woodC, { gloss }), s * (mw / 2 - 0.05), H + 0.06, -(D / 2) + 0.16));
    // simple monitor
    put(model, box(0.5, 0.3, 0.02, DARKGLASS, { glass: true }), 0, H + 0.32, -(D / 2) + 0.2);
    put(model, box(0.08, 0.08, 0.02, "#3A3835", { metal: true }), 0, H + 0.16, -(D / 2) + 0.2);
    put(model, box(0.2, 0.014, 0.1, "#3A3835", { metal: true }), 0, H + 0.155, -(D / 2) + 0.22);
  }
  // keyboard tray + keyboard
  if (cfg.dKeyboard) {
    put(model, box(Math.min(W * 0.5, 0.72), 0.02, 0.28, woodC, { gloss }), 0, H - 0.14, D / 2 - 0.18);
    put(model, box(0.42, 0.015, 0.14, "#2A2825", {}), 0, H - 0.125, D / 2 - 0.18);
  }

  // executive modesty panel
  if (isExec) put(model, box(W - 0.2, 0.34, 0.04, woodC, { gloss }), 0, H - topT - 0.2, D / 2 - 0.05);

  // L-shape return with its own leg
  if (cfg.dShape === "l") {
    const rw = 0.75, rd = Math.min(D, 0.6);
    put(model, box(rw, topT, rd, topC, { gloss }), -(W / 2) + rw / 2, H - topT / 2, D / 2 + rd / 2);
    put(model, box(0.06, legH, 0.06, woodC, { gloss }), -(W / 2) + 0.07, legH / 2, D / 2 + rd - 0.07);
  }

  // cable tray + grommet ring
  if (cfg.dCable) put(model, box(W - 0.22, 0.06, 0.05, "#2A2724", {}), 0, H - 0.13, -(D / 2) + 0.06);
  if (cfg.grommet || cfg.cableHole) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.01, 12, 24), pbr("#201E1C", { metal: true }));
    ring.rotation.x = Math.PI / 2; ring.castShadow = true;
    put(model, ring, W * 0.3, H - topT + 0.001, -(D / 2) + 0.14);
    put(model, cyl(0.03, 0.02, "#141312", {}, 16), W * 0.3, H - topT - 0.01, -(D / 2) + 0.14);
  }
}

/* ---------------- disposal ---------------- */
export function disposeGroup(obj) {
  obj.traverse((c) => {
    if (c.geometry) c.geometry.dispose();
    if (c.material) Array.isArray(c.material) ? c.material.forEach((m) => m.dispose()) : c.material.dispose();
  });
}
