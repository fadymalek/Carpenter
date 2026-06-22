"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import {
  ChefHat, Briefcase, ArrowRight, ArrowLeft, Check, Ruler, Layers, Boxes,
  ClipboardList, Send, Minus, Plus, RotateCcw, Download, Upload, Globe,
  Sparkles, Info, MousePointer2, Wrench, X, Maximize2, GripVertical, Trash2,
} from "lucide-react";
import { buildKitchen, buildDesk, disposeGroup } from "./build3d";

/* ================================================================== *
 *  HEWN & OAK — Product Configurator (Kitchens + Office Desks)
 *  Single-file React + Three.js (r128) MVP. Built to drop into the
 *  marketing site as the /configure route. Wiring points are marked:
 *    - handleSubmit()  -> POST to email / DB / API / Firebase
 *    - saveDesign()    -> localStorage in production (download here)
 *    - buildSummary()  -> structured payload, ready for jsPDF export
 *  Bilingual EN/AR with RTL via the `dir` switch; copy lives in STR.
 * ================================================================== */

const C = {
  cream: "#F7F2EA", paper: "#FBF8F2", sand: "#EBE1D2", oak: "#B0794A",
  oakDeep: "#9A6638", walnut: "#6B4A30", walnutDark: "#3E2C1E",
  charcoal: "#241F1B", ink: "#33291F", muted: "#7C6A57", line: "#E0D4C1",
  lineDark: "#5A4632",
};

const L = (en, ar) => ({ en, ar });
const fmt = (n) => Math.round(n).toLocaleString("en-US");

/* ----------------------------- i18n ----------------------------- */
const STR = {
  brand: L("Hewn & Oak", "هيون آند أوك"),
  configurator: L("Configurator", "مُصمّم المنتج"),
  steps: [
    L("Product", "المنتج"),
    L("Dimensions", "الأبعاد"),
    L("Materials", "الخامات"),
    L("Storage", "التخزين"),
    L("Review", "المراجعة"),
    L("Submit", "الإرسال"),
  ],
  back: L("Back", "رجوع"),
  next: L("Next", "التالي"),
  toReview: L("Review design", "مراجعة التصميم"),
  submit: L("Submit request", "إرسال الطلب"),
  save: L("Save", "حفظ"),
  reset: L("Start over", "البداية"),
  drag: L("Drag to rotate · scroll to zoom", "اسحب للتدوير · مرّر للتكبير"),
  disclaimer: L(
    "Concept preview. Final dimensions, materials and pricing are confirmed after professional review.",
    "معاينة تصوّرية. يتم تأكيد الأبعاد والخامات والأسعار النهائية بعد المراجعة الفنية."
  ),
  estPrice: L("Estimated range", "النطاق التقديري"),
  indicative: L("Indicative only — reviewed before quote.", "تقديري فقط — يُراجع قبل عرض السعر."),
  summary: L("Your design", "تصميمك"),
  product: L("Product", "المنتج"),
  kitchen: L("Custom Kitchen", "مطبخ مفصّل"),
  desk: L("Office Desk", "مكتب عمل"),
  chooseProduct: L("What are you designing?", "ماذا تريد أن تصمّم؟"),
  chooseProductSub: L(
    "Pick a starting point. You can change everything in the next steps.",
    "اختر نقطة البداية. يمكنك تعديل كل شيء في الخطوات التالية."
  ),
  kitchenCard: L("Cabinetry shaped to your room and how you cook.", "خزائن مصممة على مساحتك وطريقة طبخك."),
  deskCard: L("A work surface with the storage and cable routing you need.", "سطح عمل بالتخزين وإدارة الكابلات التي تحتاجها."),
  dims: L("Set your dimensions", "حدّد الأبعاد"),
  layout: L("Layout", "التخطيط"),
  width: L("Width", "العرض"),
  height: L("Height", "الارتفاع"),
  depth: L("Depth", "العمق"),
  lowerCab: L("Lower cabinets", "خزائن سفلية"),
  upperCab: L("Upper cabinets", "خزائن علوية"),
  tallUnit: L("Tall unit", "وحدة طويلة"),
  island: L("Island", "جزيرة"),
  deskShape: L("Desk shape", "شكل المكتب"),
  drawers: L("Drawers", "أدراج"),
  shelves: L("Shelves", "أرفف"),
  sideUnit: L("Side storage unit", "وحدة تخزين جانبية"),
  cableMgmt: L("Cable management", "إدارة الكابلات"),
  monitorShelf: L("Monitor shelf", "رف الشاشة"),
  keyboardTray: L("Keyboard tray", "درج لوحة المفاتيح"),
  matsTitle: L("Materials & finishes", "الخامات والتشطيبات"),
  woodFinish: L("Wood finish", "تشطيب الخشب"),
  finishType: L("Finish", "اللمعان"),
  matte: L("Matte", "مطفي"),
  glossy: L("Glossy", "لامع"),
  handle: L("Handle style", "نوع المقابض"),
  doorStyle: L("Door front", "واجهة الباب"),
  led: L("Under-cabinet LED", "إضاءة تحت الخزائن"),
  hardware: L("Hardware quality", "جودة الإكسسوارات"),
  countertop: L("Countertop", "سطح العمل"),
  backsplash: L("Backsplash", "الواجهة الخلفية"),
  deskTop: L("Top material", "خامة السطح"),
  legStyle: L("Leg / base style", "نوع القاعدة"),
  storageTitle: L("Storage & features", "التخزين والمميزات"),
  storageSub: L("Toggle what this piece needs to do.", "فعّل ما تحتاجه هذه القطعة."),
  reviewTitle: L("Review your design", "راجع تصميمك"),
  notes: L("Notes for the workshop", "ملاحظات للورشة"),
  notesPh: L("Anything specific — appliances, colours you love, constraints…", "أي تفاصيل — أجهزة، ألوان تفضلها، قيود…"),
  contactTitle: L("Almost there — how do we reach you?", "خطوة أخيرة — كيف نتواصل معك؟"),
  name: L("Full name", "الاسم بالكامل"),
  phone: L("Phone number", "رقم الهاتف"),
  email: L("Email", "البريد الإلكتروني"),
  city: L("City / location", "المدينة / الموقع"),
  inspo: L("Inspiration image (optional)", "صورة إلهام (اختياري)"),
  inspoPh: L("Upload a photo or sketch", "ارفع صورة أو رسمة"),
  required: L("Required", "مطلوب"),
  successTitle: L("Design request received", "تم استلام طلب التصميم"),
  successBody: L(
    "Thanks — a maker will review your design and reach out within one working day with next steps and an itemised quote.",
    "شكرًا — سيراجع أحد الحرفيين تصميمك ويتواصل معك خلال يوم عمل واحد بالخطوات التالية وعرض سعر مفصّل."
  ),
  newDesign: L("Start a new design", "ابدأ تصميمًا جديدًا"),
  features: L("Features", "المميزات"),
  none: L("None selected", "لا يوجد"),
  cm: L("cm", "سم"),
};

/* -------------------------- option data -------------------------- */
const WOODS = [
  { id: "oak", c: "#C49A6C", l: L("Natural Oak", "بلوط طبيعي") },
  { id: "walnut", c: "#5C3B22", l: L("Walnut", "جوز") },
  { id: "ash", c: "#D6C5A6", l: L("Ash", "دردار") },
  { id: "espresso", c: "#3B2A1E", l: L("Espresso", "إسبريسو") },
  { id: "white", c: "#ECE7DD", l: L("White Painted", "أبيض مطلي") },
  { id: "charcoalw", c: "#34302B", l: L("Charcoal", "فحمي") },
  { id: "sage", c: "#8C9281", l: L("Sage", "مريمية") },
  { id: "navy", c: "#33414F", l: L("Navy", "كحلي") },
];
const COUNTERS = [
  { id: "quartzw", c: "#ECEAE4", l: L("White Quartz", "كوارتز أبيض") },
  { id: "granite", c: "#2B2B2D", l: L("Black Granite", "جرانيت أسود") },
  { id: "butcher", c: "#B0793F", l: L("Oak Butcher", "خشب بلوط") },
  { id: "marble", c: "#E7E3DB", l: L("Marble", "رخام") },
  { id: "concrete", c: "#9C988F", l: L("Concrete", "خرسانة") },
];
const SPLASH = [
  { id: "tile", c: "#DCD3C4", l: L("Ceramic Tile", "سيراميك") },
  { id: "glass", c: "#CAD6D2", l: L("Glass", "زجاج") },
  { id: "stone", c: "#BDB4A6", l: L("Stone Slab", "حجر") },
  { id: "none", c: null, l: L("None", "بدون") },
];
const DESKTOPS = [
  { id: "oak", c: "#C49A6C", l: L("Solid Oak", "بلوط صلب") },
  { id: "walnut", c: "#5C3B22", l: L("Walnut", "جوز") },
  { id: "ash", c: "#D6C5A6", l: L("Ash", "دردار") },
  { id: "white", c: "#ECE7DD", l: L("White", "أبيض") },
  { id: "blacklam", c: "#26252A", l: L("Black Laminate", "لامينيت أسود") },
  { id: "bamboo", c: "#CDB386", l: L("Bamboo", "خيزران") },
];
const HANDLES = [
  { id: "bar", l: L("Bar Pull", "شريطي") },
  { id: "knob", l: L("Knob", "دائري") },
  { id: "edge", l: L("Handleless", "بدون مقابض") },
  { id: "recessed", l: L("Recessed", "غائر") },
];
const DOORS = [
  { id: "shaker", l: L("Shaker frame", "شيكر بإطار") },
  { id: "flat", l: L("Flat panel", "سادة مسطّح") },
  { id: "slab", l: L("Handleless slab", "سادة بدون مقابض") },
  { id: "glass", l: L("Glass upper", "زجاج علوي") },
];
const LEGS = [
  { id: "timber", l: L("Timber Legs", "أرجل خشب") },
  { id: "panel", l: L("Panel Sides", "جوانب لوحية") },
  { id: "steel", l: L("Steel Hairpin", "حديد رفيع") },
  { id: "pedestal", l: L("Pedestal Base", "قاعدة مغلقة") },
];
const HARDWARE = [
  { id: "standard", l: L("Standard", "قياسي"), m: 1 },
  { id: "premium", l: L("Premium soft-close", "ممتاز هادئ"), m: 1.15 },
  { id: "pro", l: L("Professional", "احترافي"), m: 1.3 },
];

