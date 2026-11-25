import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { F, CX, CAMH, rng, unproj, wall } from './util.js';
import { C, std, glow, pane, canvasTex, quad, tube, box, prism, cyl } from './kit.js';

// Canopy parallelogram on the ground plane: corner + two edges [X, depth].
export const CC = [2.65, 41], E1 = [-3.36, 4], E2 = [3.49, 3], CAN_T = 3.26, CAN_B = 2.8;
export const cp = (t, u) => [CC[0] + t * E1[0] + u * E2[0], CC[1] + t * E1[1] + u * E2[1]];
export const BA = [9.41, 47.9], BB = [5.78, 51.5], BD = [13.2, 51.8], BTOP = 2.93;

export function buildStation(add) {
  const yT = CAN_T, yB = CAN_B, at = (px, d) => ((px - CX) * d) / F, pc = (px, d, r, y0, y1) => cyl(at(px, d), d, r, y0, y1);
  add('fascia', prism([cp(0, 0), cp(0, 1), cp(1, 1), cp(1, 0)], yB, yT), std({ color: C('#12a0c8'), roughness: 0.45, emissive: C('#08a0d0'), emissiveIntensity: 0.75 }));
  add('soffit', prism([cp(0.02, 0.02), cp(0.02, 0.98), cp(0.98, 0.98), cp(0.98, 0.02)], yB - 0.015, yB + 0.01), std({ color: C('#d8c0b0') }));
  const neon = [], o = -0.012;
  for (const y of [yT - 0.1, yB + 0.17, yB + 0.05]) { const p = (t, u) => { const q = cp(t, u); return [q[0], y, -q[1]]; }; neon.push(tube(p(o, 1), p(o, o), 0.03), tube(p(o, o), p(1, o), 0.03)); }
  add('neonCanopy', mergeGeometries(neon), glow('#6fe6ff', 1.25));
  const lamps = [];
  for (const [t, u, L, dir] of [[0.72, 0.1, 1.3, 0], [0.3, 0.12, 1.0, 0], [0.1, 0.35, 0.8, 1], [0.1, 0.72, 1.2, 1], [0.6, 0.55, 1.0, 0], [0.4, 0.8, 1, 1], [0.5, 0.3, 0.7, 1]]) { const c = cp(t, u), e = dir ? E2 : E1, k = L / 2 / Math.hypot(...e); lamps.push(tube([c[0] - e[0] * k, yB - 0.05, -(c[1] - e[1] * k)], [c[0] + e[0] * k, yB - 0.05, -(c[1] + e[1] * k)], 0.045)); }
  add('lamps', mergeGeometries(lamps), glow('#ffd6a0', 2.2));
  const yaw = Math.atan2(E1[1], E1[0]);
  add('columns', mergeGeometries([[0.75, 0.165], [0.136, 0.15], [0.15, 0.8], [0.75, 0.8]].map(([t, u]) => { const c = cp(t, u); return box(0.17, yB, 0.17, c[0], yB / 2, -c[1], yaw); })), std({ color: C('#d9b8a4'), roughness: 0.55 }));
  const rect = (c, e, w, l) => { const n = Math.hypot(...e), a = [e[0] / n, e[1] / n], b = [-a[1], a[0]]; return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, j]) => [c[0] + (a[0] * i * l) / 2 + (b[0] * j * w) / 2, c[1] + (a[1] * i * l) / 2 + (b[1] * j * w) / 2]); };
  add('islands', mergeGeometries([prism(rect([1.78, 43.5], E1, 1.15, 5.0), 0, 0.14), prism(rect([4.1, 45.2], E1, 0.7, 1.5), 0, 0.12), prism(rect([5.15, 45.3], E2, 0.7, 1.4), 0, 0.12)]), std({ color: C('#a08c84') }));
  const pumpTex = canvasTex(256, 768, (x, w, h) => {
    x.fillStyle = '#e8d8c0'; x.fillRect(0, 0, w, h); x.fillStyle = '#2c2430'; x.fillRect(28, 60, w - 56, 120); x.fillStyle = '#caa27a'; x.fillRect(40, 74, w - 80, 60);
    x.fillStyle = '#f3e6cc'; x.fillRect(18, 190, w - 36, 70); x.fillStyle = '#b5483c'; x.font = 'bold 46px Arial'; x.fillText('GAS', 72, 243);
    x.fillStyle = '#31395c'; x.fillRect(18, 285, w - 36, 150); x.fillStyle = '#e0b890'; x.fillRect(34, 300, 80, 60); x.fillStyle = '#8fc6dc'; x.fillRect(140, 310, 70, 40); x.fillStyle = '#e9e0d0'; for (let i = 0; i < 4; i++) x.fillRect(36, 376 + i * 14, 60 + i * 10, 6);
    x.fillStyle = '#b9a58c'; x.fillRect(0, 440, w, 8); x.fillStyle = '#5a4438'; x.fillRect(70, 478, 30, 44);
    x.strokeStyle = '#141018'; x.lineWidth = 9; x.beginPath(); x.moveTo(210, 300); x.bezierCurveTo(250, 520, 220, 740, 190, 720); x.bezierCurveTo(150, 690, 190, 520, 176, 470); x.stroke();
  });
  const pf = [], ps = [], pt = [], gl = [], yw = -0.55;
  for (const [px, d, globe] of [[401, 44.9, 0], [455, 43.2, 1], [513.5, 45, 0]]) {
    const X = at(px, d); ps.push(box(0.52, 1.58, 0.34, X, 0.92, -d, yw)); pt.push(box(0.56, 0.07, 0.36, X, 1.72, -d, yw));
    const f = new THREE.PlaneGeometry(0.52, 1.58); f.translate(0, 0, 0.175); f.rotateY(yw); f.translate(X, 0.92, -d); pf.push(f);
    if (globe) { const s = new THREE.SphereGeometry(0.13, 20, 14); s.translate(X, 1.86, -d); gl.push(s); }
  }
  add('pumpFront', mergeGeometries(pf), std({ map: pumpTex, roughness: 0.4 })); add('pumpSide', mergeGeometries(ps), std({ color: C('#33406e'), roughness: 0.4 }));
  add('pumpTop', mergeGeometries(pt), std({ color: C('#e6d0b0') })); add('globe', mergeGeometries(gl), glow('#ffb45c', 1.1));
  add('reds', mergeGeometries([pc(481.5, 42.6, 0.06, 0.1, 0.72), pc(542.5, 46, 0.18, 0.1, 0.66), pc(542.5, 46, 0.2, 0.36, 0.4), pc(542.5, 46, 0.2, 0.62, 0.68)]), std({ color: C('#c01c24'), roughness: 0.45 }));
  add('polefar', pc(422, 95, 0.07, 0, 3.6), std({ color: C('#3a2440') }));

  // ---- shop ----
  const A = BA, B = BB, D2 = BD, fw = wall(A, B), rw = wall(A, D2);
  const fq = (p, x0, y0, x1, y1, off) => quad([p(x0, y0, off), p(x1, y0, off), p(x1, y1, off), p(x0, y1, off)]);
  add('bodyBlue', prism([A, D2, [9.57, 55.4], B], 0, BTOP - 0.02), std({ color: C('#4a9ad8'), roughness: 0.6 }));
  add('roof', prism([[A[0] + 0.02, A[1] - 0.09], [D2[0] + 0.1, D2[1]], [9.57, 55.5], [B[0] - 0.1, B[1] + 0.02]], BTOP - 0.22, BTOP), std({ color: C('#2a6fc0'), roughness: 0.5 }));
  const pinkTex = canvasTex(512, 512, (x) => { x.fillStyle = '#f0708e'; x.fillRect(0, 0, 512, 512); for (let i = 0; i < 12; i++) { x.fillStyle = 'rgba(90,20,60,.35)'; x.fillRect(i * 43, 0, 4, 512); x.fillStyle = 'rgba(255,190,200,.22)'; x.fillRect(i * 43 + 5, 0, 4, 512); } });
  const pink = std({ map: pinkTex, roughness: 0.65, side: THREE.DoubleSide });
  add('pinkWall', fq(fw, 553.5, 692, 592.5, 789, 0.03), pink); add('pinkBand', fq(fw, 553.5, 695, 697.5, 708.5, 0.035), pink); add('pinkBand2', fq(rw, 698, 694, 760, 708, 0.035), pink);
  add('seam', fq(fw, 553.5, 708.3, 592.5, 709.2, 0.04), std({ color: C('#8a3a5c') })); add('notes', mergeGeometries([fq(fw, 569, 723.5, 575, 726, 0.045), fq(fw, 583, 731, 588, 753, 0.04)]), std({ color: C('#a84468') }));
  const trim = std({ color: C('#2b5f96'), roughness: 0.5 });
  const shop = (seed, door) => canvasTex(512, 420, (x, w, h) => {
    const r = rng(seed), g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ffcb50'); g.addColorStop(0.5, '#ffd870'); g.addColorStop(1, '#f3b64e'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = '#fff3c0'; x.fillRect(w * 0.12, 22, w * 0.3, 12); x.fillRect(w * 0.6, 34, w * 0.26, 10);
    const shelf = (X, Y, S, T) => { x.fillStyle = '#6b3c30'; x.fillRect(X, Y, S, T); for (let j = 0; j < 4; j++) { x.fillStyle = '#e7b765'; x.fillRect(X + 8, Y + 8 + (j * T) / 4, S - 16, T / 4 - 14); let q = X + 10; while (q < X + S - 18) { const ww = 8 + r() * 14, hh = (T / 4) * (0.35 + r() * 0.35); x.fillStyle = ['#8a2f2c', '#3d2a3a', '#c25a34', '#5a4a68', '#b8863a', '#2f4660'][(r() * 6) | 0]; x.fillRect(q, Y + ((j + 1) * T) / 4 - 8 - hh, ww, hh); q += ww + 3; } } };
    if (door) { x.fillStyle = '#c98b3c'; x.fillRect(120, 250, 300, 170); x.fillStyle = '#7a4632'; x.fillRect(260, 180, 170, 110); } else {
      shelf(70, 110, 210, 210); shelf(300, 120, 60, 130); x.fillStyle = '#a05a3c'; x.fillRect(330, 330, 160, 90);
      for (let i = 0; i < 9; i++) { x.fillStyle = ['#7a2f2c', '#5a3a4a', '#d8a050'][i % 3]; x.fillRect(336 + i * 17, 305 + r() * 18, 13, 50); }
      x.fillStyle = '#e4c078'; x.fillRect(430, 120, 50, 70); x.fillStyle = '#b87a40'; x.fillRect(0, 350, 320, 70);
    }
  });
  add('winFrame', fq(fw, 622.5, 707.5, 690, 763, 0.03), trim); add('win1', fq(fw, 625, 710, 687.5, 761, 0.05), pane(shop(3, false), 1.02));
  add('doorFrame', fq(fw, 593, 709, 618.5, 789, 0.03), trim); add('transom', fq(fw, 595, 711.5, 617, 722.5, 0.05), glow('#f2b54c', 0.95));
  add('doorPanel', fq(fw, 595.5, 725, 616.5, 788, 0.045), std({ color: C('#3a6a94') })); add('doorGlass', fq(fw, 598, 727.5, 615, 757, 0.055), pane(shop(8, true), 0.95));
  add('mull', mergeGeometries([fq(fw, 655.3, 708, 656.8, 763, 0.07), fq(fw, 623, 722.3, 690, 723.4, 0.07), fq(fw, 623, 761, 690, 763, 0.07), fq(fw, 666, 763, 667, 789, 0.04), fq(fw, 641, 763, 642, 789, 0.04)]), std({ color: C('#274a78') }));
  add('winFrame2', fq(rw, 702.5, 707.5, 775, 763, 0.03), trim); add('win2', fq(rw, 704.5, 710, 770, 761, 0.05), pane(shop(5, false), 0.98));
  add('neonShop', mergeGeometries([tube(fw(604.5, 705.2, 0.14), fw(698, 704.4, 0.14), 0.034), tube(fw(698, 704.4, 0.14), rw(770, 703.2, 0.14), 0.034)]), glow('#8fe0ff', 1.6));
  add('kerb', prism([[A[0] + 0.3, A[1] - 0.75], [D2[0] + 1, D2[1] - 0.8], D2, A, B, [B[0] - 0.5, B[1] - 0.5]], 0, 0.06), std({ color: C('#d8b8a4') }));
  add('bollards', mergeGeometries([pc(632, 47.8, 0.07, 0, 0.72), pc(680.5, 46.6, 0.075, 0, 0.72), pc(709, 46.2, 0.08, 0, 0.6), pc(713, 45.9, 0.11, 0, 0.25)]), std({ color: C('#d89a28') }));
  add('trash', mergeGeometries([pc(607.5, 48.6, 0.13, 0, 0.5), pc(607.5, 48.6, 0.15, 0.48, 0.56)]), std({ color: C('#6a3a30') }));
  add('antenna', mergeGeometries([pc(616.5, 53, 0.035, 2.8, 4.35), pc(625.6, 53, 0.06, 2.8, 4.65), pc(622.5, 53.2, 0.02, 2.8, 3.9), box(0.36, 0.12, 0.12, at(630, 53), 3.0, -53)]), std({ color: C('#2c1c3a') }));

  // ---- sign ----
  const Sd = 50, sp = (x, y, f = 0) => unproj(x, y, Sd - f), board = (p, f) => quad(p.map((q) => sp(...q, f)));
  add('signBox', mergeGeometries([box(1.72, 0.74, 0.16, at(690, Sd), CAMH + ((730 - 630.5) * Sd) / F, -Sd - 0.1), box(1.5, 0.42, 0.16, at(690.5, Sd), CAMH + ((730 - 653) * Sd) / F, -Sd - 0.1)]), std({ color: C('#4a0c18') }));
  const t1 = canvasTex(768, 336, (x, w, h) => { x.fillStyle = '#b3131c'; x.fillRect(0, 0, w, h); x.strokeStyle = '#ffb0c0'; x.lineWidth = 14; x.strokeRect(9, 9, w - 18, h - 18); x.font = 'italic 700 268px "Brush Script MT","Segoe Script",cursive'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = '#ff8a2a'; x.shadowBlur = 34; x.fillStyle = '#ffd24a'; x.fillText('Desert', w / 2 - 6, h / 2 + 8, 690); x.shadowBlur = 0; x.lineWidth = 5; x.strokeStyle = '#fff2b0'; x.strokeText('Desert', w / 2 - 6, h / 2 + 8, 690); });
  const t2 = canvasTex(768, 232, (x, w, h) => { x.fillStyle = '#a8141c'; x.fillRect(0, 0, w, h); x.strokeStyle = '#ff9aa0'; x.lineWidth = 10; x.strokeRect(7, 7, w - 14, h - 14); x.font = '700 170px "Arial Narrow",Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = '#ff7a2a'; x.shadowBlur = 22; x.fillStyle = '#ffd9a0'; x.fillText('GAS & OIL', w / 2, h / 2 + 8, 690); });
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
