// Streams every generated mesh (raw typed arrays) plus code-drawn textures to disk for the Blender version.
import { build, envTexture } from './scene.js';
const post = (name, body) => fetch('/up/' + name, { method: 'POST', body });
async function png(t) {
  const im = t.image; let c = im;
  if (!(im instanceof HTMLCanvasElement)) {
    c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    const x = c.getContext('2d'), d = x.createImageData(c.width, c.height), w = c.width * 4;
    for (let j = 0; j < c.height; j++) d.data.set(im.data.subarray((c.height - 1 - j) * w, (c.height - j) * w), j * w);
    x.putImageData(d, 0, 0);
  }
  return new Promise((r) => c.toBlob(r, 'image/png'));
}
if (window.__method === 'exportmesh') (async () => {
  const { root } = build(1), meta = [];
  for (const o of root.children) {
    const g = o.geometry, A = g.attributes, m = o.material, k = o.name;
    const e = { name: k, n: A.position.count, idx: g.index ? g.index.count : 0, uv: !!A.uv, col: !!A.color, basic: !!m.isMeshBasicMaterial, color: m.color.toArray(), rough: m.roughness ?? 1, metal: m.metalness ?? 0, em: m.emissive ? m.emissive.toArray() : [0, 0, 0], ei: m.emissiveIntensity ?? 0 };
    await post(k + '.pos', A.position.array); await post(k + '.nor', A.normal.array);
    if (e.uv) await post(k + '.uv', A.uv.array); if (e.col) await post(k + '.col', A.color.array); if (e.idx) await post(k + '.idx', new Uint32Array(g.index.array));
    if (m.map) { e.map = k + '_map.png'; await post(e.map, await png(m.map)); }
    if (m.emissiveMap) { e.emap = k + '_emap.png'; await post(e.emap, await png(m.emissiveMap)); }
    meta.push(e);
  }
  await post('env.f32', envTexture(1).image.data); await post('meta.json', JSON.stringify(meta)); window.__done = true;
})().catch((e) => { window.__err = e.stack; window.__done = true; });
