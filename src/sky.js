import { hex, mix3, ramp, fbm, vnoise, smooth, clamp } from './util.js';
const stops = (a) => a.map(([y, c]) => [y, hex(c)]);
const L = stops([[-400, '#5f4da0'], [-60, '#7a55ac'], [0, '#855aa9'], [80, '#9f5aa2'], [160, '#c45d99'], [250, '#d16497'], [330, '#e46f90'], [400, '#e46b92'], [450, '#f4727f'], [490, '#f78a78'], [540, '#f68f74'], [600, '#f58c72'], [700, '#e58a78']]);
const R = stops([[-400, '#4f469a'], [-60, '#6250a7'], [0, '#6a53a6'], [120, '#7d56a3'], [240, '#9258a0'], [330, '#b45b9a'], [400, '#c85a90'], [450, '#c85c92'], [500, '#da5e86'], [540, '#e8677f'], [600, '#f0747a'], [700, '#d87080']]);
const PINK = hex('#fb7288'), GOLD = hex('#ff9a6a'), PUR1 = hex('#8a5aa8'), PUR2 = hex('#c8659a'), GLOW = hex('#fdaa62');
// sRGB colour of the sky at a calibrated pixel position.
export function sky(px, py) {
  const lr = smooth(-60, 760, px + (py - 300) * 0.15);
  let c = mix3(ramp(L, py), ramp(R, py), lr);
  const wx = fbm(px * 0.004 + 3, py * 0.006, 3) - 0.5, wy = fbm(px * 0.003 + 31, py * 0.007 + 7, 4) - 0.5;
  const s = py - px * 0.17 + wy * 90;
  const a = fbm(px * 0.0021 + wx * 0.5, s * 0.0125, 4), b = fbm(px * 0.0062 + wx, s * 0.034 + 40, 5, 0.58), d = fbm(px * 0.013, s * 0.095 + 9, 4, 0.6);
  const amp = 0.2 + 0.5 * smooth(40, 330, py);
  const n = clamp(((a - 0.5) * 1.5 + (b - 0.5) * 0.9 + (d - 0.5) * 0.42) * 1.5 * amp, -0.8, 0.8);
  const pink = mix3(PINK, GOLD, smooth(380, 560, py + wx * 80) * (1 - lr * 0.65));
  const purp = mix3(PUR1, PUR2, smooth(260, 560, py));
  c = n > 0 ? mix3(c, pink, Math.min(0.85, n * 1.1)) : mix3(c, purp, Math.min(0.85, -n * 1.25));
  const g = Math.exp(-(((py - 545) / 52) ** 2)) * (1 - smooth(60, 560, px)) * (0.35 + 1.1 * smooth(0.42, 0.66, fbm(px * 0.005, (py - px * 0.07) * 0.06 + 70, 4)));
  c = mix3(c, GLOW, clamp(g * 0.55));
  return c.map((v) => clamp(v + (vnoise(px * 1.3, py * 1.3) - 0.5) * 0.008));
}
const EF = stops([[0, '#f59468'], [5, '#ee7484'], [12, '#cf6398'], [25, '#a85ba4'], [50, '#6f57a8'], [90, '#5a50a0']]);
const EB = stops([[0, '#5a4a80'], [15, '#7a5590'], [50, '#58509a'], [90, '#5a50a0']]);
// Direction -> sRGB, used as environment light.
export function skyDir(x, y, z) {
  const deg = (Math.asin(clamp(y, -1, 1)) * 180) / Math.PI;
  if (y < -0.02) return hex('#3a2038');
  const front = Math.cos(Math.atan2(x, -z)) * 0.5 + 0.5;
  return mix3(ramp(EB, deg), ramp(EF, deg), smooth(0.1, 0.9, front));
}
