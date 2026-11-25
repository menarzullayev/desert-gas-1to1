// Method 2: the same scene, progressively path traced on the GPU.
import * as THREE from 'three';
import { WebGLPathTracer } from 'three-gpu-pathtracer';
import { W, H } from './util.js';
import { build, envTexture, setCamera } from './scene.js';
async function start() {
  const scale = window.__scale || 1, canvas = document.querySelector('canvas');
  const r = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  r.setPixelRatio(1); r.setSize(W * scale, H * scale, false); r.toneMapping = THREE.NoToneMapping;
  const scene = new THREE.Scene(), { root, M } = build(0.72); scene.add(root);
  scene.environment = envTexture(1); scene.environmentIntensity = 0.6; scene.background = new THREE.Color(0x000000);
  // unlit backdrop pieces become pure emitters so the integrator keeps their colour
  for (const k of ['mount0', 'mount1']) { const g = M[k].geometry; M[k].material = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }); g.computeVertexNormals(); }
  const sky = M.sky.material.map; M.sky.material = new THREE.MeshStandardMaterial({ color: 0, roughness: 1, emissive: 0xffffff, emissiveMap: sky, side: THREE.DoubleSide });
  for (const k of ['mount0', 'mount1']) { // bake vertex colour into an emissive texture atlas (cols x rows)
    const g = M[k].geometry, cols = 761, rows = g.attributes.position.count / cols, c = g.attributes.color, d = new Uint8Array(cols * rows * 4), uv = new Float32Array(cols * rows * 2), t = new THREE.Color();
    for (let i = 0; i < cols * rows; i++) { t.setRGB(c.getX(i), c.getY(i), c.getZ(i)).convertLinearToSRGB(); d[i * 4] = t.r * 255; d[i * 4 + 1] = t.g * 255; d[i * 4 + 2] = t.b * 255; d[i * 4 + 3] = 255; uv[i * 2] = ((i % cols) + 0.5) / cols; uv[i * 2 + 1] = (Math.floor(i / cols) + 0.5) / rows; }
    const tx = new THREE.DataTexture(d, cols, rows); tx.colorSpace = THREE.SRGBColorSpace; tx.magFilter = tx.minFilter = THREE.LinearFilter; tx.needsUpdate = true; g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.deleteAttribute('color');
    M[k].material = new THREE.MeshStandardMaterial({ color: 0, roughness: 1, emissive: 0xffffff, emissiveMap: tx, side: THREE.DoubleSide });
  }
  // three-gpu-pathtracer 0.0.28 mishandles mixed RGB/RGBA colour attributes, so expand to RGBA
  for (const o of root.children) { const c = o.geometry.attributes.color; if (c && c.itemSize === 3) { const a = new Float32Array(c.count * 4); for (let i = 0; i < c.count; i++) { a[i * 4] = c.getX(i); a[i * 4 + 1] = c.getY(i); a[i * 4 + 2] = c.getZ(i); a[i * 4 + 3] = 1; } o.geometry.setAttribute('color', new THREE.BufferAttribute(a, 4)); } }
  const sun = new THREE.DirectionalLight('#ff80a6', 2.5); sun.position.set(-26, 9, -3); sun.target.position.set(0, 0, -14); scene.add(sun, sun.target);
  // emitters: rect lights sampled directly (low noise) next to the visible tubes
  const { cp } = await import('./station.js');
  const rl = (col, i, w, h, p, look) => { const l = new THREE.RectAreaLight(col, i, w, h); l.position.set(...p); l.lookAt(...look); scene.add(l); };
  for (const [t, u, L, dir] of [[0.72, 0.1, 1.3, 0], [0.3, 0.12, 1, 0], [0.1, 0.35, 0.8, 1], [0.1, 0.72, 1.2, 1], [0.6, 0.55, 1, 0], [0.4, 0.8, 1, 1]]) { const c = cp(t, u); rl('#ffb070', 44, 1.0, 0.35, [c[0], 2.72, -c[1]], [c[0], 0, -c[1]]); }
  rl('#4fc8ff', 4, 5, 0.4, [...((c) => [c[0] - 0.3, 3.0, -(c[1] - 0.3)])(cp(0.5, -0.05))], [...((c) => [c[0] - 2, 0, -(c[1] - 2)])(cp(0.5, -0.4))]);
  rl('#ffbf70', 3.2, 2.4, 1.5, [7.75, 1.55, -49.4], [6.6, 0.6, -46]); rl('#8fc8ff', 3, 5, 1.2, [6.6, 2.2, -46.2], [7.9, 1.2, -49.7]); rl('#ff6a86', 2.2, 2, 2, [4.6, 1.6, -47.4], [6.4, 1.5, -50.8]);
  const cam = new THREE.PerspectiveCamera(); setCamera(cam, window.__frame ?? 150);
  const pt = new WebGLPathTracer(r); pt.renderScale = 1; pt.tiles.set(3, 3); pt.bounces = 4; pt.filterGlossyFactor = 0.5; pt.multipleImportanceSampling = true; pt.renderDelay = 0; pt.fadeDuration = 0; pt.minSamples = 0; pt.dynamicLowRes = false; pt.rasterizeScene = false;
  const t0 = performance.now(); pt.setScene(scene, cam); console.log('bvh built', ((performance.now() - t0) / 1000).toFixed(1));
  const target = window.__spp; let last = 0;
  await new Promise((res) => { const tick = () => { pt.renderSample(); const s = Math.floor(pt.samples); if (s >= last + 50) { last = s; console.log('spp', s, ((performance.now() - t0) / 1000).toFixed(0) + 's'); } if (pt.samples >= target) res(); else requestAnimationFrame(tick); }; tick(); });
}
if (window.__method === 'pathtrace') start().then(() => (window.__done = true)).catch((e) => { window.__err = e.stack; window.__done = true; });
