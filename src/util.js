// Deterministic RNG, noise and calibrated pinhole helpers shared by every renderer.
export const W = 720, H = 1280, F = 1720, CX = 360, CY = 730, CAMH = 1.7, PIVOT = 43;
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const h2 = (x, y) => { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
export function vnoise(x, y) {
  const i = Math.floor(x), j = Math.floor(y), u = x - i, v = y - j;
  const a = u * u * u * (u * (u * 6 - 15) + 10), b = v * v * v * (v * (v * 6 - 15) + 10);
  const p = h2(i, j), q = h2(i + 1, j), r = h2(i, j + 1), s = h2(i + 1, j + 1);
  return p + (q - p) * a + (r - p) * b + (p - q - r + s) * a * b;
}
export function fbm(x, y, o = 5, g = 0.5) {
  let s = 0, a = 1, n = 0;
  for (let i = 0; i < o; i++) { s += a * vnoise(x, y); n += a; a *= g; const t = x * 1.62 - y * 1.21 + 17.3; y = x * 1.21 + y * 1.62 + 9.1; x = t; }
  return s / n;
}
export function ridged(x, y, o = 5) {
  let s = 0, a = 1, n = 0;
  for (let i = 0; i < o; i++) { s += a * (1 - Math.abs(2 * vnoise(x, y) - 1)); n += a; a *= 0.5; const t = x * 1.62 - y * 1.21 + 3.7; y = x * 1.21 + y * 1.62 + 5.1; x = t; }
  return s / n;
}
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const mix = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
export const lin = (c) => c.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
export const hl = (s) => lin(hex(s));
export const mix3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
export function ramp(stops, x) {
  if (x <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) if (x <= stops[i][0]) {
    const t = (x - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]);
    return Array.isArray(stops[0][1]) ? mix3(stops[i - 1][1], stops[i][1], t) : mix(stops[i - 1][1], stops[i][1], t);
  }
  return stops[stops.length - 1][1];
}
// World: x right, y up, camera looks along -z; depth d = -z.
export const unproj = (px, py, d) => [((px - CX) * d) / F, CAMH - ((py - CY) * d) / F, -d];
export const groundDepth = (py) => (F * CAMH) / (py - CY);
export const onGround = (px, py) => unproj(px, py, groundDepth(py));
// Vertical plane through two floor points a, b given as [X, depth].
export function wall(a, b) {
  const dx = b[0] - a[0], dd = b[1] - a[1];
  return (px, py, off = 0) => { const k = (px - CX) / F; const t = (k * a[1] - a[0]) / (dx - k * dd); return unproj(px, py, a[1] + t * dd - off); };
}
// Camera track, fitted from template tracking of the middle bush (one sample per 30 frames).
const TR = [0, 17, 42, 72, 100, 126, 151, 174, 197, 217, 236, 253].map((v) => v / 253);
export const TRAVEL = 1.62; // metres of lateral truck over the whole shot
export function camX(frame) {
  const k = clamp(frame / 30, 0, 11), i = Math.min(10, Math.floor(k)), at = (n) => TR[clamp(n, 0, 11)], t = k - i;
  const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
  const v = 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t * t * t);
  return -(v - TR[5]) * TRAVEL;
}
