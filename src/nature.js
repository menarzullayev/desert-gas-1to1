import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { F, CX, rng, vnoise, fbm, ridged, clamp, mix, smooth, hl, hex, lin, mix3, ramp, unproj, onGround, groundDepth } from './util.js';
import { V, vcol } from './kit.js';

export function groundH(x, d) {
  const rough = smooth(27, 17, d), far = smooth(48, 80, d);
  return (fbm(x * 0.5, d * 0.5, 3) - 0.5) * 0.05 * smooth(34, 20, d) + (fbm(x * 3.1, d * 3.1, 4, 0.6) - 0.5) * 0.065 * rough
    + (fbm(x * 17, d * 17, 3, 0.6) - 0.5) * 0.028 * smooth(14, 6, d) + (fbm(x * 0.06, d * 0.06, 3) - 0.5) * 0.6 * far - 0.01;
}
const HAZE = hl('#c07090'), TINT = [1.5, 1.02, 1.12];
const LOTL = hl('#a98a80'), DIRT = hl('#94746a'), DARK = hl('#5c4640'), APRON = hl('#b9a69a'), FAR0 = hl('#4a3434'), FAR1 = hl('#7c5a52');
function groundCol(x, d) {
  const n = fbm(x * 1.7, d * 1.7, 4), m = fbm(x * 9, d * 9, 3), s = fbm(x * 0.22 + d * 0.02, d * 1.5, 4);
  let c = mix3(DARK, DIRT, clamp(0.15 + n * 0.75 + (m - 0.5) * 0.9));
  const lot = smooth(21, 26, d) * smooth(58, 48, d);
  c = mix3(c, mix3(DIRT, LOTL, clamp((s - 0.3) * 2)), lot * 0.95);
  const track = Math.pow(1 - Math.abs(2 * vnoise(x * 0.13 + 3, (d + x * 0.18) * 1.35) - 1), 5) * lot;
  c = mix3(c, DARK, track * 0.55);
  const ap = smooth(39.8, 41.2, d - (x < -1 ? 0.6 : 0)) * smooth(52, 49, d) * smooth(-5.5, -3.2, x);
  c = mix3(c, APRON, ap * 0.8);
  return mix3(c, mix3(FAR0, FAR1, n), smooth(47, 60, d)).map((v, i) => mix(v * TINT[i], HAZE[i], smooth(60, 900, d)));
}
export function buildGround(q = 1) {
  const rows = Math.round(620 * q), cols = Math.round(760 * q), pos = [], idx = [];
  for (let r = 0; r <= rows; r++) {
    const d = groundDepth(731.4 + 640 * Math.pow(r / rows, 1.35)), half = 0.36 * d + 1.4;
    for (let c = 0; c <= cols; c++) { const x = ((c / cols) * 2 - 1) * half + 0.04 * d; pos.push(x, groundH(x, d), -d); }
  }
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const a = r * (cols + 1) + c, e = a + cols + 1; idx.push(a, e, a + 1, a + 1, e, e + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return vcol(g, (x, y, z) => { const d = -z, k = 1 + clamp((y + 0.01) * 9, -0.45, 0.45) * smooth(22, 10, d); return groundCol(x, d).map((v) => v * k); });
}
function stoneGeo(detail, r) {
  const g = new THREE.IcosahedronGeometry(1, detail), p = g.attributes.position, o = r() * 100;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 0.78 + 0.45 * vnoise(x * 1.3 + o, y * 1.3 + z * 1.7 + o); p.setXYZ(i, x * k, y * k * 0.62, z * k); }
  g.deleteAttribute('uv'); const n = g.attributes.normal, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.set(p.getX(i), p.getY(i) * 1.6, p.getZ(i)).normalize(); n.setXYZ(i, v.x, v.y, v.z); }
  return g;
}
// Stones placed at positions read off the reference frame: [px, py, radius px]
const HERO = [[210, 1048, 12], [231, 1076, 12], [104, 1118, 13], [75, 1103, 15], [47, 1091, 15], [106, 1213, 13], [541, 1106, 12], [571, 1121, 8], [598, 1134, 10], [614, 1150, 8], [648, 1166, 15], [672, 1186, 9], [702, 1197, 14], [498, 1083, 10], [445, 1144, 12], [622, 1058, 11], [448, 1115, 12], [120, 1186, 10], [40, 1128, 13], [30, 1150, 12], [560, 967, 9], [65, 925, 7], [388, 931, 8], [540, 935, 8], [430, 905, 6], [520, 1235, 14], [40, 1258, 22], [380, 1175, 8]];
export function buildStones(q = 1) {
  const r = rng(7), mk = (d) => [...Array(8)].map(() => stoneGeo(d, r)), xs = mk(0), lo = mk(1), hi = mk(3), list = [];
  for (let i = 0; i < 105000 * q; i++) {
    const d = groundDepth(862 + 470 * Math.pow(r(), 0.72)), x = (r() * 2 - 1) * (0.23 * d + 1.5);
    if (r() > smooth(0.28, 0.58, fbm(x * 0.9 + 4, d * 0.9, 3)) + 0.3) continue;
    list.push([x, d, Math.min(0.0058 * Math.pow(r(), -0.45), 0.024) * (0.75 + d * 0.028), 0]);
  }
  for (let i = 0; i < 2600 * q; i++) { // pebble field, bottom left
    const px = -520 + r() * 740, py = 985 + r() * 290; if (r() > 0.12 + smooth(230, -80, px) * smooth(980, 1060, py)) continue;
    const d = groundDepth(py); list.push([((px - CX) * d) / F, d, 0.018 + 0.03 * Math.pow(r(), 2.2), 1]);
  }
  for (const [px, py, s] of HERO) { const d = groundDepth(py); list.push([((px - CX) * d) / F, d, (s * d) / F, 2]); }
  for (let i = 0; i < 240; i++) { const d = groundDepth(900 + r() * 370); list.push([(r() * 2 - 1) * (0.23 * d + 1.4), d, 0.024 + 0.03 * r() * r(), 2]); }
  const m = new THREE.Matrix4(), e = new THREE.Euler(), qn = new THREE.Quaternion(), out = [];
  const pal = ['#8f7268', '#7a5f5c', '#a3837a', '#6a5254', '#b09088', '#8a6a5a', '#5a474a'].map(hl);
  for (const [x, d, s, k] of list) {
    const pxr = (s * F) / d, src = pxr > 5.5 || k === 2 ? hi : pxr > 2.6 ? lo : xs, g = src[(r() * 8) | 0].clone();
    e.set(r() * 0.5, r() * 6.28, r() * 0.5); qn.setFromEuler(e);
    m.compose(new THREE.Vector3(x, groundH(x, d) + s * 0.22, -d), qn, new THREE.Vector3(s * (0.75 + r() * 0.6), s * (0.7 + r() * 0.4), s));
    g.applyMatrix4(m); const k2 = 0.55 + Math.pow(r(), 2.5) * 0.95, c = pal[(r() * pal.length) | 0].map((v, i) => v * [1.4, 1.02, 1.15][i] * k2); out.push(vcol(g, () => c));
  }
  return mergeGeometries(out);
}
const buf = () => ({ p: [], n: [], c: [], i: [] });
function toGeo(o) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(o.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(o.n, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(o.c, 3)); g.setIndex(o.i); return g; }
function strand(out, pts, r0, r1, c0, c1) { // tapered three-sided stem
  const n = pts.length, base = out.p.length / 3;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), r = mix(r0, r1, t), d = V(pts[Math.min(n - 1, i + 1)]).sub(V(pts[Math.max(0, i - 1)])).normalize();
    const u = new THREE.Vector3(0.31, 0.2, 0.93).cross(d).normalize(), w = d.clone().cross(u);
    for (let k = 0; k < 3; k++) { const a = (k * 2 * Math.PI) / 3, nx = u.clone().multiplyScalar(Math.cos(a)).addScaledVector(w, Math.sin(a)); out.p.push(pts[i][0] + nx.x * r, pts[i][1] + nx.y * r, pts[i][2] + nx.z * r); out.n.push(nx.x, nx.y, nx.z); out.c.push(...mix3(c0, c1, t)); }
  }
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < 3; k++) { const a = base + i * 3 + k, b = base + i * 3 + ((k + 1) % 3); out.i.push(a, b, a + 3, b, b + 3, a + 3); }
}
function leaf(o, q, s, r, c) {
  const b = o.p.length / 3, n = new THREE.Vector3(r() - 0.5, r() * 0.9 + 0.1, r() - 0.5).normalize();
  for (let k = 0; k < 3; k++) { o.p.push(q[0] + (r() - 0.5) * 2 * s, q[1] + (r() - 0.5) * 2 * s, q[2] + (r() - 0.5) * 2 * s); o.n.push(n.x, n.y, n.z); o.c.push(...c); }
  o.i.push(b, b + 1, b + 2);
}
function shrub(o, px, py, w, h, seed, { stems, c0, c1, rad }) {
  const g = onGround(px, py), x = g[0], d = -g[2], r = rng(seed), y0 = groundH(x, d), A = hl(c0), B = hl(c1);
  const branch = (p, dir, len, rr, lvl) => {
    const pts = [p], n = 5; let c = p, v = dir;
    for (let i = 0; i < n; i++) { v = v.map((q, k) => q + (r() - 0.5) * 0.42 + (k === 1 ? 0.05 : 0)); const l = Math.hypot(...v); v = v.map((q) => q / l); c = c.map((q, k) => q + (v[k] * len) / n); pts.push(c); }
    strand(o, pts, rr, rr * 0.35, A, mix3(A, B, lvl / 2.4));
    if (lvl < 3) for (let i = 0; i < (lvl ? 3 : 5); i++) branch(pts[1 + ((r() * n) | 0)], [v[0] + (r() - 0.5) * 1.5, v[1] + (r() - 0.35) * 0.9, v[2] + (r() - 0.5) * 1.5], len * (0.42 + r() * 0.25), rr * 0.55, lvl + 1);
  };
  for (let i = 0; i < stems; i++) {
    const a = r() * 6.283, sp = Math.sqrt(r()), tilt = 0.25 + sp * 1.05;
    branch([x + Math.cos(a) * sp * w * 0.13, y0, -(d + Math.sin(a) * sp * w * 0.13)], [Math.cos(a) * tilt, (h / w) * 1.8, -Math.sin(a) * tilt], Math.hypot(w * 0.3 * sp, h * 0.55) * (0.7 + r() * 0.5), rad, 0);
  }
}
function grass(o, px, py, w, h, seed, n, c0, c1, rad) {
  const g = onGround(px, py), x = g[0], d = -g[2], r = rng(seed), y0 = groundH(x, d), A = hl(c0), B = hl(c1);
  for (let i = 0; i < n; i++) {
    const a = r() * 6.283, sp = Math.pow(r(), 0.6), bx = x + Math.cos(a) * sp * w * 0.16, bd = d + Math.sin(a) * sp * w * 0.16;
    const L = h * (0.55 + r() * 0.5), lean = sp * w * 0.6 * (0.6 + r() * 0.7), cur = (r() - 0.5) * 0.12, pts = [];
    for (let k = 0; k <= 5; k++) { const t = k / 5, q = lean * Math.pow(t, 1.35); pts.push([bx + Math.cos(a + cur * t * 4) * q + (r() - 0.5) * 0.008 * t, y0 + L * (t - 0.16 * t * t * sp), -(bd + Math.sin(a + cur * t * 4) * q)]); }
    const sh = 0.6 + r() * 0.65, A1 = A.map((v) => v * sh), B1 = B.map((v) => v * sh); strand(o, pts, rad, rad * 0.25, A1, B1);
    if (r() < 0.55) for (let k = 0; k < 3; k++) { const s = pts[3], e = pts[5]; strand(o, [s, [s[0] + (e[0] - s[0]) * 0.7 + (r() - 0.5) * 0.09 * h, s[1] + (e[1] - s[1]) * 0.8 + (r() - 0.2) * 0.06 * h, s[2] + (r() - 0.5) * 0.09 * h]], rad * 0.7, rad * 0.2, A1, B1); }
  }
}
export function buildPlants() {
  const o = buf();
  shrub(o, 78, 888, 1.75, 1.02, 11, { stems: 58, c0: '#5a3832', c1: '#c08066', rad: 0.0105 });
  grass(o, 60, 889, 1.2, 0.5, 12, 260, '#704440', '#cc8c74', 0.006); grass(o, 150, 886, 0.6, 0.3, 13, 160, '#704440', '#d08c70', 0.006);
  shrub(o, 430, 1060, 0.5, 0.34, 21, { stems: 40, c0: '#6a3f30', c1: '#e8a06c', rad: 0.0032 }); grass(o, 432, 1062, 0.5, 0.33, 22, 420, '#6c4030', '#f0a878', 0.0022);
  for (const [px, py, w, h, s, n] of [[212, 1287, 0.56, 0.62, 31, 620], [150, 1300, 0.4, 0.36, 35, 300], [300, 1300, 0.42, 0.42, 34, 340], [425, 1300, 0.7, 0.54, 32, 620], [490, 1306, 0.4, 0.3, 33, 260]]) grass(o, px, py, w, h, s, Math.round(n * 0.3), '#7a463c', '#f0a890', 0.0030);
  // plants that slide in from the left later in the shot
  for (const [px, py, w, h, s] of [[-150, 1070, 0.55, 0.42, 41], [-330, 1180, 0.5, 0.4, 42], [-420, 1010, 0.6, 0.45, 43]]) grass(o, px, py, w, h, s, 420, '#4a2c22', '#b0785a', 0.0024);
  grass(o, 367, 868, 0.36, 0.1, 51, 120, '#7a3a2a', '#c0603a', 0.005);
  const s = buf(), r = rng(99);
  const clump = (x, d, w, h, tone, n) => { const y0 = groundH(x, d); for (let i = 0; i < n; i++) { const t = r() * 6.283, u = r(), rr = Math.sqrt(1 - u * u) * (0.75 + r() * 0.3), sh = (0.35 + 0.8 * u) * (0.7 + r() * 0.6); leaf(s, [x + Math.cos(t) * rr * w, y0 + u * h * (0.8 + r() * 0.3), -(d + Math.sin(t) * rr * w)], w * 0.16, r, tone.map((v) => v * sh)); } };
  const tones = ['#a87c74', '#bc8478', '#866664', '#cc8a78', '#745a5c'].map(hl).map((c) => c.map((v) => v * 1.45));
  for (let i = 0; i < 2600; i++) {
    const d = groundDepth(737.5 + 48 * Math.pow(r(), 0.8)), x = ((r() * 1100 - 190 - CX) * d) / F;
    if (d < 50 + (x > 1 ? 4 : 0) || fbm(x * 0.06, d * 0.04, 3) < 0.38) continue;
    const w = 0.35 + r() * 0.55; clump(x, d, w * (1 + d * 0.002), w * 0.75, tones[(r() * 5) | 0], d < 90 ? 170 : 50);
  }
  for (const [px, py, w, h, k] of [[158, 795, 0.5, 0.55, '#a8553a'], [112, 797, 0.75, 0.6, '#7a5544'], [70, 795, 0.7, 0.55, '#6f5246'], [30, 796, 0.7, 0.6, '#785448'], [-10, 797, 0.8, 0.6, '#6a4c44'], [-60, 798, 0.8, 0.6, '#785448'], [135, 790, 0.6, 0.5, '#7d5a4c'], [345, 789, 0.5, 0.4, '#6a4c44'], [372, 788, 0.5, 0.4, '#5a4440'], [425, 786, 0.6, 0.5, '#5a4440'], [490, 786, 0.5, 0.45, '#5a4440']]) { const p = onGround(px, py); clump(p[0], -p[2], w, h, hl(k).map((v) => v * 1.7), 620); }
  return [toGeo(o), toGeo(s)];
}
const RIDGE1 = [[-300, 600], [-200, 590], [-100, 596], [-40, 588], [0, 584], [40, 589], [85, 599], [130, 600], [170, 592], [210, 589], [260, 598], [340, 607], [390, 590], [430, 580], [470, 572], [500, 575], [545, 570], [575, 576], [620, 560], [665, 550], [700, 554], [760, 560], [860, 548], [1000, 580]];
const RIDGE2 = [[-300, 660], [-120, 640], [0, 647], [40, 644], [90, 655], [130, 671], [165, 664], [215, 648], [262, 645], [320, 656], [360, 676], [420, 688], [520, 684], [600, 676], [720, 668], [1000, 672]];
export function buildMountains() {
  const layers = [{ ridge: RIDGE1, base: 736, z0: 2300, z1: 4200, seed: 5, lit: '#8c4a78', mid: '#6a3b7c', sh: '#432870', rows: 230 }, { ridge: RIDGE2, base: 736, z0: 1500, z1: 2200, seed: 23, lit: '#744077', mid: '#613777', sh: '#48296c', rows: 130 }];
  return layers.map((L) => {
    const cols = 760, rows = L.rows, hg = [], pos = [], col = [], idx = [];
    for (let r = 0; r <= rows; r++) for (let c = 0; c <= cols; c++) {
      const px = -300 + (c / cols) * 1300, v = r / rows, top = ramp(L.ridge, px) + (fbm(px * 0.06 + L.seed, 2, 4) - 0.5) * 7;
      const gully = ridged((px + v * 70 * Math.sin(px * 0.011 + L.seed)) * 0.0115 + L.seed + (fbm(px * 0.02, v * 4, 3) - 0.5) * 1.5, v * 2.3 + L.seed + (fbm(px * 0.017 + 9, v * 3, 3) - 0.5) * 1.6, 6);
      const prof = v < 0.2 ? v * 0.75 : 0.15 + (v - 0.2) * 1.0625, bump = (gully - 0.62) * 34 * smooth(0.12, 0.4, v) * (1 - smooth(0.82, 1, v));
      const py = mix(L.base, top, prof) - bump * 0.45; hg.push([px, py, v, gully]); pos.push(...unproj(px, py, mix(L.z0, L.z1, v) - bump * 14));
    }
    const at = (c, r) => hg[clamp(r, 0, rows) * (cols + 1) + clamp(c, 0, cols)];
    const MID = hex(L.mid), LIT = hex(L.lit), SH = hex(L.sh);
    for (let r = 0; r <= rows; r++) for (let c = 0; c <= cols; c++) {
      const [px, py, v, g] = at(c, r), gx = (at(c + 1, r)[3] - at(c - 1, r)[3]) / 2, gy = (at(c, r + 1)[3] - at(c, r - 1)[3]) / 2;
      const lam = clamp(0.40 - gx * 10 + gy * 5 + (g - 0.6) * 0.9);
      let k = lam > 0.5 ? mix3(MID, LIT, (lam - 0.5) * 1.7) : mix3(MID, SH, (0.5 - lam) * 1.7);
      k = mix3(k, hex('#5f3a80'), smooth(0.65, 1, v) * 0.45); k = mix3(k, hex('#713f74'), smooth(0.42, 0.05, v) * 0.85);
      k = mix3(k, hex('#8a4a74'), smooth(0.28, 0, v) * smooth(0.45, 0.7, fbm(px * 0.012, py * 0.35, 4)) * 0.6);
      col.push(...lin(k.map((q) => q * (0.95 + 0.1 * vnoise(px * 0.9, py * 0.9)))));
    }
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const a = r * (cols + 1) + c; idx.push(a, a + 1, a + cols + 1, a + 1, a + cols + 2, a + cols + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
  });
}
