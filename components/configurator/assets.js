"use client";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/* ============================================================== *
 *  glTF asset pipeline (ready for Blender-made models)
 *
 *  The 3D scene is procedural by default. To swap in real models
 *  exported from Blender (File ▸ Export ▸ glTF 2.0 .glb):
 *    1. Drop the .glb files in  /public/models/
 *    2. Register them per product + unit kind in ASSET_URLS below,
 *       e.g.  kitchen: { drawers: "/models/base-drawers.glb" }
 *  Anything registered is loaded and fitted into that unit's slot,
 *  replacing the procedural box. Unregistered kinds stay procedural,
 *  so you can migrate one cabinet type at a time.
 * ============================================================== */

export const ASSET_URLS = {
  // kitchen: { door: "/models/k-door.glb", drawers: "/models/k-drawers.glb",
  //           sink: "/models/k-sink.glb", oven: "/models/k-oven.glb" },
  // desk:    { drawers: "/models/d-drawers.glb", file: "/models/d-file.glb" },
};

const _cache = new Map();
let _loader = null;
const loader = () => (_loader = _loader || new GLTFLoader());

export const hasAnyAsset = () => Object.values(ASSET_URLS).some((s) => s && Object.keys(s).length);
export const assetFor = (product, kind) => (ASSET_URLS[product] || {})[kind] || null;

export function loadModel(url) {
  if (_cache.has(url)) return _cache.get(url);
  const p = new Promise((res, rej) => loader().load(url, (g) => res(g.scene), undefined, rej));
  _cache.set(url, p);
  return p;
}

/* Replace procedural unit groups with loaded glTF models, fitted to each
   unit's bounding box. No-op until ASSET_URLS is populated. The render loop
   is continuous, so swapped meshes appear on the next frame automatically. */
export async function applyUnitAssets(model, product) {
  if (!hasAnyAsset() || !model) return;
  const jobs = [];
  model.traverse((o) => {
    if (o.userData && o.userData.unitId && o.userData.kind) {
      const url = assetFor(product, o.userData.kind);
      if (url) jobs.push({ group: o, url });
    }
  });
  for (const { group, url } of jobs) {
    try {
      const src = await loadModel(url);
      const inst = src.clone(true);
      inst.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
      const target = new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3());
      const ib = new THREE.Box3().setFromObject(inst);
      const isz = ib.getSize(new THREE.Vector3());
      const s = Math.min(target.x / (isz.x || 1), target.y / (isz.y || 1), target.z / (isz.z || 1));
      inst.scale.setScalar(s || 1);
      // keep the selection outline (LineSegments), drop procedural meshes
      [...group.children].forEach((c) => { if (!c.isLineSegments) group.remove(c); });
      group.add(inst);
    } catch (e) { /* leave the procedural cabinet as a fallback */ }
  }
}
