// Assembles the procedural scene used by the real-time, path-traced and Blender versions.
import * as THREE from 'three';
import { W, H, F, CX, CY, CAMH, PIVOT, mix, lin, unproj, camX } from './util.js';
import { sky, skyDir } from './sky.js';
import { std, quad } from './kit.js';
import { buildGround, buildStones, buildPlants, buildMountains } from './nature.js';
import { buildStation } from './station.js';
import { buildVan } from './van.js';

export function skyTexture(w = 1440, h = 1020, x0 = -220, x1 = 940, y0 = -60, y1 = 760) {
  const d = new Uint8Array(w * h * 4);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const c = sky(mix(x0, x1, (i + 0.5) / w), mix(y1, y0, (j + 0.5) / h)), k = (j * w + i) * 4; d[k] = c[0] * 255 + 0.5; d[k + 1] = c[1] * 255 + 0.5; d[k + 2] = c[2] * 255 + 0.5; d[k + 3] = 255; }
  const t = new THREE.DataTexture(d, w, h); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.LinearFilter; t.needsUpdate = true; return { t, rect: [x0, x1, y0, y1] };
}
export function envTexture(gain = 1, w = 512, h = 256) {
  const d = new Float32Array(w * h * 4);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const ph = ((i + 0.5) / w - 0.5) * 2 * Math.PI, th = ((j + 0.5) / h - 0.5) * Math.PI, c = lin(skyDir(Math.cos(th) * Math.cos(ph), Math.sin(th), Math.cos(th) * Math.sin(ph))), k = (j * w + i) * 4; for (let q = 0; q < 3; q++) d[k + q] = c[q] * gain; d[k + 3] = 1; }
  const t = new THREE.DataTexture(d, w, h, THREE.RGBAFormat, THREE.FloatType); t.mapping = THREE.EquirectangularReflectionMapping; t.magFilter = t.minFilter = THREE.LinearFilter; t.wrapS = THREE.RepeatWrapping; t.needsUpdate = true; return t;
}
export function build(q = 1) {
  const root = new THREE.Group(), M = {}, add = (name, g, m) => { const o = new THREE.Mesh(g, m); o.name = name; root.add(o); M[name] = o; return o; };
  const vc = (r, side = THREE.FrontSide) => std({ vertexColors: true, roughness: r, side });
  add('ground', buildGround(q), vc(0.95)); add('stones', buildStones(q), vc(0.85));
  const [p1, p2] = buildPlants(); add('plants', p1, vc(0.9, THREE.DoubleSide)); add('sage', p2, vc(0.9, THREE.DoubleSide));
  buildMountains().forEach((g, i) => add('mount' + i, g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })));
  buildStation(add); buildVan(add);
  const s = skyTexture(), [x0, x1, y0, y1] = s.rect, D = 6000;
  add('sky', quad([unproj(x0, y0, D), unproj(x1, y0, D), unproj(x1, y1, D), unproj(x0, y1, D)]), new THREE.MeshBasicMaterial({ map: s.t, side: THREE.DoubleSide }));
  return { root, M };
}
// Off-axis pinhole: pure lateral truck while the principal point shifts, so the station stays put.
export function setCamera(cam, frame) {
  const x = camX(frame), cx = CX + (F * x) / PIVOT, n = 0.5, f = 9000; cam.position.set(x, CAMH, 0); cam.rotation.set(0, 0, 0); cam.near = n; cam.far = f;
  cam.updateProjectionMatrix = function () { this.projectionMatrix.set((2 * F) / W, 0, 1 - (2 * cx) / W, 0, 0, (2 * F) / H, (2 * CY) / H - 1, 0, 0, 0, -(f + n) / (f - n), (-2 * f * n) / (f - n), 0, 0, -1, 0); this.projectionMatrixInverse.copy(this.projectionMatrix).invert(); };
  cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
}