const colorOf = (list, id) => (list.find((x) => x.id === id) || list[0]).c;

/* ---- modular kitchen units (the box-by-box builder) ---- */
const uid = () => Math.random().toString(36).slice(2, 9);
const UNIT_KINDS = [
  { id: "door", l: L("Door cabinet", "خزانة باب"), icon: "▯", min: 30, max: 100, def: 60 },
  { id: "drawers", l: L("Drawers", "أدراج"), icon: "≣", min: 30, max: 90, def: 60 },
  { id: "open", l: L("Open shelves", "رفوف مفتوحة"), icon: "▭", min: 30, max: 90, def: 60 },
  { id: "sink", l: L("Sink", "حوض"), icon: "◠", min: 45, max: 120, def: 90 },
  { id: "oven", l: L("Oven + hob", "فرن + بوتاجاز"), icon: "▦", min: 50, max: 90, def: 60 },
  { id: "dishwasher", l: L("Dishwasher", "غسالة أطباق"), icon: "◫", min: 45, max: 60, def: 60 },
];
const DESK_KINDS = [
  { id: "drawers", l: L("Drawers", "أدراج"), icon: "≣", min: 35, max: 70, def: 45 },
  { id: "open", l: L("Open shelves", "رفوف مفتوحة"), icon: "▭", min: 35, max: 90, def: 50 },
  { id: "door", l: L("Door cabinet", "خزانة باب"), icon: "▯", min: 35, max: 90, def: 50 },
  { id: "file", l: L("File cabinet", "خزانة ملفات"), icon: "◫", min: 35, max: 55, def: 45 },
];
const unitKind = (id) => UNIT_KINDS.find((k) => k.id === id) || DESK_KINDS.find((k) => k.id === id) || UNIT_KINDS[0];
const makeUnit = (kind = "door") => ({ id: uid(), kind, w: unitKind(kind).def, shelves: 2, drawers: 3 });
const defaultKUnits = () => [
  makeUnit("drawers"), makeUnit("sink"), makeUnit("door"), makeUnit("oven"), makeUnit("drawers"),
];

/* ---- richer material swatch fills (CSS preview of the real texture) ---- */
const GRAIN_IDS = ["oak", "walnut", "ash", "espresso", "bamboo", "butcher"];
const _shade = (hex, amt) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const cl = (v) => Math.max(0, Math.min(255, v));
  const r = cl(((n >> 16) & 255) + amt), g = cl(((n >> 8) & 255) + amt), b = cl((n & 255) + amt);
  return `rgb(${r},${g},${b})`;
};
function swatchBg(id, c) {
  if (!c) return "transparent";
  if (GRAIN_IDS.includes(id)) {
    // wood grain: fine darker fibres + a couple of lighter streaks over the base
    return `repeating-linear-gradient(92deg, ${_shade(c, -16)} 0 1px, transparent 1px 6px),`
      + `repeating-linear-gradient(92deg, ${_shade(c, 12)} 0 1px, transparent 1px 17px), ${c}`;
  }
  if (id === "granite") return `radial-gradient(circle at 30% 30%, ${_shade(c, 40)} 0 1px, transparent 2px), radial-gradient(circle at 70% 60%, ${_shade(c, 55)} 0 1px, transparent 2px), radial-gradient(circle at 50% 80%, ${_shade(c, 30)} 0 1px, transparent 2px), ${c}`;
  if (id === "marble") return `linear-gradient(125deg, transparent 46%, ${_shade(c, -18)} 47% 48%, transparent 49%), linear-gradient(105deg, transparent 62%, ${_shade(c, -12)} 63%, transparent 64%), ${c}`;
  if (id === "quartzw") return `radial-gradient(circle at 40% 40%, ${_shade(c, -8)} 0 1px, transparent 2px), ${c}`;
  if (id === "concrete") return `radial-gradient(circle at 35% 30%, ${_shade(c, 14)} 0 22%, transparent 40%), radial-gradient(circle at 75% 70%, ${_shade(c, -12)} 0 18%, transparent 36%), ${c}`;
  if (id === "glass") return `linear-gradient(135deg, ${_shade(c, 22)} 0%, ${c} 45%, ${_shade(c, -10)} 100%)`;
  if (id === "blacklam") return `linear-gradient(135deg, ${_shade(c, 18)} 0%, ${c} 60%)`;
  // painted MDF / solid: soft top sheen
  return `linear-gradient(160deg, ${_shade(c, 10)} 0%, ${c} 55%, ${_shade(c, -8)} 100%)`;
}

/* --------------------------- defaults --------------------------- */
const DEFAULTS = {
  product: "kitchen",
  kW: 360, kH: 270, kD: 60, roomL: 320, kLayout: "straight", kLower: 4, kUpper: 4, kTall: false, kIsland: false,
  kUnits: defaultKUnits(), selectedUnit: null,
  dW: 140, dD: 70, dH: 74, dShape: "straight", dDrawers: 2, dShelves: 1, dSide: false, dCable: true, dMonitor: false, dKeyboard: false,
  dUnits: [],
  wood: "oak", gloss: false, handle: "bar", hardware: "premium", doorStyle: "shaker", led: false,
  counter: "quartzw", backsplash: "tile",
  deskTop: "oak", leg: "timber",
  corner: false, sink: "center", oven: true, fridge: true, microwave: false, openShelf: false, pantry: false,
  closed: false, cpu: false, printer: false, fileCab: false, cableHole: true, grommet: true,
  name: "", phone: "", email: "", city: "", notes: "", file: "",
};

/* ----------------------------- price ----------------------------- */
function priceRange(cfg) {
  const hw = HARDWARE.find((h) => h.id === cfg.hardware).m;
  let p;
  if (cfg.product === "kitchen") {
    const units = cfg.kUnits || [];
    const perUnit = { door: 1600, drawers: 2600, open: 1100, sink: 3200, oven: 5200, dishwasher: 3800 };
    p = 5000 * (cfg.kW / 100) + 900 * cfg.kUpper;
    p += units.reduce((a, u) => a + (perUnit[u.kind] || 1600), 0);
    p += (cfg.kTall ? 5000 : 0) + (cfg.kIsland ? 12000 : 0);
    p += (cfg.microwave ? 1500 : 0) + (cfg.pantry ? 4000 : 0) + (cfg.fridge ? 2000 : 0);
    p += (cfg.corner ? 2500 : 0) + (cfg.openShelf ? 1200 : 0) + (cfg.led ? 1800 : 0);
    p += { quartzw: 4000, granite: 6000, butcher: 3000, marble: 9000, concrete: 3500 }[cfg.counter] || 0;
    p += { shaker: 0, flat: 600, slab: 1200, glass: 2400 }[cfg.doorStyle] || 0;
  } else {
    const du = cfg.dUnits || [];
    const perMod = { drawers: 2400, open: 1100, door: 1600, file: 2600 };
    p = 4500 + 4200 * (cfg.dW / 100);
    p += du.reduce((a, u) => a + (perMod[u.kind] || 1600), 0);
    p += (cfg.dMonitor ? 900 : 0) + (cfg.dKeyboard ? 700 : 0) + (cfg.dCable ? 400 : 0);
    p += (cfg.dShape === "l" ? 2500 : cfg.dShape === "exec" ? 3500 : 0);
    p += { shaker: 0, flat: 400, slab: 800, glass: 1600 }[cfg.doorStyle] || 0;
  }
  if (cfg.gloss) p *= 1.06;
  p *= hw;
  const round = (x) => Math.round(x / 500) * 500;
  return { low: round(p * 0.9), high: round(p * 1.12) };
}


