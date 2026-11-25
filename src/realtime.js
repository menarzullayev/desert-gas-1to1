// Method 1: three.js real-time PBR.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { W, H, CAMH } from './util.js';
import { build, envTexture, setCamera } from './scene.js';
import { cp } from './station.js';

export async function start(canvas, { scale = 1, quality = 1 } = {}) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  r.setPixelRatio(1); r.setSize(W * scale, H * scale, false); r.toneMapping = THREE.NoToneMapping; r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene(), { root, M } = build(quality); scene.add(root);
  const pm = new THREE.PMREMGenerator(r); scene.environment = pm.fromEquirectangular(envTexture(1)).texture; scene.environmentIntensity = 0.6;
  const skip = new Set(['sky', 'mount0', 'mount1', 'neonCanopy', 'lamps', 'neonShop', 'farLights', 'win1', 'win2', 'soffit', 'ground']);
  root.traverse((o) => { if (o.isMesh) { o.castShadow = !skip.has(o.name); o.receiveShadow = !o.material.isMeshBasicMaterial; } });
  // afterglow key from the bright horizon at the left, low and behind the scene
  const sun = new THREE.DirectionalLight('#ff80a6', 2.5); sun.position.set(-26, 9, -3); sun.target.position.set(0, 0, -14); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 22, bottom: -22, near: 1, far: 90 }); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.012; scene.add(sun, sun.target);
  const pl = (c, i, x, y, d, dist = 0, cast = false) => { const l = new THREE.PointLight(c, i, dist, 2); l.position.set(x, y, -d); if (cast) { l.castShadow = true; l.shadow.mapSize.set(1024, 1024); l.shadow.bias = -0.002; l.shadow.radius = 4; } scene.add(l); };
  for (const [t, u, cast] of [[0.45, 0.16, 1], [0.14, 0.47, 1], [0.5, 0.55, 1], [0.16, 1.0, 0]]) { const c = cp(t, u); pl('#ffb070', 17, c[0], 2.5, c[1], 0, !!cast); }
  for (let i = 0; i < 4; i++) { const a = cp(-0.12, i / 3.2), b = cp(i / 3.2, -0.12); pl('#38c8ff', 1.6, a[0], 3.1, a[1], 7); pl('#38c8ff', 1.6, b[0], 3.1, b[1], 7); }
  for (const [x, d] of [[6.2, 50], [7.4, 48.8], [8.7, 47.6], [10.2, 48.2]]) pl('#5fb8ff', 2.4, x, 2.2, d - 0.5, 5);
  pl('#ff6a86', 11, 5.0, 1.6, 48.6, 7); pl('#ffc080', 6, 8, 1.2, 46.6, 8); pl('#ff4a5a', 2, 9.6, 4.4, 49.2, 5);
  const cam = new THREE.PerspectiveCamera(); setCamera(cam, 150);
  const rt = new THREE.WebGLRenderTarget(W * scale, H * scale, { type: THREE.HalfFloatType, samples: 8 }), comp = new EffectComposer(r, rt); comp.setPixelRatio(1); comp.setSize(W * scale, H * scale);
  comp.addPass(new RenderPass(scene, cam));
  const ao = new GTAOPass(scene, cam, W * scale, H * scale); ao.updateGtaoMaterial({ radius: 0.12, distanceExponent: 1.2, thickness: 0.4, scale: 1.3, samples: 24 }); ao.blendIntensity = 0.85; comp.addPass(ao);
  comp.addPass(new UnrealBloomPass(new THREE.Vector2(W * scale, H * scale), 0.16, 0.4, 0.95)); comp.addPass(new OutputPass());
  const render = (frame) => { setCamera(cam, frame); comp.render(); };
  return { render, scene, cam, M, r };
}
if (typeof window !== 'undefined' && window.__method === 'realtime') {
  start(document.querySelector('canvas'), { scale: window.__scale || 1 }).then((a) => { a.render(window.__frame ?? 150); window.__api = a; window.__done = true; }).catch((e) => { window.__err = e.stack; window.__done = true; });
}
