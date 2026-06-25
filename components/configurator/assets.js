"use client";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/* ============================================================== *
 *  glTF asset pipeline — real models swap in for the procedural
 *  boxes, fitted to each unit's slot.
 *
 *  Models: Kenney Furniture Kit (kenney.nl) — CC0, in /public/models.
 *  Register per product + unit kind below. Each entry is either a
 *  URL string, or { url, rotY } where rotY rotates the model so its
 *  front faces the room (+Z). Unregistered kinds stay procedural.
 * ============================================================== */

const F = Math.PI; // Kenney pieces face -Z; rotate 180° so fronts face the room

export const ASSET_URLS = {
  kitchen: {
    door: { url: "/models/cabinet-door.glb", rotY: F },
    drawers: { url: "/models/cabinet-drawers.glb", rotY: F },
    open: { url: "/models/open-shelves.glb", rotY: F },
  },
  desk: {
    drawers: { url: "/models/desk-drawers.glb", rotY: F },
    file: { url: "/models/desk-drawers.glb", rotY: F },
    open: { url: "/models/open-shelves.glb", rotY: F },
    door: { url: "/models/closed-cabinet.glb", rotY: F },
  },
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

/* Replace each procedural unit group with its registered glTF model,
   fitted (non-uniform) to fill the unit's slot and oriented to face the
   room. Geometry/material are deep-cloned so disposing a rebuilt model
   never corrupts the cached source. No-op until ASSET_URLS is populated. */
export async function applyUnitAssets(model, product) {
  if (!hasAnyAsset() || !model) return;
  const jobs = [];
  model.traverse((o) => {
    if (o.userData && o.userData.unitId && o.userData.kind) {
      const entry = assetFor(product, o.userData.kind);
      if (entry) jobs.push({ group: o, entry });
    }
  });

  for (const { group, entry } of jobs) {
    const url = typeof entry === "string" ? entry : entry.url;
    const rotY = (typeof entry === "object" && entry.rotY) || 0;
    try {
      const src = await loadModel(url);
      const inst = src.clone(true);
      inst.traverse((c) => {
        if (c.isMesh) {
          c.geometry = c.geometry.clone();
          c.material = Array.isArray(c.material) ? c.material.map((m) => m.clone()) : c.material.clone();
          c.castShadow = true; c.receiveShadow = true;
        }
      });
      inst.rotation.y = rotY;

      // target slot = the unit group's bounding box, in the group's local space
      const wb = new THREE.Box3().setFromObject(group);
      const gp = group.position;
      const tmin = wb.min.clone().sub(gp), tmax = wb.max.clone().sub(gp);
      const tsz = tmax.clone().sub(tmin);

      inst.updateMatrixWorld(true);
      const ib = new THREE.Box3().setFromObject(inst);
      const isz = ib.getSize(new THREE.Vector3());
      inst.scale.set(tsz.x / (isz.x || 1), tsz.y / (isz.y || 1), tsz.z / (isz.z || 1));

      // re-measure after scaling and snap to the slot (centre x/z, sit on the slot floor)
      inst.updateMatrixWorld(true);
      const ib2 = new THREE.Box3().setFromObject(inst);
      const c2 = ib2.getCenter(new THREE.Vector3());
      inst.position.x += (tmin.x + tmax.x) / 2 - c2.x;
      inst.position.z += (tmin.z + tmax.z) / 2 - c2.z;
      inst.position.y += tmin.y - ib2.min.y;

      // drop procedural meshes, keep the selection outline
      [...group.children].forEach((c) => { if (!c.isLineSegments) group.remove(c); });
      group.add(inst);
    } catch (e) { /* keep the procedural cabinet as a fallback */ }
  }
}