/* Soft studio environment so metal, stone and gloss finishes pick up
   real reflections instead of looking like flat plastic. */
function studioEnv(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const sc = new THREE.Scene();
  sc.background = new THREE.Color(0x3c3c44);
  const panel = (c, x, y, z, w, h, d) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: c }));
    m.position.set(x, y, z); sc.add(m);
  };
  panel(0xffffff, 0, 9, 0, 20, 0.1, 20);   // bright ceiling (key)
  panel(0xfff0db, -7, 3, 5, 0.1, 9, 9);    // warm left
  panel(0xd9e6ff, 7, 3, -5, 0.1, 9, 9);    // cool right
  panel(0xb9b4ad, 0, 3, -9, 20, 9, 0.1);   // neutral back
  const tex = pmrem.fromScene(sc, 0.5).texture;
  pmrem.dispose();
  sc.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  return tex;
}

/* ========================= 3D PREVIEW ========================= */
function Preview3D({ config, lang, snapRef, onPickUnit, onReorder }) {
  const mountRef = useRef(null);
  const S = useRef(null);
  const propsRef = useRef({});
  propsRef.current = { config, onPickUnit, onReorder };

  const geoSig = useMemo(() => {
    const k = ["product", "kW", "kH", "kD", "roomL", "kLayout", "kUpper", "kTall", "kIsland", "dW", "dD", "dH", "dShape", "dDrawers", "dShelves", "dSide", "dCable", "dMonitor", "dKeyboard", "wood", "gloss", "counter", "backsplash", "deskTop", "leg", "fridge", "microwave", "openShelf", "pantry", "closed", "cpu", "printer", "fileCab", "cableHole", "grommet", "doorStyle", "led"];
    return k.map((x) => config[x]).join("|") + "|" + JSON.stringify(config.kUnits || []) + "|" + JSON.stringify(config.dUnits || []) + "|" + (config.selectedUnit || "");
  }, [config]);

  // init once
  useEffect(() => {
    const mount = mountRef.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    } catch (e) {
      S.current = { failed: true };
      return;
    }
    const w = mount.clientWidth, h = mount.clientHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, w / h, 0.1, 100);

    let envTex = null;
    try { envTex = studioEnv(renderer); scene.environment = envTex; } catch (e) { /* env optional */ }

    scene.add(new THREE.HemisphereLight(0xffffff, 0x9a8f7f, 0.4));
    scene.add(new THREE.AmbientLight(0xffffff, 0.14));
    const key = new THREE.DirectionalLight(0xfff2df, 1.15);
    key.position.set(4.5, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 30;
    key.shadow.camera.left = -6; key.shadow.camera.right = 6;
    key.shadow.camera.top = 6; key.shadow.camera.bottom = -6;
    key.shadow.bias = -0.0006;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x9fb6c4, 0.25);
    fill.position.set(-5, 3, -4);
    scene.add(fill);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.16 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    S.current = {
      renderer, scene, camera, key, ground, envTex, model: null, lastProduct: null,
      theta: Math.PI * 0.78, phi: 1.02, radius: 6, target: new THREE.Vector3(0, 0.6, 0),
      dragging: false, px: 0, py: 0, auto: !reduce, raf: 0, failed: false,
      ray: new THREE.Raycaster(), ndc: new THREE.Vector2(), dragMode: "orbit", downUnit: null, moved: false, accum: 0,
    };

    // find which kitchen unit (if any) sits under the pointer
    const pickUnit = (e) => {
      const s = S.current; if (!s || !s.model) return null;
      const r = el.getBoundingClientRect();
      s.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      s.ray.setFromCamera(s.ndc, camera);
      const hits = s.ray.intersectObjects(s.model.children, true);
      for (const hit of hits) {
        let o = hit.object;
        while (o) { if (o.userData && o.userData.unitId) return { id: o.userData.unitId, index: o.userData.unitIndex }; o = o.parent; }
      }
      return null;
    };

    const updateCam = () => {
      const s = S.current;
      const { radius: r, theta: t, phi: p, target: tg } = s;
      camera.position.set(tg.x + r * Math.sin(p) * Math.sin(t), tg.y + r * Math.cos(p), tg.z + r * Math.sin(p) * Math.cos(t));
      camera.lookAt(tg);
    };
    S.current.updateCam = updateCam;

    const el = renderer.domElement;
    const onDown = (e) => {
      const s = S.current; s.dragging = true; s.auto = false; s.px = e.clientX; s.py = e.clientY; s.moved = false; s.accum = 0;
      const { config: cfg } = propsRef.current;
      s.downUnit = (cfg && cfg.product === "kitchen") ? pickUnit(e) : null;
      // drag-to-reorder only when grabbing the already-selected unit
      s.dragMode = (s.downUnit && cfg && s.downUnit.id === cfg.selectedUnit) ? "unit" : "orbit";
      el.setPointerCapture && el.setPointerCapture(e.pointerId);
    };
    const onMove = (e) => {
      const s = S.current; if (!s.dragging) return;
      const dx = e.clientX - s.px, dy = e.clientY - s.py;
      if (Math.abs(dx) + Math.abs(dy) > 5) s.moved = true;
      if (s.dragMode === "unit" && propsRef.current.onReorder) {
        s.accum += dx; s.px = e.clientX; s.py = e.clientY;
        const step = 40;
        if (Math.abs(s.accum) > step) {
          const dir = s.accum > 0 ? 1 : -1; s.accum = 0;
          propsRef.current.onReorder(s.downUnit.id, dir);
        }
        return;
      }
      s.theta -= dx * 0.008;
      s.phi = Math.max(0.2, Math.min(1.45, s.phi - dy * 0.006));
      s.px = e.clientX; s.py = e.clientY; updateCam();
    };
    const onUp = (e) => {
      const s = S.current; if (!s) return;
      if (!s.moved && s.dragMode !== "unit" && propsRef.current.onPickUnit) {
        propsRef.current.onPickUnit(s.downUnit ? s.downUnit.id : null);
      }
      s.dragging = false; s.downUnit = null; s.dragMode = "orbit";
      el.releasePointerCapture && el.releasePointerCapture(e.pointerId);
    };
    const onWheel = (e) => { e.preventDefault(); const s = S.current; s.radius = Math.max(2.2, Math.min(16, s.radius + e.deltaY * 0.0025)); updateCam(); };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointerleave", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });

    const ro = new ResizeObserver(() => {
      const s = S.current; if (!s) return;
      const W2 = mount.clientWidth, H2 = mount.clientHeight;
      renderer.setSize(W2, H2); camera.aspect = W2 / H2; camera.updateProjectionMatrix();
    });
    ro.observe(mount);

    const loop = () => {
      const s = S.current; if (!s) return;
      if (s.auto && !s.dragging) { s.theta += 0.0016; updateCam(); }
      renderer.render(scene, camera);
      s.raf = requestAnimationFrame(loop);
    };
    updateCam();
    loop();

    snapRef && (snapRef.current = () => { renderer.render(scene, camera); try { return renderer.domElement.toDataURL("image/png"); } catch { return null; } });

    return () => {
      const s = S.current;
      cancelAnimationFrame(s.raf);
      ro.disconnect();
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointerleave", onUp);
      el.removeEventListener("wheel", onWheel);
      if (s.model) disposeGroup(s.model);
      disposeGroup(scene);
      if (s.envTex) s.envTex.dispose();
      renderer.dispose();
      if (el.parentNode) el.parentNode.removeChild(el);
      S.current = null;
    };
  }, []);

  // rebuild model on geometry change
  useEffect(() => {
    const s = S.current; if (!s || s.failed) return;
    if (s.model) { s.scene.remove(s.model); disposeGroup(s.model); }
    const model = new THREE.Group();
    if (config.product === "kitchen") buildKitchen(model, config);
    else buildDesk(model, config);
    s.scene.add(model);
    s.model = model;

    // framing: builders attach a focus (room centre + radius); fall back to bbox
    let focus = model.userData.focus;
    if (!focus) {
      const bbox = new THREE.Box3().setFromObject(model);
      const c = bbox.getCenter(new THREE.Vector3()), sz = bbox.getSize(new THREE.Vector3());
      focus = { cx: c.x, cy: sz.y / 2, cz: c.z, radius: Math.max(2.6, Math.max(sz.x, sz.y, sz.z) * 1.7) };
    }
    // keep the user's orbit on small tweaks; only re-frame on product switch
    // or when the scene no longer fits the view.
    const productChanged = s.lastProduct !== config.product;
    const fitR = focus.radius;
    s.target.set(focus.cx, focus.cy, focus.cz);
    if (productChanged || s.radius < fitR * 0.5 || s.radius > fitR * 1.9) s.radius = fitR;
    s.lastProduct = config.product;
    s.updateCam && s.updateCam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoSig]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 4, overflow: "hidden", background: "radial-gradient(120% 100% at 50% 0%, #FBF8F2 0%, #EFE7D9 55%, #E2D6C2 100%)" }}>
      <div ref={mountRef} style={{ position: "absolute", inset: 0 }} />
      <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(36,31,27,.72)", color: "#fff", fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12, padding: "6px 12px", borderRadius: 999 }}>
          <MousePointer2 size={13} /> {STR.drag[lang]}
        </span>
      </div>
    </div>
  );
}

