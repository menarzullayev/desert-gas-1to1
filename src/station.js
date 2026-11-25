import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { F, CX, CAMH, rng, unproj, wall, mix } from './util.js';
import { C, std, glow, pane, canvasTex, TK, quad, tube, box, prism, cyl } from './kit.js';

// Canopy parallelogram on the ground plane: corner + two edges [X, depth].
export const CC = [2.65, 41], E1 = [-3.31, 3.94], E2 = [3.44, 2.96], CAN_T = 3.26, CAN_B = 2.8;
export const cp = (t, u) => [CC[0] + t * E1[0] + u * E2[0], CC[1] + t * E1[1] + u * E2[1]];
export const BA = [9.41, 47.9], BB = [5.78, 51.5], BD = [13.2, 51.8], BTOP = 2.93;

export function buildStation(add) {
  const yT = CAN_T, yB = CAN_B, at = (px, d) => ((px - CX) * d) / F, pc = (px, d, r, y0, y1) => cyl(at(px, d), d, r, y0, y1);
  add('fascia', prism([cp(0, 0), cp(0, 1), cp(1, 1), cp(1, 0)], yB, yT), std({ color: C('#12a0c8'), roughness: 0.45, emissive: C('#3cb6c6'), emissiveIntensity: 0.72 }));
  add('soffit', prism([cp(0.02, 0.02), cp(0.02, 0.98), cp(0.98, 0.98), cp(0.98, 0.02)], yB - 0.015, yB + 0.01), std({ color: C('#d8b0a4'), emissive: C('#d0605c'), emissiveIntensity: 0.16 }));
  const neon = [], o = -0.012;
  for (const y of [yT - 0.1, yB + 0.17, yB + 0.05]) { const p = (t, u) => { const q = cp(t, u); return [q[0], y, -q[1]]; }; neon.push(tube(p(o, 1), p(o, o), 0.03), tube(p(o, o), p(1, o), 0.03)); }
  add('neonCanopy', mergeGeometries(neon), glow('#b6f7f4', 0.98));
  const lamps = [];
  for (const [t, u, L, dir] of [[0.72, 0.1, 1.3, 0], [0.3, 0.12, 1.0, 0], [0.1, 0.35, 0.8, 1], [0.1, 0.72, 1.2, 1], [0.6, 0.55, 1.0, 0], [0.4, 0.8, 1, 1], [0.5, 0.3, 0.7, 1]]) { const c = cp(t, u), e = dir ? E2 : E1, k = L / 2 / Math.hypot(...e); lamps.push(tube([c[0] - e[0] * k, yB - 0.03, -(c[1] - e[1] * k)], [c[0] + e[0] * k, yB - 0.03, -(c[1] + e[1] * k)], 0.03)); }
  add('lamps', mergeGeometries(lamps), glow('#ffcf90', 1.5));
  const yaw = Math.atan2(E1[1], E1[0]);
  add('columns', mergeGeometries([[0.75, 0.165], [0.136, 0.15], [0.15, 0.8], [0.75, 0.8]].map(([t, u]) => { const c = cp(t, u); return box(0.17, yB, 0.17, c[0], yB / 2, -c[1], yaw); })), std({ color: C('#d9b8a4'), roughness: 0.55 }));
  const rect = (c, e, w, l) => { const n = Math.hypot(...e), a = [e[0] / n, e[1] / n], b = [-a[1], a[0]]; return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, j]) => [c[0] + (a[0] * i * l) / 2 + (b[0] * j * w) / 2, c[1] + (a[1] * i * l) / 2 + (b[1] * j * w) / 2]); };
  add('islands', mergeGeometries([prism(rect([1.78, 43.5], E1, 1.15, 5.0), 0, 0.14), prism(rect([4.1, 45.2], E1, 0.7, 1.5), 0, 0.12), prism(rect([5.15, 45.3], E2, 0.7, 1.4), 0, 0.12)]), std({ color: C('#a08c84') }));
  const faceTex = canvasTex(256, 200, (x, w, h) => { x.fillStyle = '#20202c'; x.fillRect(0, 0, w, h); x.fillStyle = '#e6b98c'; x.fillRect(14, 12, 96, 66); x.fillStyle = '#14141c'; for (let i = 0; i < 3; i++) { x.fillRect(22, 20 + i * 18, 80, 11); x.fillStyle = '#f0e6d0'; x.font = 'bold 11px Consolas,monospace'; x.fillText(['12.48', '08.31', '1.499'][i], 60, 29.5 + i * 18); x.fillStyle = '#14141c'; } x.fillStyle = '#7fb8cc'; x.fillRect(126, 18, 54, 40); x.fillStyle = '#c2d8e0'; x.fillRect(131, 23, 44, 6); x.fillStyle = '#c03a30'; x.fillRect(196, 16, 44, 64); x.fillStyle = '#f4e8d0'; x.font = 'bold 17px Arial'; x.fillText('87', 208, 54); x.fillStyle = '#34406c'; x.fillRect(0, 92, w, 108); x.fillStyle = '#e8dcc4'; for (let i = 0; i < 4; i++) x.fillRect(20, 108 + i * 18, 70 + (i * 37) % 46, 7); x.fillStyle = '#101018'; x.beginPath(); x.roundRect(168, 104, 62, 76, 8); x.fill(); x.fillStyle = '#4a4a58'; x.fillRect(186, 116, 26, 52); });
  const headTex = canvasTex(256, 64, (x, w, h) => { x.fillStyle = '#f2d8a8'; x.fillRect(0, 0, w, h); x.strokeStyle = '#a8542c'; x.lineWidth = 5; x.strokeRect(4, 4, w - 8, h - 8); x.fillStyle = '#b23a2c'; x.font = 'bold 40px Arial'; x.textAlign = 'center'; x.fillText('GAS', w / 2, 46); });
  const yw = -0.55, P3 = { cab: [], dark: [], post: [], face: [], head: [], headBox: [], trim: [], globe: [] };
  for (const [px, d, globe] of [[401, 44.9, 0], [455, 43.2, 1], [513.5, 45, 0]]) {
    const X = at(px, d), b = (w, h, t, lx, y, lz) => { const g = new THREE.BoxGeometry(w, h, t); g.translate(lx, y, lz); g.rotateY(yw); g.translate(X, 0, -d); return g; }, f = (w, h, lx, y, lz) => { const g = new THREE.PlaneGeometry(w, h); g.translate(lx, y, lz); g.rotateY(yw); g.translate(X, 0, -d); return g; };
    P3.cab.push(b(0.5, 0.66, 0.34, 0, 0.47, 0)); P3.dark.push(b(0.46, 0.44, 0.3, 0, 1.02, 0), b(0.2, 0.05, 0.02, 0, 0.6, 0.18)); P3.face.push(f(0.44, 0.4, 0, 1.02, 0.156));
    P3.post.push(b(0.05, 0.5, 0.05, -0.21, 1.48, 0.1), b(0.05, 0.5, 0.05, 0.21, 1.48, 0.1), b(0.05, 0.5, 0.05, -0.21, 1.48, -0.12), b(0.05, 0.5, 0.05, 0.21, 1.48, -0.12)); P3.dark.push(b(0.3, 0.2, 0.16, 0, 1.42, 0));
    P3.headBox.push(b(0.54, 0.12, 0.32, 0, 1.72, 0)); P3.head.push(f(0.5, 0.1, 0, 1.72, 0.163)); P3.trim.push(b(0.52, 0.02, 0.36, 0, 0.81, 0), b(0.52, 0.03, 0.36, 0, 0.145, 0), b(0.48, 0.02, 0.32, 0, 1.25, 0)); P3.dark.push(b(0.012, 0.5, 0.004, 0, 0.45, 0.171), b(0.06, 0.08, 0.03, 0.12, 0.55, 0.18));
    if (globe) { const s = new THREE.SphereGeometry(0.11, 24, 16); s.translate(X, 1.9, -d); P3.globe.push(s); }
  }
  add('pumpCab', mergeGeometries(P3.cab), std({ color: C('#e2cdb0'), roughness: 0.4 })); add('pumpDark', mergeGeometries(P3.dark), std({ color: C('#1c2036'), roughness: 0.35 })); add('pumpFace', mergeGeometries(P3.face), std({ map: faceTex, roughness: 0.3 })); add('pumpPost', mergeGeometries(P3.post), std({ color: C('#c8b8a4'), roughness: 0.35, metalness: 0.5 })); add('pumpHeadBox', mergeGeometries(P3.headBox), std({ color: C('#dcc49c') })); add('pumpHead', mergeGeometries(P3.head), std({ map: headTex, emissive: C('#ffffff'), emissiveMap: headTex, emissiveIntensity: 0.35 })); add('pumpTrim', mergeGeometries(P3.trim), std({ color: C('#8a7c74'), metalness: 0.6, roughness: 0.35 })); add('globe', mergeGeometries(P3.globe), glow('#ffb45c', 0.8));
  add('reds', mergeGeometries([pc(481.5, 42.6, 0.06, 0.1, 0.72), pc(542.5, 46, 0.18, 0.1, 0.66), pc(542.5, 46, 0.2, 0.36, 0.4), pc(542.5, 46, 0.2, 0.62, 0.68)]), std({ color: C('#c01c24'), roughness: 0.45 }));
  add('polefar', pc(422, 95, 0.07, 0, 3.6), std({ color: C('#3a2440') }));

  // ---- shop ----
  const A = BA, B = BB, D2 = BD, fw = wall(A, B), rw = wall(A, D2);
  const fq = (p, x0, y0, x1, y1, off) => quad([p(x0, y0, off), p(x1, y0, off), p(x1, y1, off), p(x0, y1, off)]);
  add('bodyBlue', prism([A, D2, [9.57, 55.4], B], 0, BTOP - 0.02), std({ color: C('#5aa4dc'), roughness: 0.6 }));
  add('roof', prism([[A[0] + 0.02, A[1] - 0.09], [D2[0] + 0.1, D2[1]], [9.57, 55.5], [B[0] - 0.1, B[1] + 0.02]], BTOP - 0.22, BTOP), std({ color: C('#2a6fc0'), roughness: 0.5 }));
  const pinkTex = canvasTex(512, 512, (x) => { x.fillStyle = '#e47f76'; x.fillRect(0, 0, 512, 512); for (let i = 0; i < 12; i++) { x.fillStyle = 'rgba(90,20,60,.35)'; x.fillRect(i * 43, 0, 4, 512); x.fillStyle = 'rgba(255,190,200,.22)'; x.fillRect(i * 43 + 5, 0, 4, 512); } });
  const pink = std({ map: pinkTex, roughness: 0.65, side: THREE.DoubleSide });
  add('pinkWall', fq(fw, 553.5, 692, 592.5, 789, 0.03), pink); add('pinkBand', fq(fw, 553.5, 695, 697.5, 708.5, 0.035), pink); add('pinkBand2', fq(rw, 698, 694, 760, 708, 0.035), pink);
  add('seam', fq(fw, 553.5, 708.3, 592.5, 709.2, 0.04), std({ color: C('#8a3a5c') })); add('notes', mergeGeometries([fq(fw, 569, 723.5, 575, 726, 0.045), fq(fw, 583, 731, 588, 753, 0.04)]), std({ color: C('#a84468') }));
  const trim = std({ color: C('#2b5f96'), roughness: 0.5 });
  const shop = (seed, door) => canvasTex(512, 420, (x, w, h) => {
    const r = rng(seed), pk = (a) => a[(r() * a.length) | 0], g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ffc23c'); g.addColorStop(0.5, '#ffd25e'); g.addColorStop(1, '#f2a43a'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(190,120,40,.35)'; for (let i = 1; i < 6; i++) x.fillRect(0, 40 + i * 1.5, w, 0.5); x.fillStyle = '#fff6cc'; x.fillRect(w * 0.1, 20, w * 0.32, 9); x.fillRect(w * 0.58, 30, w * 0.28, 8); x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(w * 0.08, 16, w * 0.36, 18);
    const PAL = ['#a8402c', '#6a4038', '#d06a34', '#86605a', '#d0983a', '#5a6070', '#90502c', '#e8d8a8', '#70805a'];
    const item = (q, y, ww, hh) => { const c = pk(PAL); x.fillStyle = c; if (r() < 0.4) { x.beginPath(); x.roundRect(q, y - hh * 0.72, ww, hh * 0.72, 2); x.fill(); x.fillRect(q + ww * 0.33, y - hh, ww * 0.34, hh * 0.32); } else x.fillRect(q, y - hh, ww, hh); x.fillStyle = r() < 0.6 ? 'rgba(255,240,200,.55)' : 'rgba(20,10,20,.4)'; x.fillRect(q + 1, y - hh * 0.5, ww - 2, hh * 0.2); x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(q + 0.6, y - hh * 0.7, 1, hh * 0.6); };
    const shelf = (X, Y, S, T, n = 4) => { x.fillStyle = '#5e3428'; x.fillRect(X, Y, S, T); for (let j = 0; j < n; j++) { const y = Y + ((j + 1) * T) / n; x.fillStyle = '#d9a455'; x.fillRect(X + 5, Y + 5 + (j * T) / n, S - 10, T / n - 9); let q = X + 7; while (q < X + S - 14) { const ww = 5 + r() * 9; item(q, y - 5, ww, (T / n) * (0.4 + r() * 0.36)); q += ww + 1.2 + r() * 2; } x.fillStyle = '#7a4632'; x.fillRect(X + 3, y - 5, S - 6, 3); x.fillStyle = '#fff0c0'; for (let k = 0; k < S / 26; k++) x.fillRect(X + 12 + k * 26, y - 4.5, 8, 2.2); } };
    if (door) { x.fillStyle = '#c98b3c'; x.fillRect(120, 270, 300, 150); shelf(250, 150, 190, 130, 3); x.fillStyle = '#8a5a34'; x.fillRect(110, 262, 180, 14); x.fillStyle = '#f6ecd0'; x.fillRect(70, 70, 110, 74); x.fillStyle = '#b03a2c'; x.font = 'bold 34px Arial'; x.fillText('OPEN', 76, 119); return; }
    shelf(66, 108, 206, 212); shelf(300, 112, 66, 150, 3); x.fillStyle = '#31506a'; x.fillRect(392, 92, 98, 190); for (let k = 0; k < 2; k++) { x.fillStyle = '#cfe6ea'; x.fillRect(397 + k * 47, 98, 42, 178); for (let j = 0; j < 4; j++) { let q = 399 + k * 47; while (q < 431 + k * 47) { const ww = 4 + r() * 4; item(q, 138 + j * 43, ww, 26 + r() * 8); q += ww + 1.4; } x.fillStyle = '#6a8a98'; x.fillRect(397 + k * 47, 138 + j * 43, 42, 2); } }
    x.fillStyle = '#9a5638'; x.fillRect(318, 330, 180, 90); x.fillStyle = '#c88a50'; x.fillRect(312, 322, 192, 10); let q = 324; while (q < 480) { const ww = 7 + r() * 9; item(q, 322, ww, 18 + r() * 30); q += ww + 2; } x.fillStyle = '#2c2c38'; x.fillRect(436, 284, 40, 38); x.fillStyle = '#9ad0a0'; x.fillRect(441, 289, 30, 10);
    x.fillStyle = '#b87a40'; x.fillRect(0, 352, 318, 68); x.fillStyle = 'rgba(90,40,20,.35)'; for (let i = 0; i < 9; i++) x.fillRect(i * 36, 352, 1.5, 68); x.fillStyle = '#e4583c'; x.fillRect(16, 60, 40, 54); x.fillStyle = '#fff0c8'; x.fillRect(21, 70, 30, 8); x.fillRect(21, 84, 22, 5);
  });
  add('winFrame', fq(fw, 622.5, 707.5, 690, 763, 0.03), trim); add('win1', fq(fw, 625, 710, 687.5, 761, 0.05), pane(shop(3, false), 1.12));
  add('doorFrame', fq(fw, 593, 709, 618.5, 789, 0.03), trim); add('transom', fq(fw, 595, 711.5, 617, 722.5, 0.05), glow('#f2b54c', 0.95));
  add('doorPanel', fq(fw, 595.5, 725, 616.5, 788, 0.045), std({ color: C('#3a6a94') })); add('doorGlass', fq(fw, 598, 727.5, 615, 757, 0.055), pane(shop(8, true), 0.95));
  add('mull', mergeGeometries([fq(fw, 655.3, 708, 656.8, 763, 0.07), fq(fw, 623, 722.3, 690, 723.4, 0.07), fq(fw, 623, 761, 690, 763, 0.07), fq(fw, 666, 763, 667, 789, 0.04), fq(fw, 641, 763, 642, 789, 0.04)]), std({ color: C('#274a78') }));
  add('winFrame2', fq(rw, 702.5, 707.5, 775, 763, 0.03), trim); add('win2', fq(rw, 704.5, 710, 770, 761, 0.05), pane(shop(5, false), 1.08));
  add('neonShop', mergeGeometries([tube(fw(604.5, 705.2, 0.14), fw(698, 704.4, 0.14), 0.034), tube(fw(698, 704.4, 0.14), rw(770, 703.2, 0.14), 0.034)]), glow('#8fe0ff', 1.6));
  add('kerb', prism([[A[0] + 0.3, A[1] - 0.75], [D2[0] + 1, D2[1] - 0.8], D2, A, B, [B[0] - 0.5, B[1] - 0.5]], 0, 0.06), std({ color: C('#d8b8a4') }));
  add('bollards', mergeGeometries([pc(632, 47.8, 0.07, 0, 0.72), pc(680.5, 46.6, 0.075, 0, 0.72), pc(709, 46.2, 0.08, 0, 0.6), pc(713, 45.9, 0.11, 0, 0.25)]), std({ color: C('#d89a28') }));
  add('trash', mergeGeometries([pc(607.5, 48.6, 0.13, 0, 0.5), pc(607.5, 48.6, 0.15, 0.48, 0.56)]), std({ color: C('#6a3a30') }));
  add('antenna', mergeGeometries([pc(616.5, 53, 0.035, 2.8, 4.35), pc(625.6, 53, 0.06, 2.8, 4.65), pc(622.5, 53.2, 0.02, 2.8, 3.9), box(0.36, 0.12, 0.12, at(630, 53), 3.0, -53)]), std({ color: C('#2c1c3a') }));

  // ---- small detail ----
  const hose = []; for (const [px, d] of [[401, 44.9], [455, 43.2], [513.5, 45]]) { const X = at(px, d), c = new THREE.CatmullRomCurve3([[0.2, 1.25, 0.28], [0.36, 0.9, 0.36], [0.33, 0.35, 0.36], [0.22, 0.28, 0.32], [0.16, 0.7, 0.28]].map(([a, b, z]) => new THREE.Vector3(X + a, b, -d + z))); hose.push(new THREE.TubeGeometry(c, 24, 0.016, 6)); }
  add('hoses', mergeGeometries(hose), std({ color: C('#0c0a10'), roughness: 0.5 }));
  const wire = []; for (const [y0, y1, d] of [[703, 706, 180], [707, 709, 180], [722, 727, 110]]) for (let i = 0; i < 12; i++) { const p = (t) => unproj(-120 + 860 * t, mix(y0, y1, t) + Math.sin(t * Math.PI * 4) ** 2 * 1.6, d); wire.push(tube(p(i / 12), p((i + 1) / 12), 0.016, 5)); }
  add('wires', mergeGeometries(wire), std({ color: C('#3a2044') }));
  add('polefar2', mergeGeometries([pc(422, 180, 0.1, 0, 4.4), pc(-90, 180, 0.1, 0, 4.2)]), std({ color: C('#3a2040') }));
  add('gutter', mergeGeometries([tube(fw(553.5, 694.5, 0.06), fw(697.5, 686.8, 0.1), 0.03), tube(fw(594, 790, 0.02), fw(594, 709, 0.02), 0.02)]), std({ color: C('#2a6fc0') }));
  const sd = []; for (const [x0, x1] of [[623.5, 640], [643, 665], [668, 689]]) sd.push(fq(fw, x0, 765, x1, 787, 0.034)); add('panels', mergeGeometries(sd), std({ color: C('#5a92c8'), roughness: 0.55 }));
  add('handle', mergeGeometries([tube(fw(613.8, 752, 0.09), fw(613.8, 766, 0.09), 0.018), box(0.5, 0.3, 0.4, at(660, 52), 3.08, -52, 0.8), box(0.9, 0.16, 0.6, at(690, 53), 3.0, -53, 0.8)]), std({ color: C('#a8a0a8'), metalness: 0.5, roughness: 0.4 }));
  const bulbs = []; for (let i = 0; i < 17; i++) for (const y of [0, 1]) { const t = i / 16, s0 = new THREE.SphereGeometry(0.022, 10, 8); s0.translate(...unproj(663 + 54 * t, (y ? 641.5 : 620.5) - 2.6 * t * 1.2, 49.9)); bulbs.push(s0); } add('bulbs', mergeGeometries(bulbs), glow('#ffe6b0', 1.3));
  add('canPosts', mergeGeometries([pc(713, 45.9, 0.05, 0.2, 0.5)]), std({ color: C('#b87820') }));

  // ---- sign ----
  const Sd = 50, sp = (x, y, f = 0) => unproj(x, y, Sd - f), board = (p, f) => quad(p.map((q) => sp(...q, f)));
  add('signBox', mergeGeometries([box(1.72, 0.74, 0.16, at(690, Sd), CAMH + ((730 - 630.5) * Sd) / F, -Sd - 0.1), box(1.5, 0.42, 0.16, at(690.5, Sd), CAMH + ((730 - 653) * Sd) / F, -Sd - 0.1)]), std({ color: C('#4a0c18') }));
  const t1 = canvasTex(768, 336, (x, w, h) => { x.fillStyle = '#b3131c'; x.fillRect(0, 0, w, h); x.strokeStyle = '#ffb0c0'; x.lineWidth = 14; x.strokeRect(9, 9, w - 18, h - 18); x.font = 'italic 700 268px "Brush Script MT","Segoe Script",cursive'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = '#ff8a2a'; x.shadowBlur = 34 * TK; x.fillStyle = '#ffd24a'; x.fillText('Desert', w / 2 - 6, h / 2 + 8, 690); x.shadowBlur = 0; x.lineWidth = 5; x.strokeStyle = '#fff2b0'; x.strokeText('Desert', w / 2 - 6, h / 2 + 8, 690); });
  const t2 = canvasTex(768, 232, (x, w, h) => { x.fillStyle = '#a8141c'; x.fillRect(0, 0, w, h); x.strokeStyle = '#ff9aa0'; x.lineWidth = 10; x.strokeRect(7, 7, w - 14, h - 14); x.font = '700 170px "Arial Narrow",Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = '#ff7a2a'; x.shadowBlur = 22 * TK; x.fillStyle = '#ffd9a0'; x.fillText('GAS & OIL', w / 2, h / 2 + 8, 690); });
  add('sign1', board([[660.5, 621.5], [719.5, 617.2], [719.5, 640.5], [660.5, 644.2]], 0.02), pane(t1, 1.25)); add('sign2', board([[664.5, 647.5], [716.5, 644.5], [716.5, 658.8], [664.5, 661.2]], 0.02), pane(t2, 1.15));
  add('signPole', mergeGeometries([pc(694, Sd + 0.1, 0.06, 2.9, 3.9), tube(sp(690, 619), sp(690, 612), 0.04)]), std({ color: C('#3a1430') }));
  const star = [], inn = [], c0 = [690, 604.5], pts = [...Array(10)].map((_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? 6 : 14; return [c0[0] + Math.cos(a) * rr * 0.93, c0[1] + Math.sin(a) * rr * 1.06]; });
  for (let i = 0; i < 10; i++) { const a = pts[i], b = pts[(i + 1) % 10]; star.push(tube(sp(...a, 0.06), sp(...b, 0.06), 0.034)); inn.push(...sp(...c0, 0.03), ...sp(...b, 0.03), ...sp(...a, 0.03)); }
  add('starNeon', mergeGeometries(star), glow('#ffe0ee', 1.5));
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(inn, 3)); sg.computeVertexNormals();
  add('starRed', sg, std({ color: C('#c02030'), emissive: C('#f03848'), emissiveIntensity: 0.75, side: THREE.DoubleSide }));
  // ---- distant settlement lights ----
  const r = rng(4), far = [], spark = (px, py, s) => { const d = 1250, g = new THREE.OctahedronGeometry((s * d) / F, 0); g.translate(...unproj(px, py, d)); far.push(g); };
  for (let i = 0; i < 46; i++) spark(r() * 74, 718 + r() * 3.4, 0.35 + r() * 0.55);
  for (let i = 0; i < 26; i++) spark(138 + r() * 62, 720 + r() * 3.5, 0.35 + r() * 0.75);
  for (let i = 0; i < 26; i++) spark(390 + r() * 62, 722 + r() * 4.5, 0.3 + r() * 0.6);
  for (let i = 0; i < 40; i++) spark(-160 + r() * 900, 721 + r() * 8, 0.2 + r() * 0.3);
  add('farLights', mergeGeometries(far), glow('#ffd0c0', 1.25));
}
