import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { rng, clamp, mix, smooth } from './util.js';
import { C, std, glow, canvasTex, quad, tube, box, tris } from './kit.js';

export const VO = [-2.81, 40.6], VR = [2.63, 2.62], VW = [-1.78, 0.32], VH = 1.98;
// Local van frame: l 0..1 front to rear, w 0..1 near to far side, y metres. The frame is sheared to match the reference.
export const P = (l, w, y) => [VO[0] + l * VR[0] + w * VW[0], y, -(VO[1] + l * VR[1] + w * VW[1])];
const PROF = [[0.012, 0.36], [0, 0.55], [0, 0.98], [0.012, 1.12], [0.035, 1.22], [0.145, 1.8], [0.185, 1.91], [0.25, 1.96], [0.5, VH], [0.82, 1.965], [0.9, 1.93], [0.935, 1.85], [0.98, 1.3], [0.995, 1.1], [1, 0.6], [0.992, 0.36]];
const inset = (y) => 0.012 + 0.07 * smooth(1.1, 1.95, y) + 0.05 * smooth(1.82, 1.98, y) + 0.02 * smooth(0.6, 0.36, y);
const BLUE = '#3cc4e8', DARK = '#0c0d16';

function frontArt(x, w, h) {
  const Y = (m) => h - (m / 2) * h; x.fillStyle = BLUE; x.fillRect(0, 0, w, h); x.fillStyle = '#c79a3c'; x.fillRect(0, Y(1.2), w, Y(0.93) - Y(1.2)); x.fillStyle = '#e0b860'; x.fillRect(0, Y(1.2), w, 10);
  x.fillStyle = '#0a0a12'; x.beginPath(); x.roundRect(w * 0.06, Y(1.85), w * 0.88, Y(1.23) - Y(1.85), 34); x.fill();
  const g = x.createLinearGradient(0, Y(1.85), 0, Y(1.22)); g.addColorStop(0, '#15142a'); g.addColorStop(0.55, '#3b2a52'); g.addColorStop(1, '#1a1428'); x.fillStyle = g; x.beginPath(); x.roundRect(w * 0.085, Y(1.82), w * 0.83, Y(1.26) - Y(1.82), 26); x.fill();
  x.fillStyle = 'rgba(190,120,190,.38)'; x.beginPath(); x.moveTo(w * 0.14, Y(1.3)); x.lineTo(w * 0.24, Y(1.78)); x.lineTo(w * 0.55, Y(1.78)); x.lineTo(w * 0.5, Y(1.3)); x.fill();
  x.strokeStyle = '#08080e'; x.lineWidth = 7; x.beginPath(); x.moveTo(w * 0.2, Y(1.24)); x.lineTo(w * 0.5, Y(1.29)); x.moveTo(w * 0.52, Y(1.24)); x.lineTo(w * 0.85, Y(1.29)); x.stroke();
  x.fillStyle = DARK; x.fillRect(w * 0.03, Y(1.06), w * 0.94, Y(0.84) - Y(1.06)); x.strokeStyle = '#2a2a38'; x.lineWidth = 3; for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(w * 0.16, Y(1.04 - i * 0.035)); x.lineTo(w * 0.84, Y(1.04 - i * 0.035)); x.stroke(); }
  x.strokeStyle = '#8f8a90'; x.lineWidth = 6; x.beginPath(); x.arc(w * 0.5, Y(0.95), 22, 0, 7); x.stroke(); x.fillStyle = DARK; x.beginPath(); x.roundRect(w * 0.16, Y(0.74), w * 0.68, Y(0.57) - Y(0.74), 12); x.fill();
  x.fillStyle = '#e07a2a'; x.fillRect(w * 0.875, Y(0.72), 60, 36); x.fillRect(w * 0.04, Y(0.72), 40, 32);
}
function sideArt(x, w, h) {
  const X = (l) => l * w, Y = (m) => h - (m / 2) * h; x.fillStyle = BLUE; x.fillRect(0, 0, w, h); x.fillStyle = '#4aa8e8'; x.fillRect(0, 0, w, Y(1.22));
  x.fillStyle = '#c29a3e'; x.beginPath(); x.moveTo(0, Y(1.24)); x.lineTo(w, Y(1.24)); x.lineTo(w, Y(0.9));
  const pt = [[0.96, 0.82], [0.93, 0.9], [0.86, 0.88], [0.8, 0.92], [0.74, 0.8], [0.69, 0.66], [0.6, 0.55], [0.5, 0.53], [0.43, 0.6], [0.39, 0.78], [0.33, 0.86], [0.24, 0.83], [0.14, 0.9], [0.06, 0.86], [0, 0.88]];
  pt.forEach((q, i) => { const p = i ? pt[i - 1] : [1, 0.9]; x.quadraticCurveTo(X(p[0]), Y(p[1]), X((q[0] + p[0]) / 2), Y((q[1] + p[1]) / 2)); }); x.lineTo(0, Y(0.88)); x.closePath(); x.fill();
  x.fillStyle = '#8a6a24'; for (const m of [1.15, 1.08, 1.02]) x.fillRect(X(0.36), Y(m), X(0.62), 7); x.fillStyle = 'rgba(255,220,140,.5)'; x.fillRect(0, Y(1.245), w, 8);
  x.fillStyle = '#0b0b14'; x.beginPath(); x.moveTo(X(0.075), Y(1.27)); x.lineTo(X(0.175), Y(1.78)); x.lineTo(X(0.33), Y(1.78)); x.lineTo(X(0.335), Y(1.27)); x.closePath(); x.fill();
  x.fillStyle = '#5a2c30'; x.beginPath(); x.arc(X(0.27), Y(1.4), 48, 0, 7); x.fill(); x.strokeStyle = '#2a7fa8'; x.lineWidth = 12; x.beginPath(); x.moveTo(X(0.165), Y(1.78)); x.lineTo(X(0.155), Y(1.27)); x.stroke();
  x.fillStyle = '#0b0b16'; x.beginPath(); x.moveTo(X(0.87), Y(1.76)); x.lineTo(X(0.925), Y(1.74)); x.lineTo(X(0.955), Y(1.32)); x.lineTo(X(0.9), Y(1.32)); x.closePath(); x.fill();
  // abstract painted panel (original artwork, no lettering)
  x.fillStyle = '#d2a63a'; x.fillRect(X(0.5), Y(1.74), X(0.33), Y(1.3) - Y(1.74)); const r = rng(5); x.fillStyle = '#c62a24';
  for (let i = 0; i < 46; i++) { x.beginPath(); x.ellipse(X(0.53 + (i % 12) * 0.023) + r() * 10, Y(1.68 - ((i / 12) | 0) * 0.1) + r() * 12, 14 + r() * 8, 10 + r() * 10, r() * 3, 0, 7); x.fill(); }
  x.strokeStyle = '#e86a30'; x.lineWidth = 5; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(X(0.52), Y(1.66 - i * 0.1)); x.bezierCurveTo(X(0.6), Y(1.8 - i * 0.1), X(0.7), Y(1.5 - i * 0.1), X(0.82), Y(1.66 - i * 0.1)); x.stroke(); }
  x.strokeStyle = 'rgba(220,210,255,.75)'; x.lineWidth = 8; x.beginPath(); x.moveTo(X(0.36), Y(1.34)); x.lineTo(X(0.54), Y(1.4)); x.stroke();
  for (const [l, m, s] of [[0.075, 0.86, 46], [0.66, 0.9, 54]]) { x.fillStyle = '#d02c28'; for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3; x.beginPath(); x.ellipse(X(l) + Math.cos(a) * s * 0.5, Y(m) + Math.sin(a) * s * 0.62, s * 0.42, s * 0.5, a, 0, 7); x.fill(); } x.fillStyle = '#f08a3c'; x.beginPath(); x.arc(X(l), Y(m), s * 0.28, 0, 7); x.fill(); }
  x.strokeStyle = 'rgba(8,30,60,.55)'; x.lineWidth = 4; for (const l of [0.06, 0.345, 0.7]) { x.beginPath(); x.moveTo(X(l), Y(1.8)); x.lineTo(X(l), Y(0.55)); x.stroke(); }
  x.fillStyle = '#1a1a26'; x.fillRect(X(0.3), Y(1.1), 54, 14); x.fillStyle = 'rgba(10,30,60,.5)'; x.fillRect(0, Y(0.52), w, 5);
  x.fillStyle = '#080810'; for (const l of [0.112, 0.765]) { x.beginPath(); x.ellipse(X(l), Y(0.34), X(0.098), (0.42 / 2) * h, 0, Math.PI, 0); x.fill(); }
}
export function buildVan(add) {
  const DS = THREE.DoubleSide, sp = new THREE.CatmullRomCurve3(PROF.map(([a, b]) => new THREE.Vector3(a, b, 0)), false, 'centripetal').getPoints(110).map((v) => [v.x, v.y]);
  const n = sp.length, nw = 18, pos = [], uv = [], front = [], rest = [];
  for (let j = 0; j <= nw; j++) { const w = j / nw, edge = Math.pow(Math.abs(2 * w - 1), 8); for (const [l, y] of sp) { const s = inset(y), bow = l < 0.2 ? edge * 0.02 + Math.pow(2 * w - 1, 2) * 0.012 : 0; pos.push(...P(l + bow, mix(s, 1 - s, w), y - edge * 0.015 * smooth(1.85, 1.98, y))); uv.push(1 - w, y / 2); } }
  for (let j = 0; j < nw; j++) for (let i = 0; i < n - 1; i++) { const a = j * n + i, b = a + n, [l, y] = sp[i]; (l < 0.17 && y < 1.9 && i < n / 2 ? front : rest).push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex([...front, ...rest]); g.computeVertexNormals();
  const g2 = g.clone(); g.setIndex(front); g2.setIndex(rest);
  add('vanFront', g, std({ map: canvasTex(768, 768, frontArt), roughness: 0.28, metalness: 0.1, side: DS })); add('vanRoof', g2, std({ color: C('#3f9fc8'), roughness: 0.3, metalness: 0.1, side: DS }));
  const bound = (y) => { let lo = 1, hi = 0; for (let i = 1; i < n; i++) { const a = sp[i - 1], b = sp[i]; if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]) { const l = mix(a[0], b[0], (y - a[1]) / (b[1] - a[1])); lo = Math.min(lo, l); hi = Math.max(hi, l); } } return [lo, hi]; };
  const side = (far) => {
    const ny = 26, nl = 60, ps = [], us = [], is = [];
    for (let j = 0; j <= ny; j++) { const y = mix(0.365, 1.972, j / ny), [a, b] = bound(y); for (let i = 0; i <= nl; i++) { const l = mix(a, b, i / nl), bul = 0.004 * Math.sin(Math.PI * clamp((y - 0.4) / 0.8)), s = inset(y) - bul; ps.push(...P(l, far ? 1 - s : s, y)); us.push(l, y / 2); } }
    for (let j = 0; j < ny; j++) for (let i = 0; i < nl; i++) { const a = j * (nl + 1) + i, e = a + nl + 1; far ? is.push(a, e, a + 1, a + 1, e, e + 1) : is.push(a, a + 1, e, a + 1, e + 1, e); }
    const q = new THREE.BufferGeometry(); q.setAttribute('position', new THREE.Float32BufferAttribute(ps, 3)); q.setAttribute('uv', new THREE.Float32BufferAttribute(us, 2)); q.setIndex(is); q.computeVertexNormals(); return q;
  };
  add('vanSide', side(false), std({ map: canvasTex(1536, 704, sideArt), roughness: 0.3, metalness: 0.1, side: DS })); add('vanFar', side(true), std({ color: C(BLUE), side: DS }));
  add('vanFloor', quad([P(0.02, 0.05, 0.37), P(0.02, 0.95, 0.37), P(0.98, 0.95, 0.37), P(0.98, 0.05, 0.37)]), std({ color: C('#08080c'), side: DS }));
  const bar = (l0, l1, y0, y1, w0, w1) => { const s = [[l0, y0], [l0, y1], [l1, y1], [l1, y0]], a = s.map(([l, y]) => P(l, w0, y)), b = s.map(([l, y]) => P(l, w1, y)); return [...a.map((_, i) => quad([a[i], b[i], b[(i + 1) % 4], a[(i + 1) % 4]])), quad(a), quad(b)]; };
  add('bumper', mergeGeometries([...bar(-0.05, 0.015, 0.4, 0.54, -0.03, 1.03), ...bar(0.985, 1.03, 0.4, 0.52, -0.03, 1)]), std({ color: C('#1a1820'), roughness: 0.35, metalness: 0.3, side: DS }));
  add('bumperTrim', quad([P(-0.053, 1.02, 0.53), P(-0.053, -0.02, 0.53), P(-0.053, -0.02, 0.5), P(-0.053, 1.02, 0.5)]), std({ color: C('#8a7c86'), metalness: 0.7, roughness: 0.3, side: DS }));
  const hl = [];
  for (const w of [0.125, 0.885]) { const q = [], f = (t) => P(-0.016, w + Math.cos(t) * 0.062, 0.95 + Math.sin(t) * 0.105); for (let i = 0; i < 24; i++) q.push(...P(-0.018, w, 0.95), ...f((i / 24) * 6.283), ...f(((i + 1) / 24) * 6.283)); hl.push(tris(q)); }
  const hm = glow('#ffe2a8', 1.35); hm.side = DS; add('headlights', mergeGeometries(hl), hm);
  const tyre = [], rim = [], hub = [];
  const ring = (arr, l, w, r0, r1, o0, o1) => { const q = [], f = (t, r, o) => P(l + (Math.cos(t) * r) / 3.7, w + o, 0.31 + Math.sin(t) * r); for (let i = 0; i < 36; i++) { const a = (i / 36) * 6.2832, b = ((i + 1) / 36) * 6.2832; q.push(...f(a, r0, o0), ...f(a, r1, o1), ...f(b, r1, o1), ...f(a, r0, o0), ...f(b, r1, o1), ...f(b, r0, o0)); } arr.push(tris(q)); };
  for (const l of [0.112, 0.765]) for (const w of [0, 0.9]) { ring(tyre, l, w, 0.31, 0.31, 0.13, -0.012); ring(tyre, l, w, 0.31, 0.205, -0.012, -0.02); ring(rim, l, w, 0.205, 0.185, -0.021, -0.022); ring(hub, l, w, 0.185, 0.13, -0.018, 0.005); ring(rim, l, w, 0.13, 0, 0, -0.016); ring(tyre, l, w, 0.31, 0, 0.1, 0.1); }
  add('tyres', mergeGeometries(tyre), std({ color: C('#0c0b10'), roughness: 0.9, side: DS })); add('rims', mergeGeometries(rim), std({ color: C('#d8c4bc'), roughness: 0.3, metalness: 0.6, side: DS })); add('hubs', mergeGeometries(hub), std({ color: C('#6a4a48'), roughness: 0.4, metalness: 0.4, side: DS }));
  add('rack', mergeGeometries([tube(P(0.45, 0.16, 2.0), P(0.85, 0.16, 1.99), 0.018), tube(P(0.45, 0.8, 2.0), P(0.85, 0.8, 1.99), 0.018)]), std({ color: C('#33303c') }));
  add('mirror', box(0.12, 0.16, 0.06, ...P(0.1, -0.06, 1.3)), std({ color: C('#121018') }));
}