/* ===================== UI PRIMITIVES ===================== */
function Choice({ active, onClick, icon: Icon, title, sub, big }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ textAlign: "start", cursor: "pointer", background: active ? C.charcoal : C.paper, border: `1.5px solid ${active ? C.charcoal : h ? C.lineDark : C.line}`, borderRadius: 4, padding: big ? "26px 24px" : "18px 18px", transition: "all .2s", display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
      {Icon && <Icon size={big ? 28 : 22} style={{ color: active ? C.oak : C.walnutDark }} />}
      <span style={{ fontFamily: "'Fraunces',serif", fontSize: big ? 22 : 17, color: active ? "#fff" : C.walnutDark }}>{title}</span>
      {sub && <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 14, lineHeight: 1.5, color: active ? "rgba(255,255,255,.7)" : C.muted }}>{sub}</span>}
    </button>
  );
}

function Swatches({ items, value, onChange, lang }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 12 }}>
      {items.map((it) => {
        const active = value === it.id;
        return (
          <button key={it.id} onClick={() => onChange(it.id)} title={it.l[lang]}
            style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: 8, background: "none", border: "none", padding: 0, textAlign: "start" }}>
            <span style={{ position: "relative", width: "100%", height: 58, borderRadius: 8, background: swatchBg(it.id, it.c), backgroundColor: it.c || "transparent", border: it.c ? `1px solid rgba(0,0,0,.14)` : `2px dashed ${active ? C.oak : C.line}`, boxShadow: active ? `0 0 0 2px ${C.paper}, 0 0 0 4px ${C.oak}, 0 6px 14px -8px rgba(62,44,30,.5)` : "0 1px 2px rgba(62,44,30,.12)", transition: "all .15s", display: "grid", placeItems: "center", overflow: "hidden" }}>
              {!it.c && <X size={18} style={{ color: C.muted }} />}
              {active && it.c && <span style={{ position: "absolute", top: 6, insetInlineEnd: 6, width: 18, height: 18, borderRadius: 999, background: C.oak, display: "grid", placeItems: "center" }}><Check size={12} color="#fff" /></span>}
            </span>
            <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12.5, lineHeight: 1.25, color: active ? C.walnutDark : C.muted, fontWeight: active ? 700 : 500 }}>{it.l[lang]}</span>
          </button>
        );
      })}
    </div>
  );
}

function Pills({ items, value, onChange, lang }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
      {items.map((it) => {
        const active = value === it.id;
        return (
          <button key={it.id} onClick={() => onChange(it.id)}
            style={{ cursor: "pointer", fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 600, fontSize: 14, padding: "10px 16px", borderRadius: 999, border: `1.5px solid ${active ? C.walnutDark : C.line}`, background: active ? C.walnutDark : "transparent", color: active ? "#fff" : C.walnut, transition: "all .18s" }}>
            {it.l[lang]}
          </button>
        );
      })}
    </div>
  );
}

function Counter({ label, value, min, max, onChange }) {
  const btn = { width: 38, height: 38, borderRadius: 999, border: `1.5px solid ${C.lineDark}`, background: "transparent", cursor: "pointer", display: "grid", placeItems: "center", color: C.walnutDark };
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: `1px solid ${C.line}` }}>
      <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 15.5, color: C.ink, fontWeight: 600 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button style={{ ...btn, opacity: value <= min ? 0.4 : 1 }} onClick={() => onChange(Math.max(min, value - 1))}><Minus size={16} /></button>
        <span style={{ fontFamily: "'Fraunces',serif", fontSize: 22, color: C.walnutDark, minWidth: 26, textAlign: "center" }}>{value}</span>
        <button style={{ ...btn, opacity: value >= max ? 0.4 : 1 }} onClick={() => onChange(Math.min(max, value + 1))}><Plus size={16} /></button>
      </div>
    </div>
  );
}

function Range({ label, value, min, max, unit, onChange }) {
  return (
    <label style={{ display: "block", padding: "10px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 15, color: C.ink, fontWeight: 600 }}>{label}</span>
        <span style={{ fontFamily: "'Fraunces',serif", fontSize: 19, color: C.walnutDark }}>{value} <span style={{ fontSize: 13, color: C.muted, fontFamily: "'Hanken Grotesk',sans-serif" }}>{unit}</span></span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(+e.target.value)}
        style={{ width: "100%", accentColor: C.oak, cursor: "pointer", height: 6 }} />
    </label>
  );
}

function Toggle({ label, sub, value, onChange }) {
  return (
    <button onClick={() => onChange(!value)}
      style={{ width: "100%", textAlign: "start", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "16px 18px", border: `1.5px solid ${value ? C.oak : C.line}`, background: value ? "rgba(176,121,74,.08)" : C.paper, borderRadius: 4, cursor: "pointer", transition: "all .18s" }}>
      <span>
        <span style={{ display: "block", fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 15, fontWeight: 600, color: C.walnutDark }}>{label}</span>
        {sub && <span style={{ display: "block", fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13, color: C.muted, marginTop: 2 }}>{sub}</span>}
      </span>
      <span style={{ flexShrink: 0, width: 46, height: 27, borderRadius: 999, background: value ? C.oak : "#D8CDBD", position: "relative", transition: "all .2s" }}>
        <span style={{ position: "absolute", top: 3, left: value ? 22 : 3, width: 21, height: 21, borderRadius: 999, background: "#fff", transition: "all .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
      </span>
    </button>
  );
}

function SectionTitle({ children, sub, lang }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 500, fontSize: "clamp(1.5rem,3vw,2rem)", color: C.walnutDark, lineHeight: 1.1 }}>{children}</h2>
      {sub && <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 15.5, color: C.muted, marginTop: 8, lineHeight: 1.5 }}>{sub}</p>}
    </div>
  );
}
function FieldLabel({ children }) {
  return <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: C.oakDeep, margin: "26px 0 14px" }}>{children}</div>;
}

const inputStyle = { width: "100%", fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 15.5, color: C.ink, background: C.paper, border: `1px solid ${C.line}`, borderRadius: 3, padding: "13px 15px", outline: "none", boxSizing: "border-box" };

/* ===================== MODULAR CABINET BUILDER ===================== */
/* little catalogue thumbnail drawn per cabinet type */
function UnitThumb({ kind }) {
  const wood = "#C49A6C", ln = "#8A6A45", dk = "#2A2724", steel = "#CFD3D4", glass = "#23303A";
  const body = <rect x="2.5" y="2.5" width="45" height="51" rx="3.5" fill={wood} stroke={ln} strokeWidth="1.4" />;
  const parts = {
    door: (<>{body}<line x1="25" y1="6" x2="25" y2="50" stroke={ln} strokeWidth="1.1" /><circle cx="22" cy="28" r="1.5" fill={dk} /><circle cx="28" cy="28" r="1.5" fill={dk} /></>),
    drawers: (<>{body}{[14, 26, 38].map((y) => (<g key={y}><rect x="6" y={y - 5} width="38" height="9" rx="1.5" fill="none" stroke={ln} strokeWidth="1" /><rect x="20" y={y - 1.5} width="10" height="2" rx="1" fill={dk} /></g>))}</>),
    open: (<>{body}<rect x="6" y="6" width="38" height="43" fill="#EFE6D6" /><line x1="6" y1="22" x2="44" y2="22" stroke={ln} strokeWidth="1.4" /><line x1="6" y1="36" x2="44" y2="36" stroke={ln} strokeWidth="1.4" /></>),
    sink: (<>{body}<ellipse cx="25" cy="15" rx="13" ry="6" fill={steel} stroke={ln} strokeWidth="1" /><path d="M25 9 v-3 h4" fill="none" stroke={dk} strokeWidth="1.4" /><line x1="25" y1="27" x2="25" y2="50" stroke={ln} strokeWidth="1" /></>),
    oven: (<>{body}<rect x="10" y="5" width="30" height="4" rx="1" fill={dk} /><rect x="7" y="11" width="36" height="23" rx="2" fill={glass} stroke={dk} strokeWidth="1" /><rect x="14" y="37" width="22" height="11" rx="1.5" fill="none" stroke={ln} strokeWidth="1" /></>),
    dishwasher: (<>{body}<rect x="8" y="5" width="34" height="4" rx="1" fill={dk} /><rect x="6" y="11" width="38" height="38" rx="2" fill="none" stroke={ln} strokeWidth="1" /><circle cx="12" cy="7" r="1" fill="#9AAE9A" /></>),
    file: (<>{body}{[18, 38].map((y) => (<g key={y}><rect x="6" y={y - 11} width="38" height="20" rx="1.5" fill="none" stroke={ln} strokeWidth="1" /><rect x="18" y={y - 3} width="14" height="2.4" rx="1" fill={dk} /></g>))}</>),
  };
  return <svg viewBox="0 0 50 56" width="100%" height="44" style={{ display: "block" }}>{parts[kind] || parts.door}</svg>;
}

