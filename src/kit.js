import * as THREE from 'three';
import { CAMH } from './util.js';
export const V = (a) => new THREE.Vector3(...a);
export const C = (h) => new THREE.Color(h);
export const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0, ...o });
export const glow = (h, i) => std({ color: 0x000000, emissive: C(h), emissiveIntensity: i, roughness: 1 });
export const pane = (t, i = 1) => std({ color: 0x000000, emissive: C('#ffffff'), emissiveMap: t, emissiveIntensity: i, roughness: 0.25 });
// Textures are drawn by code on a canvas; no image files are used.
export const TK = 3;
export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w * TK; c.height = h * TK; const x = c.getContext('2d'); x.scale(TK, TK); draw(x, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; return t;
}
export function quad(p) { // tl, tr, br, bl
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([p[3], p[2], p[1], p[0]].flat(), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  g.setIndex([0, 1, 2, 0, 2, 3]); g.computeVertexNormals(); return g;
}
export function tube(a, b, r, seg = 8) {
  const A = V(a), d = V(b).sub(A), g = new THREE.CylinderGeometry(r, r, d.length(), seg);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
  g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); return g;
}
export function box(w, h, d, x, y, z, yaw = 0) { const g = new THREE.BoxGeometry(w, h, d); g.rotateY(yaw); g.translate(x, y, z); return g; }
export function prism(poly, y0, y1) { // poly: [[X, depth], ...]
  const s = new THREE.Shape(poly.map(([x, d]) => new THREE.Vector2(x, d)));
  const g = new THREE.ExtrudeGeometry(s, { depth: y1 - y0, bevelEnabled: false }); g.rotateX(-Math.PI / 2); g.translate(0, y0, 0); return g;
}
export function cyl(X, d, r, y0, y1) { const g = new THREE.CylinderGeometry(r, r, y1 - y0, 20); g.translate(X, (y0 + y1) / 2, -d); return g; }
export function vcol(g, fn) {
  const p = g.attributes.position, a = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) a.set(fn(p.getX(i), p.getY(i), p.getZ(i), i), i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g;
}
export function tris(q) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(q, 3)); g.computeVertexNormals(); return g; }
export { CAMH };