function UnitBuilder({ cfg, lang, uctl, kinds = UNIT_KINDS, labels }) {
  const tt = (en, ar) => (lang === "ar" ? ar : en);
  const L0 = labels || { title: tt("Cabinet layout — box by box", "بناء الخزائن — حتة حتة"), cat: tt("Cabinet catalogue", "كتالوج الخزائن"), empty: tt("Add your first cabinet below.", "أضف أول خزانة من تحت."), sel: tt("Selected cabinet", "الخزانة المختارة") };
  const units = uctl.units || [];
  const total = units.reduce((a, u) => a + (u.w || 60), 0) || 1;
  const sel = units.find((u) => u.id === cfg.selectedUnit);
  const drag = useRef({ from: null });
  const miniBtn = { cursor: "pointer", flex: 1, padding: "9px 10px", borderRadius: 4, border: `1.5px solid ${C.lineDark}`, background: "transparent", color: C.walnutDark, fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 600, fontSize: 13 };

  return (
    <div style={{ marginTop: 8 }}>
      <FieldLabel>{L0.title}</FieldLabel>
      <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13.5, color: C.muted, marginTop: -6, marginBottom: 12, lineHeight: 1.5 }}>
        {tt("Tap a box to edit it · drag to reorder · or drag the highlighted box inside the 3D view.", "دوس على صندوق لتعديله · اسحبه لإعادة الترتيب · أو اسحب الصندوق المظلّل جوّه مشهد الـ 3D.")}
      </p>

      {/* top-down lane (2D plan) */}
      <div style={{ display: "flex", gap: 4, border: `1px solid ${C.line}`, background: C.cream, borderRadius: 8, padding: 8, overflowX: "auto", minHeight: 92 }}>
        {units.length === 0 && <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13, color: C.muted, padding: "32px 12px", margin: "0 auto" }}>{L0.empty}</span>}
        {units.map((u, i) => {
          const k = unitKind(u.kind); const active = u.id === cfg.selectedUnit;
          return (
            <div key={u.id} draggable
              onDragStart={() => { drag.current.from = i; }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (drag.current.from != null) uctl.move(drag.current.from, i); drag.current.from = null; }}
              onClick={() => uctl.select(u.id)} title={k.l[lang]}
              style={{ flex: `${u.w} 1 ${Math.max(58, (u.w / total) * 100)}px`, minWidth: 58, cursor: "grab", borderRadius: 6, border: `2px solid ${active ? C.oak : C.line}`, background: active ? "rgba(176,121,74,.14)" : C.paper, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "10px 4px", boxShadow: active ? "0 5px 14px -7px rgba(176,121,74,.7)" : "none" }}>
              <span style={{ fontSize: 22, lineHeight: 1, color: C.walnutDark }}>{k.icon}</span>
              <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 11, color: active ? C.walnutDark : C.muted, fontWeight: active ? 700 : 500, textAlign: "center", lineHeight: 1.2 }}>{k.l[lang]}</span>
              <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 10, color: C.muted }}>{u.w}{tt("cm", "سم")}</span>
            </div>
          );
        })}
      </div>

      {/* catalogue: pick a box to add */}
      <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: C.oakDeep, margin: "18px 0 10px" }}>
        {L0.cat}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))", gap: 10 }}>
        {kinds.map((k) => (
          <div key={k.id} style={{ border: `1px solid ${C.line}`, borderRadius: 10, background: C.paper, padding: "10px 10px 11px", display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
            <div style={{ width: "100%", background: C.cream, borderRadius: 6, padding: "7px 12px" }}><UnitThumb kind={k.id} /></div>
            <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12, fontWeight: 600, color: C.walnutDark, textAlign: "center", lineHeight: 1.25, minHeight: 30, display: "flex", alignItems: "center" }}>{k.l[lang]}</span>
            <button onClick={() => uctl.add(k.id)}
              style={{ width: "100%", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, background: "#2E8B57", color: "#fff", border: "none", borderRadius: 6, padding: "7px 8px", fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 700, fontSize: 12.5 }}>
              <Plus size={13} /> {tt("Add", "أضف")}
            </button>
          </div>
        ))}
      </div>

      {/* selected-unit editor */}
      {sel && (
        <div style={{ marginTop: 14, border: `1.5px solid ${C.oak}`, borderRadius: 8, padding: "16px 18px", background: "rgba(176,121,74,.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontFamily: "'Fraunces',serif", fontSize: 18, color: C.walnutDark }}>{L0.sel}</span>
            <button onClick={() => uctl.remove(sel.id)} style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, color: "#A23B2E", background: "none", border: "none", fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 600, fontSize: 13 }}>
              <Trash2 size={15} /> {tt("Remove", "حذف")}
            </button>
          </div>
          <Pills lang={lang} value={sel.kind} onChange={(v) => uctl.update(sel.id, { kind: v, w: unitKind(v).def })} items={kinds} />
          <Range label={tt("Width", "العرض")} value={sel.w} min={unitKind(sel.kind).min} max={unitKind(sel.kind).max} unit={tt("cm", "سم")} onChange={(v) => uctl.update(sel.id, { w: v })} />
          {sel.kind === "drawers" && (
            <Counter label={tt("Number of drawers", "عدد الأدراج")} value={sel.drawers || 3} min={1} max={6} onChange={(v) => uctl.update(sel.id, { drawers: v })} />
          )}
          {(sel.kind === "open" || sel.kind === "door") && (
            <Counter label={tt("Number of shelves", "عدد الرفوف")} value={sel.shelves || 2} min={1} max={5} onChange={(v) => uctl.update(sel.id, { shelves: v })} />
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <button onClick={() => uctl.reorder(sel.id, -1)} style={miniBtn}>← {tt("Move", "تحريك")}</button>
            <button onClick={() => uctl.reorder(sel.id, 1)} style={miniBtn}>{tt("Move", "تحريك")} →</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===================== APP ===================== */
export default function App() {
  const [lang, setLang] = useState("ar");
  const [step, setStep] = useState(0);
  const [cfg, setCfg] = useState(DEFAULTS);
  const [sent, setSent] = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const snapRef = useRef(null);
  const fileRef = useRef(null);

  // preselect product from /configure?product=Kitchen|Office%20Desk + restore language
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search).get("product");
    if (p) setCfg((c) => ({ ...c, product: /esk/i.test(p) ? "desk" : "kitchen" }));
    const saved = window.localStorage.getItem("hewn-lang");
    if (saved === "en" || saved === "ar") setLang(saved);
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem("hewn-lang", lang);
  }, [lang]);

  const [expanded, setExpanded] = useState(false);
  const dir = lang === "ar" ? "rtl" : "ltr";
  const t = (key) => STR[key][lang];
  const set = (k) => (v) => setCfg((c) => ({ ...c, [k]: v }));
  const isK = cfg.product === "kitchen";
  const price = priceRange(cfg);

  // modular unit controller — works for the active product (kitchen or desk),
  // shared by the catalogue, the 2D lane and the 3D scene
  const uField = isK ? "kUnits" : "dUnits";
  const uctl = {
    units: cfg[uField] || [],
    selected: cfg.selectedUnit,
    select: (id) => setCfg((c) => ({ ...c, selectedUnit: c.selectedUnit === id ? null : id })),
    add: (kind) => setCfg((c) => ({ ...c, [uField]: [...(c[uField] || []), makeUnit(kind)], selectedUnit: null })),
    remove: (id) => setCfg((c) => ({ ...c, [uField]: (c[uField] || []).filter((x) => x.id !== id), selectedUnit: c.selectedUnit === id ? null : c.selectedUnit })),
    update: (id, patch) => setCfg((c) => ({ ...c, [uField]: (c[uField] || []).map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
    move: (from, to) => setCfg((c) => { const u = [...(c[uField] || [])]; if (from < 0 || to < 0 || from >= u.length || to >= u.length) return c; const [m] = u.splice(from, 1); u.splice(to, 0, m); return { ...c, [uField]: u }; }),
    reorder: (id, dir2) => setCfg((c) => { const u = [...(c[uField] || [])]; const i = u.findIndex((x) => x.id === id); const j = i + dir2; if (i < 0 || j < 0 || j >= u.length) return c; [u[i], u[j]] = [u[j], u[i]]; return { ...c, [uField]: u }; }),
  };

  const totalSteps = STR.steps.length;
  const goNext = () => {
    if (step === 4 && snapRef.current) setSnapshot(snapRef.current());
    setStep((s) => Math.min(totalSteps - 1, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goBack = () => { setStep((s) => Math.max(0, s - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const buildSummary = () => ({ ...cfg, price, snapshot, language: lang, createdAt: new Date().toISOString() });
  const saveDesign = () => {
    // production: localStorage.setItem('hewn-design', JSON.stringify(buildSummary()))
    const blob = new Blob([JSON.stringify(buildSummary(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `hewn-oak-${cfg.product}-design.json`;
    a.click();
  };
  const handleSubmit = () => {
    // WIRE HERE: POST buildSummary() to email / DB / API / Firebase
    setSent(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const reset = () => { setCfg(DEFAULTS); setStep(0); setSent(false); setSnapshot(null); };

  /* ---- success ---- */
  if (sent) {
    return (
      <Shell lang={lang} setLang={setLang} dir={dir} hideProgress>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center", padding: "clamp(50px,10vw,120px) 0" }}>
          <div style={{ width: 72, height: 72, borderRadius: 999, background: C.oak, display: "grid", placeItems: "center", margin: "0 auto 28px" }}><Check size={34} color="#fff" /></div>
          <h1 style={{ fontFamily: "'Fraunces',serif", fontWeight: 500, fontSize: "clamp(1.8rem,4vw,2.6rem)", color: C.walnutDark, marginBottom: 16 }}>{t("successTitle")}</h1>
          <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 17, lineHeight: 1.65, color: C.muted, marginBottom: 30 }}>{t("successBody")}</p>
          {snapshot && <img src={snapshot} alt="design" style={{ width: "100%", maxWidth: 420, borderRadius: 6, border: `1px solid ${C.line}`, marginBottom: 30 }} />}
          <button onClick={reset} style={btnSolid}>{t("newDesign")} <ArrowRight size={17} /></button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell lang={lang} setLang={setLang} dir={dir} step={step} totalSteps={totalSteps} onSave={saveDesign}>
      <div style={{ display: "flex", flexDirection: "column-reverse", gap: 26 }} className="cfg-grid">
        {/* CONTROLS */}
        <div style={{ flex: "1 1 31%", minWidth: 300, maxWidth: 470 }} className="cfg-controls">
          <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 6, padding: "clamp(22px,3.5vw,36px)" }}>
            {step === 0 && <StepProduct cfg={cfg} set={set} t={t} lang={lang} />}
            {step === 1 && <StepDimensions cfg={cfg} set={set} t={t} lang={lang} isK={isK} uctl={uctl} />}
            {step === 2 && <StepMaterials cfg={cfg} set={set} t={t} lang={lang} isK={isK} />}
            {step === 3 && <StepStorage cfg={cfg} set={set} t={t} lang={lang} isK={isK} />}
            {step === 4 && <StepReview cfg={cfg} t={t} lang={lang} isK={isK} price={price} snapshot={snapshot} />}
            {step === 5 && <StepSubmit cfg={cfg} set={set} t={t} lang={lang} fileRef={fileRef} />}
          </div>

          {/* nav */}
          <div style={{ display: "flex", gap: 12, marginTop: 18, alignItems: "center", flexWrap: "wrap" }}>
            {step > 0 && <button onClick={goBack} style={btnOutline}>{dir === "rtl" ? <ArrowRight size={17} /> : <ArrowLeft size={17} />} {t("back")}</button>}
            <div style={{ flex: 1 }} />
            {step < 4 && <button onClick={goNext} style={btnSolid}>{t("next")} {dir === "rtl" ? <ArrowLeft size={17} /> : <ArrowRight size={17} />}</button>}
            {step === 4 && <button onClick={goNext} style={btnSolid}>{t("submit")} {dir === "rtl" ? <ArrowLeft size={17} /> : <ArrowRight size={17} />}</button>}
            {step === 5 && <button onClick={handleSubmit} style={btnSolid}><Send size={16} /> {t("submit")}</button>}
          </div>
        </div>

        {/* PREVIEW + SUMMARY */}
        <div style={{ flex: "1 1 69%", minWidth: 0 }} className="cfg-preview">
          <div className="cfg-sticky">
            <div className="cfg-stage" style={{ position: "relative", aspectRatio: "4 / 3.6", border: `1px solid ${C.line}`, borderRadius: 6, overflow: "hidden", marginBottom: 16, boxShadow: "0 20px 50px -34px rgba(62,44,30,.55)" }}>
              <Preview3D config={cfg} lang={lang} snapRef={snapRef} onPickUnit={uctl.select} onReorder={uctl.reorder} />
              <button onClick={() => setExpanded(true)} title={lang === "ar" ? "تكبير" : "Expand"}
                style={{ position: "absolute", top: 10, insetInlineEnd: 10, zIndex: 5, display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(36,31,27,.78)", color: "#fff", border: "none", borderRadius: 999, padding: "8px 13px", cursor: "pointer", fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12.5, fontWeight: 600 }}>
                <Maximize2 size={14} /> {lang === "ar" ? "تكبير" : "Expand"}
              </button>
            </div>
            <SummaryPanel cfg={cfg} t={t} lang={lang} isK={isK} price={price} />
          </div>
        </div>
      </div>

      {expanded && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setExpanded(false); }}
          style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(24,20,17,.82)", display: "flex", flexDirection: "column", padding: "clamp(10px,2vw,28px)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontFamily: "'Fraunces',serif", fontSize: 20, color: "#fff" }}>{isK ? t("kitchen") : t("desk")}</span>
            <button onClick={() => setExpanded(false)} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", color: C.charcoal, border: "none", borderRadius: 999, padding: "9px 16px", cursor: "pointer", fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 700, fontSize: 14 }}>
              <X size={16} /> {lang === "ar" ? "إغلاق" : "Close"}
            </button>
          </div>
          <div style={{ flex: 1, minHeight: 0, borderRadius: 10, overflow: "hidden", background: "#EFE7D9" }}>
            <Preview3D config={cfg} lang={lang} onPickUnit={uctl.select} onReorder={uctl.reorder} />
          </div>
          {isK && (
            <div style={{ marginTop: 12, background: C.paper, borderRadius: 10, padding: "14px 16px", maxHeight: "34vh", overflowY: "auto" }}>
              <UnitBuilder cfg={cfg} lang={lang} uctl={uctl} />
            </div>
          )}
        </div>
      )}
    </Shell>
  );
}

/* ---- step panels ---- */
function StepProduct({ cfg, set, t, lang }) {
  return (
    <div>
      <SectionTitle sub={t("chooseProductSub")} lang={lang}>{t("chooseProduct")}</SectionTitle>
      <div className="grid sm:grid-cols-2" style={{ gap: 16 }}>
        <Choice big active={cfg.product === "kitchen"} onClick={() => set("product")("kitchen")} icon={ChefHat} title={t("kitchen")} sub={t("kitchenCard")} />
        <Choice big active={cfg.product === "desk"} onClick={() => set("product")("desk")} icon={Briefcase} title={t("desk")} sub={t("deskCard")} />
      </div>
    </div>
  );
}

function StepDimensions({ cfg, set, t, lang, isK, uctl }) {
  return (
    <div>
      <SectionTitle lang={lang}>{t("dims")}</SectionTitle>
      {isK ? (
        <>
          <FieldLabel>{L("The room", "الغرفة")[lang]}</FieldLabel>
          <Range label={L("Wall width", "عرض الحيطة")[lang]} value={cfg.kW} min={180} max={720} unit={t("cm")} onChange={set("kW")} />
          <Range label={L("Room depth", "عمق الغرفة")[lang]} value={cfg.roomL} min={200} max={600} unit={t("cm")} onChange={set("roomL")} />
          <Range label={L("Room height", "ارتفاع الغرفة")[lang]} value={cfg.kH} min={220} max={330} unit={t("cm")} onChange={set("kH")} />
          <Range label={L("Cabinet depth", "عمق الخزائن")[lang]} value={cfg.kD} min={50} max={70} unit={t("cm")} onChange={set("kD")} />
          <UnitBuilder cfg={cfg} lang={lang} uctl={uctl} />
          <div style={{ marginTop: 18 }}>
            <Counter label={t("upperCab")} value={cfg.kUpper} min={0} max={10} onChange={set("kUpper")} />
          </div>
          <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
            <Toggle label={t("tallUnit")} value={cfg.kTall} onChange={set("kTall")} />
            <Toggle label={t("island")} value={cfg.kIsland} onChange={set("kIsland")} />
          </div>
        </>
      ) : (
        <>
          <FieldLabel>{L("The desk", "المكتب")[lang]}</FieldLabel>
          <Range label={L("Min width", "أقل عرض")[lang]} value={cfg.dW} min={100} max={300} unit={t("cm")} onChange={set("dW")} />
          <Range label={t("depth")} value={cfg.dD} min={55} max={90} unit={t("cm")} onChange={set("dD")} />
          <Range label={t("height")} value={cfg.dH} min={68} max={80} unit={t("cm")} onChange={set("dH")} />
          <FieldLabel>{t("deskShape")}</FieldLabel>
          <Pills lang={lang} value={cfg.dShape} onChange={set("dShape")} items={[{ id: "straight", l: L("Straight", "مستقيم") }, { id: "l", l: L("L-shape", "حرف L") }, { id: "exec", l: L("Executive", "تنفيذي") }]} />
          <UnitBuilder cfg={cfg} lang={lang} uctl={uctl} kinds={DESK_KINDS}
            labels={{
              title: L("Desk modules — box by box", "وحدات المكتب — حتة حتة")[lang],
              cat: L("Module catalogue", "كتالوج الوحدات")[lang],
              empty: L("Empty desk. Add a module from the catalogue below.", "مكتب فاضي. أضف وحدة من الكتالوج تحت.")[lang],
              sel: L("Selected module", "الوحدة المختارة")[lang],
            }} />
          <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
            <Toggle label={t("cableMgmt")} value={cfg.dCable} onChange={set("dCable")} />
            <Toggle label={t("monitorShelf")} value={cfg.dMonitor} onChange={set("dMonitor")} />
            <Toggle label={t("keyboardTray")} value={cfg.dKeyboard} onChange={set("dKeyboard")} />
          </div>
        </>
      )}
    </div>
  );
}

function StepMaterials({ cfg, set, t, lang, isK }) {
  return (
    <div>
      <SectionTitle lang={lang}>{t("matsTitle")}</SectionTitle>
      <FieldLabel>{t("woodFinish")}</FieldLabel>
      <Swatches items={WOODS} value={cfg.wood} onChange={set("wood")} lang={lang} />
      <FieldLabel>{t("finishType")}</FieldLabel>
      <Pills lang={lang} value={cfg.gloss ? "gloss" : "matte"} onChange={(v) => set("gloss")(v === "gloss")} items={[{ id: "matte", l: STR.matte }, { id: "gloss", l: STR.glossy }]} />
      <FieldLabel>{t("doorStyle")}</FieldLabel>
      <Pills lang={lang} value={cfg.doorStyle} onChange={set("doorStyle")} items={DOORS} />
      <FieldLabel>{t("handle")}</FieldLabel>
      <Pills lang={lang} value={cfg.handle} onChange={set("handle")} items={HANDLES} />
      <FieldLabel>{t("hardware")}</FieldLabel>
      <Pills lang={lang} value={cfg.hardware} onChange={set("hardware")} items={HARDWARE} />
      {isK && (
        <div style={{ marginTop: 22 }}>
          <Toggle label={t("led")} sub={L("Warm glow strip under wall units", "شريط إضاءة دافئ تحت الوحدات العلوية")[lang]} value={cfg.led} onChange={set("led")} />
        </div>
      )}
      {isK ? (
        <>
          <FieldLabel>{t("countertop")}</FieldLabel>
          <Swatches items={COUNTERS} value={cfg.counter} onChange={set("counter")} lang={lang} />
          <FieldLabel>{t("backsplash")}</FieldLabel>
          <Swatches items={SPLASH} value={cfg.backsplash} onChange={set("backsplash")} lang={lang} />
        </>
      ) : (
        <>
          <FieldLabel>{t("deskTop")}</FieldLabel>
          <Swatches items={DESKTOPS} value={cfg.deskTop} onChange={set("deskTop")} lang={lang} />
          <FieldLabel>{t("legStyle")}</FieldLabel>
          <Pills lang={lang} value={cfg.leg} onChange={set("leg")} items={LEGS} />
        </>
      )}
    </div>
  );
}

function StepStorage({ cfg, set, t, lang, isK }) {
  const kItems = [
    ["fridge", L("Fridge space", "مساحة ثلاجة")], ["microwave", L("Microwave unit", "وحدة ميكروويف")],
    ["openShelf", L("Wall open shelves", "أرفف حائط مفتوحة")], ["pantry", L("Pantry unit", "وحدة مؤن")],
    ["corner", L("Corner unit", "وحدة ركنية")],
  ];
  const dItems = [
    ["closed", L("Closed storage", "تخزين مغلق")], ["cpu", L("CPU space", "مساحة كمبيوتر")],
    ["printer", L("Printer shelf", "رف طابعة")], ["fileCab", L("File cabinet", "خزانة ملفات")],
    ["cableHole", L("Hidden cable hole", "فتحة كابلات مخفية")], ["grommet", L("Grommet management", "إدارة بفتحة")],
  ];
  const items = isK ? kItems : dItems;
  return (
    <div>
      <SectionTitle sub={t("storageSub")} lang={lang}>{t("storageTitle")}</SectionTitle>
      {isK && (
        <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13.5, color: C.muted, marginBottom: 14, lineHeight: 1.5 }}>
          {L("Sink, oven, drawers and dishwashers are placed as cabinets in the Dimensions step.", "الحوض والفرن والأدراج وغسالة الأطباق بتتحط كخزائن في خطوة الأبعاد.")[lang]}
        </p>
      )}
      <div className="grid sm:grid-cols-2" style={{ gap: 12, marginTop: 10 }}>
        {items.map(([k, lbl]) => <Toggle key={k} label={lbl[lang]} value={cfg[k]} onChange={set(k)} />)}
      </div>
    </div>
  );
}

function rowsFor(cfg, lang, isK, t) {
  const wood = WOODS.find((w) => w.id === cfg.wood).l[lang];
  const base = [
    [t("product"), isK ? t("kitchen") : t("desk")],
    [STR.width[lang], `${isK ? cfg.kW : cfg.dW} ${t("cm")}`],
    [STR.depth[lang], `${isK ? cfg.kD : cfg.dD} ${t("cm")}`],
    [STR.height[lang], `${isK ? cfg.kH : cfg.dH} ${t("cm")}`],
    [STR.woodFinish[lang], wood + (cfg.gloss ? ` · ${STR.glossy[lang]}` : ` · ${STR.matte[lang]}`)],
    [STR.doorStyle[lang], (DOORS.find((d) => d.id === cfg.doorStyle) || DOORS[0]).l[lang]],
  ];
  if (isK) {
    base.push([STR.layout[lang], { straight: "Straight", l: "L-shape", u: "U-shape" }[cfg.kLayout]]);
    base.push([STR.lowerCab[lang] + " / " + STR.upperCab[lang], `${(cfg.kUnits || []).length} / ${cfg.kUpper}`]);
    base.push([STR.countertop[lang], COUNTERS.find((x) => x.id === cfg.counter).l[lang]]);
  } else {
    base.push([STR.deskShape[lang], { straight: "Straight", l: "L-shape", exec: "Executive" }[cfg.dShape]]);
    base.push([L("Modules", "الوحدات")[lang], `${(cfg.dUnits || []).length}`]);
    base.push([STR.deskTop[lang], DESKTOPS.find((x) => x.id === cfg.deskTop).l[lang]]);
  }
  return base;
}
function featureList(cfg, lang, isK) {
  const map = isK
    ? { kTall: L("Tall unit", "وحدة طويلة"), kIsland: L("Island", "جزيرة"), corner: L("Corner unit", "ركنية"), fridge: L("Fridge", "ثلاجة"), microwave: L("Microwave", "ميكروويف"), openShelf: L("Open shelves", "أرفف"), pantry: L("Pantry", "مؤن"), led: L("LED lighting", "إضاءة LED") }
    : { dSide: L("Side unit", "جانبية"), dCable: L("Cable mgmt", "كابلات"), dMonitor: L("Monitor shelf", "رف شاشة"), dKeyboard: L("Keyboard tray", "درج كيبورد"), closed: L("Closed storage", "مغلق"), cpu: L("CPU space", "كمبيوتر"), printer: L("Printer shelf", "طابعة"), fileCab: L("File cabinet", "ملفات") };
  const feats = Object.keys(map).filter((k) => cfg[k]).map((k) => map[k][lang]);
  if (isK) {
    const kinds = new Set((cfg.kUnits || []).map((u) => u.kind));
    if (kinds.has("oven")) feats.unshift(L("Oven + hob", "فرن + بوتاجاز")[lang]);
    if (kinds.has("sink")) feats.unshift(L("Sink", "حوض")[lang]);
    if (kinds.has("dishwasher")) feats.push(L("Dishwasher", "غسالة أطباق")[lang]);
  }
  return feats;
}

function StepReview({ cfg, t, lang, isK, price, snapshot }) {
  const rows = rowsFor(cfg, lang, isK, t);
  const feats = featureList(cfg, lang, isK);
  return (
    <div>
      <SectionTitle lang={lang}>{t("reviewTitle")}</SectionTitle>
      {snapshot && <img src={snapshot} alt="preview" style={{ width: "100%", borderRadius: 6, border: `1px solid ${C.line}`, marginBottom: 22 }} />}
      <div style={{ border: `1px solid ${C.line}`, borderRadius: 6, overflow: "hidden", marginBottom: 22 }}>
        {rows.map(([k, v], i) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "13px 18px", background: i % 2 ? C.paper : "transparent", borderBottom: i < rows.length - 1 ? `1px solid ${C.line}` : "none" }}>
            <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 14.5, color: C.muted }}>{k}</span>
            <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 14.5, color: C.walnutDark, fontWeight: 600, textAlign: "end" }}>{v}</span>
          </div>
        ))}
      </div>
      <FieldLabel>{t("features")}</FieldLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {feats.length ? feats.map((f) => <span key={f} style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13.5, background: C.sand, padding: "7px 13px", borderRadius: 999, color: C.ink }}>{f}</span>) : <span style={{ color: C.muted, fontFamily: "'Hanken Grotesk',sans-serif" }}>{t("none")}</span>}
      </div>
      <div style={{ marginTop: 26, padding: "20px 22px", background: C.charcoal, borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12.5, letterSpacing: ".12em", textTransform: "uppercase", color: C.oak, fontWeight: 700 }}>{t("estPrice")}</div>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 27, color: "#fff", marginTop: 4 }}>EGP {fmt(price.low)} – {fmt(price.high)}</div>
        </div>
        <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12.5, color: "rgba(255,255,255,.55)", maxWidth: 180 }}>{t("indicative")}</span>
      </div>
    </div>
  );
}

function StepSubmit({ cfg, set, t, lang, fileRef }) {
  return (
    <div>
      <SectionTitle lang={lang}>{t("contactTitle")}</SectionTitle>
      <div className="grid sm:grid-cols-2" style={{ gap: 16 }}>
        <Inp label={t("name")} req value={cfg.name} onChange={set("name")} />
        <Inp label={t("phone")} req value={cfg.phone} onChange={set("phone")} ph="+20 ___ ___ ____" />
        <Inp label={t("email")} req value={cfg.email} onChange={set("email")} type="email" ph="you@email.com" />
        <Inp label={t("city")} req value={cfg.city} onChange={set("city")} />
      </div>
      <div style={{ marginTop: 16 }}>
        <Lbl>{t("notes")}</Lbl>
        <textarea style={{ ...inputStyle, minHeight: 100, resize: "vertical", lineHeight: 1.55 }} value={cfg.notes} onChange={(e) => set("notes")(e.target.value)} placeholder={STR.notesPh[lang]} />
      </div>
      <div style={{ marginTop: 16 }}>
        <Lbl>{t("inspo")}</Lbl>
        <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", border: `1px dashed ${C.lineDark}`, borderRadius: 4, padding: "16px 18px", background: C.cream }}>
          <Upload size={18} style={{ color: C.oakDeep }} />
          <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 14.5, color: cfg.file ? C.ink : C.muted }}>{cfg.file || STR.inspoPh[lang]}</span>
          <input ref={fileRef} type="file" accept="image/*" onChange={(e) => set("file")(e.target.files?.[0]?.name || "")} style={{ display: "none" }} />
        </label>
      </div>
    </div>
  );
}
function Lbl({ children }) { return <span style={{ display: "block", fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13.5, fontWeight: 700, color: C.walnut, marginBottom: 8 }}>{children}</span>; }
function Inp({ label, value, onChange, ph, type, req }) {
  return <label style={{ display: "block" }}><Lbl>{label}{req && <span style={{ color: C.oakDeep }}> *</span>}</Lbl><input style={inputStyle} type={type || "text"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={ph} /></label>;
}

/* ---- summary panel (sidebar) ---- */
function SummaryPanel({ cfg, t, lang, isK, price }) {
  const feats = featureList(cfg, lang, isK);
  const wood = WOODS.find((w) => w.id === cfg.wood);
  return (
    <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 6, padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
        <ClipboardList size={18} style={{ color: C.oakDeep }} />
        <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: C.walnut }}>{t("summary")}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ width: 26, height: 26, borderRadius: 999, background: wood.c, border: "1px solid rgba(0,0,0,.1)" }} />
        <span style={{ fontFamily: "'Fraunces',serif", fontSize: 19, color: C.walnutDark }}>{isK ? t("kitchen") : t("desk")}</span>
      </div>
      <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 14, color: C.muted, lineHeight: 1.7, marginBottom: 12 }}>
        {isK ? `${cfg.kW}×${cfg.kH}×${cfg.kD} ${t("cm")} · ${(cfg.kUnits || []).length}+${cfg.kUpper}` : `${cfg.dW}×${cfg.dD}×${cfg.dH} ${t("cm")} · ${(cfg.dUnits || []).length} ${L("modules", "وحدة")[lang]}`}
      </div>
      {feats.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {feats.slice(0, 6).map((f) => <span key={f} style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12, background: C.sand, padding: "5px 10px", borderRadius: 999, color: C.ink }}>{f}</span>)}
        </div>
      )}
      <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 14 }}>
        <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12, color: C.muted, marginBottom: 3 }}>{t("estPrice")}</div>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, color: C.walnutDark }}>EGP {fmt(price.low)} – {fmt(price.high)}</div>
      </div>
      <div style={{ marginTop: 14, display: "flex", alignItems: "flex-start", gap: 8, background: C.cream, borderRadius: 4, padding: "11px 13px" }}>
        <Info size={15} style={{ color: C.oakDeep, flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12, lineHeight: 1.5, color: C.muted }}>{t("disclaimer")}</span>
      </div>
    </div>
  );
}

/* ---- shell (top bar, progress, fonts) ---- */
function Shell({ children, lang, setLang, dir, step, totalSteps, onSave, hideProgress }) {
  return (
    <div dir={dir} style={{ background: C.cream, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Hanken+Grotesk:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box} body{margin:0}
        ::selection{background:${C.oak};color:#fff}
        input:focus-visible,textarea:focus-visible,button:focus-visible{outline:2px solid ${C.oakDeep};outline-offset:2px}
        input::placeholder,textarea::placeholder{color:${C.muted};opacity:.85}
        .grid{display:grid}
        @media(min-width:640px){.sm\\:grid-cols-2{grid-template-columns:1fr 1fr}}
        @media(min-width:1024px){
          .cfg-grid{flex-direction:row!important}
          .cfg-sticky{position:sticky;top:84px}
          .cfg-stage{aspect-ratio:auto!important;height:calc(100vh - 116px);min-height:560px}
        }
      `}</style>

      {/* top bar */}
      <header style={{ position: "sticky", top: 0, zIndex: 30, background: C.cream, borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 1480, margin: "0 auto", padding: "0 22px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="26" height="26" viewBox="0 0 30 30" fill="none"><rect x="1" y="1" width="28" height="28" rx="3" stroke={C.walnutDark} strokeWidth="1.5" /><path d="M7 20c3-7 5-10 8-10s5 3 8 10" stroke={C.oak} strokeWidth="1.6" strokeLinecap="round" /></svg>
            <span style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 600, color: C.walnutDark }}>{STR.brand[lang]}</span>
            <span className="hidden sm-inline" style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12, color: C.muted, borderInlineStart: `1px solid ${C.line}`, paddingInlineStart: 10 }}>{STR.configurator[lang]}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {onSave && <button onClick={onSave} style={{ ...btnGhost, padding: "8px 14px" }}><Download size={15} /> {STR.save[lang]}</button>}
            <button onClick={() => setLang(lang === "en" ? "ar" : "en")} style={{ ...btnGhost, padding: "8px 12px" }}><Globe size={15} /> {lang === "en" ? "عربي" : "EN"}</button>
          </div>
        </div>
        {!hideProgress && totalSteps && (
          <div style={{ maxWidth: 1480, margin: "0 auto", padding: "0 22px 14px" }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {STR.steps.map((s, i) => (
                <React.Fragment key={i}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 22, height: 22, borderRadius: 999, display: "grid", placeItems: "center", fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 11.5, fontWeight: 700, background: i < step ? C.oak : i === step ? C.walnutDark : "transparent", color: i <= step ? "#fff" : C.muted, border: i > step ? `1.5px solid ${C.line}` : "none" }}>{i < step ? <Check size={12} /> : i + 1}</span>
                    <span className="hidden md-inline" style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13, fontWeight: i === step ? 700 : 500, color: i === step ? C.walnutDark : C.muted }}>{s[lang]}</span>
                  </div>
                  {i < STR.steps.length - 1 && <span style={{ flex: 1, height: 2, background: i < step ? C.oak : C.line, borderRadius: 2 }} />}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </header>

      <main style={{ maxWidth: 1480, margin: "0 auto", padding: "20px 22px 70px" }}>{children}</main>

      <style>{`
        @media(min-width:640px){.sm-inline{display:inline!important}}
        @media(min-width:768px){.md-inline{display:inline!important}}
        .hidden{display:none}
      `}</style>
    </div>
  );
}

/* ---- shared buttons ---- */
const btnBase = { display: "inline-flex", alignItems: "center", gap: 9, cursor: "pointer", fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 600, fontSize: 15, padding: "13px 24px", borderRadius: 3, border: "1px solid transparent", transition: "all .2s", lineHeight: 1 };
const btnSolid = { ...btnBase, background: C.oak, color: "#fff", borderColor: C.oak };
const btnOutline = { ...btnBase, background: "transparent", color: C.walnutDark, borderColor: C.lineDark };
const btnGhost = { ...btnBase, background: "transparent", color: C.walnut, borderColor: C.line, fontSize: 14 };
