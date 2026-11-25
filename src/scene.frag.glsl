#version 300 es
// Method 3: the whole picture in one fragment shader. No geometry, no textures, no libraries.
precision highp float;
uniform vec2 uRes; uniform float uCam; // uCam: lateral camera position in metres
out vec4 o;
const float F = 1720., CX = 360., CY = 730., CH = 1.7, PIV = 43.;
float h1(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec2 h22(vec2 p) { return vec2(h1(p), h1(p + 17.17)); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * f * (f * (f * 6. - 15.) + 10.); return mix(mix(h1(i), h1(i + vec2(1, 0)), f.x), mix(h1(i + vec2(0, 1)), h1(i + 1.), f.x), f.y); }
const mat2 RM = mat2(1.62, 1.21, -1.21, 1.62);
float fbm(vec2 p, int n) { float s = 0., a = 1., t = 0.; for (int i = 0; i < n; i++) { s += a * vn(p); t += a; a *= .52; p = RM * p + vec2(17.3, 9.1); } return s / t; }
float rdg(vec2 p, int n) { float s = 0., a = 1., t = 0.; for (int i = 0; i < n; i++) { s += a * (1. - abs(2. * vn(p) - 1.)); t += a; a *= .5; p = RM * p + vec2(3.7, 5.1); } return s / t; }
vec3 L(vec3 c) { return pow(c, vec3(2.2)); }
vec3 hx(int v) { return vec3((v >> 16) & 255, (v >> 8) & 255, v & 255) / 255.; }
float ss(float a, float b, float x) { return smoothstep(a, b, x); }
// ---------- sky (display space) ----------
vec3 rampL(float y) { vec3 c = hx(0x7a55ac); c = mix(c, hx(0x855aa9), ss(-60., 0., y)); c = mix(c, hx(0x9f5aa2), ss(0., 80., y)); c = mix(c, hx(0xc45d99), ss(80., 160., y)); c = mix(c, hx(0xd16497), ss(160., 250., y)); c = mix(c, hx(0xe46f90), ss(250., 330., y)); c = mix(c, hx(0xe46b92), ss(330., 400., y)); c = mix(c, hx(0xf4727f), ss(400., 450., y)); c = mix(c, hx(0xf78a78), ss(450., 490., y)); return mix(c, hx(0xf68f74), ss(490., 540., y)); }
vec3 rampR(float y) { vec3 c = hx(0x6250a7); c = mix(c, hx(0x6a53a6), ss(-60., 0., y)); c = mix(c, hx(0x7d56a3), ss(0., 120., y)); c = mix(c, hx(0x9258a0), ss(120., 240., y)); c = mix(c, hx(0xb45b9a), ss(240., 330., y)); c = mix(c, hx(0xc85a90), ss(330., 400., y)); c = mix(c, hx(0xc85c92), ss(400., 450., y)); c = mix(c, hx(0xda5e86), ss(450., 500., y)); c = mix(c, hx(0xe8677f), ss(500., 540., y)); return mix(c, hx(0xf0747a), ss(540., 600., y)); }
vec3 sky(vec2 p) {
  float lr = ss(-60., 760., p.x + (p.y - 300.) * .15); vec3 c = mix(rampL(p.y), rampR(p.y), lr);
  float wx = fbm(vec2(p.x * .004 + 3., p.y * .006), 3) - .5, wy = fbm(vec2(p.x * .003 + 31., p.y * .007 + 7.), 4) - .5, s = p.y - p.x * .17 + wy * 90.;
  float a = fbm(vec2(p.x * .0021 + wx * .5, s * .0125), 4), b = fbm(vec2(p.x * .0062 + wx, s * .034 + 40.), 5), d = fbm(vec2(p.x * .013, s * .095 + 9.), 4);
  float n = clamp(((a - .5) * 1.5 + (b - .5) * .9 + (d - .5) * .42) * 1.5 * (.2 + .5 * ss(40., 330., p.y)), -.8, .8);
  vec3 pk = mix(hx(0xfb7288), hx(0xff9a6a), ss(380., 560., p.y + wx * 80.) * (1. - lr * .65)), pu = mix(hx(0x8a5aa8), hx(0xc8659a), ss(260., 560., p.y));
  c = n > 0. ? mix(c, pk, min(.85, n * 1.1)) : mix(c, pu, min(.85, -n * 1.25));
  float g = exp(-pow((p.y - 545.) / 52., 2.)) * (1. - ss(60., 560., p.x)) * (.35 + 1.1 * ss(.42, .66, fbm(vec2(p.x * .005, (p.y - p.x * .07) * .06 + 70.), 4)));
  return mix(c, hx(0xfdaa62), clamp(g * .55, 0., 1.));
}
// ---------- mountains ----------
float R1(float x) { const vec2 k[16] = vec2[16](vec2(-200, 590), vec2(-40, 588), vec2(0, 584), vec2(40, 589), vec2(100, 600), vec2(170, 592), vec2(210, 589), vec2(260, 598), vec2(340, 607), vec2(390, 590), vec2(470, 572), vec2(545, 571), vec2(575, 576), vec2(620, 560), vec2(665, 550), vec2(800, 556)); float y = 590.; for (int i = 0; i < 15; i++) if (x >= k[i].x) y = mix(k[i].y, k[i + 1].y, clamp((x - k[i].x) / (k[i + 1].x - k[i].x), 0., 1.)); return y + (fbm(vec2(x * .06, 2.), 4) - .5) * 7.; }
float R2(float x) { return 664. - 18. * exp(-pow((x - 10.) / 75., 2.)) - 20. * exp(-pow((x - 235.) / 65., 2.)) + 22. * ss(300., 420., x) - 14. * ss(520., 760., x) + (fbm(vec2(x * .05, 8.), 4) - .5) * 8.; }
vec3 mountain(vec2 p, vec3 bg) {
  for (int k = 0; k < 2; k++) {
    float top = k == 0 ? R1(p.x) : R2(p.x), m = ss(top - .7, top + .7, p.y); if (m <= 0.) continue;
    float v = (p.y - top) / (736. - top), sd = k == 0 ? 5. : 23.; vec2 q = vec2((p.x - p.y * .35) * .0125 + sd, p.y * .0165 + sd); q += (vec2(fbm(q * 1.7, 3), fbm(q * 1.7 + 9., 3)) - .5) * .5;
    float e = .05, g = rdg(q, 6), gx = (rdg(q + vec2(e, 0), 6) - g) / e, gy = (rdg(q + vec2(0, e), 6) - g) / e, lam = clamp(clamp(.46 - gx * .16 - gy * .1, .05, .95) + (g - .6) * .8, 0., 1.);
    vec3 c = lam > .5 ? mix(hx(0x6a3b7c), hx(0x924c7a), (lam - .5) * 1.7) : mix(hx(0x6a3b7c), hx(0x432870), (.5 - lam) * 1.7);
    c = mix(c, hx(0x5f3a80), ss(.35, 0., v) * .4); c = mix(c, hx(0x713f74), ss(.45, .92, v) * .85); c = mix(c, hx(0x8a4a74), ss(.7, 1., v) * ss(.45, .7, fbm(vec2(p.x * .012, p.y * .35), 4)) * .6); bg = mix(bg, c, m);
  }
  return bg;
}
// ---------- ground ----------
float stones(vec2 p, float s, float dens, out float id) { vec2 i = floor(p / s); float best = 0.; id = 0.; for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 c = i + vec2(x, y); float r = h1(c + 3.3); if (r > dens) continue; vec2 d = p / s - c - .5 - (h22(c) - .5) * .7; float a = h1(c + 8.) * 6.28, rad = mix(.16, .46, pow(h1(c + 5.), 2.)); d = mat2(cos(a), sin(a), -sin(a), cos(a)) * d; d.x *= 1. + h1(c + 9.) * .6; d += (vn(d * 5. + c * 3.) - .5) * .12; float h = rad * rad - dot(d, d); if (h > 0.) { h = sqrt(h) * s * .75; if (h > best) { best = h; id = h1(c + 1.7) + .01; } } } return best; }
float gH(vec2 p, out float id) { float d = p.y, near = ss(34., 20., d); float h = (fbm(p * .5, 3) - .5) * .05 * near + (fbm(p * 3.1, 4) - .5) * .065 * ss(27., 17., d) - .01; id = 0.; if (d < 24.) { float i1, i2, dn = ss(.3, .62, fbm(p * .9 + 4., 3)); float a = stones(p, .075, .5 + .45 * dn, i1), b = stones(p + 5., .19, .16 + .5 * ss(-.2, -2.2, p.x + .12 * p.y - .6) * ss(12., 8., d), i2), c = 0.; h += (fbm(p * 23., 3) - .5) * .022; if (b > a) { a = b; id = i2; } else id = i1; h += a * ss(24., 19., d); } return h; }
float gH(vec2 p) { float i; return gH(p, i); }
vec3 gCol(vec2 p, float id) {
  float d = p.y, n = fbm(p * 1.7, 4), m = fbm(p * 9., 3), s = fbm(vec2(p.x * .22 + d * .02, d * 1.5), 4); vec3 T = vec3(1.12, .98, 1.22), DK = L(hx(0x5c4640)), DI = L(hx(0x94746a)), LO = L(hx(0xa98a80)), c = mix(DK, DI, clamp(.15 + n * .75 + (m - .5) * .9, 0., 1.));
  float lot = ss(21., 26., d) * ss(58., 48., d); c = mix(c, mix(DI, LO, clamp((s - .3) * 2., 0., 1.)), lot * .95); c = mix(c, DK, pow(1. - abs(2. * vn(vec2(p.x * .13 + 3., (d + p.x * .18) * 1.35)) - 1.), 5.) * lot * .55); c = mix(c, L(hx(0xb9a69a)), ss(39.8, 41.2, d) * ss(52., 49., d) * ss(-5.5, -3.2, p.x) * .8);
  if (id > 0.) c = mix(L(hx(0x5a474a)), L(hx(0xb09088)), fract(id * 7.3)) * (.55 + .95 * pow(fract(id * 31.), 2.5)); c *= T;
  if (d > 46.) { float k = fbm(vec2(p.x * 1.1, d * .55), 4), q = ss(.4, .62, k) * ss(47., 52., d); vec3 sg = mix(L(hx(0x3a2028)), L(hx(0xc08a80)), pow(vn(vec2(p.x * 4., d * 1.2)), 2.)); c = mix(c, sg, q * .85); c = mix(c, L(hx(0xc87fa0)), ss(58., 500., d)); }
  return c;
}
// ---------- station / van SDF ----------
float bx(vec3 p, vec3 b) { vec3 q = abs(p) - b; return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.); }
float cy(vec3 p, float r, float h) { vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h); return min(max(d.x, d.y), 0.) + length(max(d, 0.)); }
const vec2 CC = vec2(2.65, 41.), e1 = vec2(-.6432, .7657), e2 = vec2(.7583, .6519), BA = vec2(9.41, 47.9), b1 = vec2(-.7103, .7039), b2 = vec2(.6969, .7172);
vec3 vanL(vec3 p) { vec2 q = p.xz - vec2(-2.81, 40.6); float det = 2.63 * .32 - 2.62 * -1.78; return vec3((q.x * .32 - q.y * -1.78) / det, p.y, (q.y * 2.63 - q.x * 2.62) / det); }
float van(vec3 p) { vec3 v = vanL(p); float y = v.y, ins = .012 + .07 * ss(1.1, 1.95, y) + .05 * ss(1.82, 1.98, y), fr = mix(0., .16, ss(1.2, 1.88, y)) + .05 * ss(1.82, 1.97, y), rr = 1. - .06 * ss(1.1, 1.85, y) - .08 * ss(1.82, 1.97, y); float a = max(fr - v.x, v.x - rr) * 3.4, b = max(ins - v.z, v.z - 1. + ins) * 1.5, c = max(.37 - y, y - 1.98); vec3 q = vec3(a, b, c) + .06; float d = length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.) - .06; return d * .72; }
float wheels(vec3 p) { vec3 v = vanL(p); float d = 1e3; for (int i = 0; i < 2; i++) { float l = i == 0 ? .112 : .765; vec2 q = vec2((v.x - l) * 3.7, v.y - .31); for (int j = 0; j < 2; j++) { float z = (j == 0 ? v.z - .05 : v.z - .93) * 1.5; d = min(d, max(length(q) - .31, abs(z) - .1)); } } return d * .7; }
// material ids: 1 fascia 2 neon 3 lamp 4 column 5 island 6 pump 7 red 8 shop wall 9 roof 10 neon shop 11 van 12 tyre 13 bollard 14 pole 15 bumper 16 sign 17 globe
vec2 U(vec2 a, float d, float m) { return d < a.x ? vec2(d, m) : a; }
vec2 map(vec3 p) {
  vec2 r = vec2(1e3, 0.); vec2 c = p.xz - CC, q = vec2(dot(c, e1), dot(c, e2)); vec3 k = vec3(q.x, p.y, q.y);
  r = U(r, bx(k - vec3(2.61, 3.03, 2.3), vec3(2.61, .23, 2.3)), 1.);
  for (int i = 0; i < 3; i++) { float y = i == 0 ? 3.16 : i == 1 ? 2.97 : 2.85; r = U(r, min(bx(k - vec3(2.6, y, -.02), vec3(2.65, .012, .01)), bx(k - vec3(-.02, y, 2.3), vec3(.01, .012, 2.33))) - .02, 2.); }
  vec3 lp = k; r = U(r, min(min(bx(lp - vec3(3.6, 2.75, .5), vec3(.65, .03, .03)), bx(lp - vec3(1.5, 2.75, .55), vec3(.5, .03, .03))), min(bx(lp - vec3(.5, 2.75, 1.6), vec3(.03, .03, .4)), bx(lp - vec3(.5, 2.75, 3.3), vec3(.03, .03, .6)))), 3.);
  float co = bx(k - vec3(3.92, 1.4, .76), vec3(.085, 1.4, .085)); co = min(co, bx(k - vec3(.71, 1.4, .69), vec3(.085, 1.4, .085))); co = min(co, bx(k - vec3(.78, 1.4, 3.68), vec3(.085, 1.4, .085))); r = U(r, co, 4.);
  r = U(r, bx(k - vec3(2.5, .07, .95), vec3(2.5, .07, .55)), 5.);
  for (int i = 0; i < 3; i++) { vec3 pp = i == 0 ? vec3(1.07, 0., 44.9) : i == 1 ? vec3(2.386, 0., 43.2) : vec3(4.016, 0., 45.); vec3 s = p - pp; float a = .55; s.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * s.xz; r = U(r, bx(s - vec3(0, .92, 0), vec3(.26, .8, .17)), 6.); if (i == 1) r = U(r, length(s - vec3(0, 1.86, 0)) - .13, 17.); }
  r = U(r, min(cy(p - vec3(3.01, .41, 42.6), .06, .31), cy(p - vec3(4.88, .38, 46.), .18, .3)), 7.);
  vec2 bq = p.xz - BA; vec3 w = vec3(dot(bq, b1), p.y, dot(bq, b2)); r = U(r, bx(w - vec3(2.55, 1.45, 2.7), vec3(2.55, 1.45, 2.7)), 8.); r = U(r, bx(w - vec3(2.55, 2.82, 2.68), vec3(2.62, .11, 2.76)), 9.);
  r = U(r, min(bx(w - vec3(1.75, 2.41, -.12), vec3(1.75, .014, .01)), bx(w - vec3(-.12, 2.41, 2.), vec3(.01, .014, 2.1))) - .02, 10.);
  r = U(r, van(p), 11.); r = U(r, wheels(p), 12.); vec3 v = vanL(p); r = U(r, bx(vec3((v.x + .02) * 3.4, v.y - .47, (v.z - .5) * 1.7), vec3(.1, .07, .87)) * .75, 15.);
  r = U(r, min(cy(p - vec3(7.56, .36, 47.8), .07, .36), min(cy(p - vec3(8.68, .36, 46.6), .075, .36), cy(p - vec3(9.38, .3, 46.2), .08, .3))), 13.);
  r = U(r, min(min(cy(p - vec3(7.9, 3.6, 53.), .035, .75), cy(p - vec3(8.18, 3.7, 53.), .06, .95)), min(cy(p - vec3(9.71, 3.4, 50.1), .06, .5), cy(p - vec3(7.2, .26, 48.6), .13, .27))), 14.);
  r = U(r, min(bx(p - vec3(9.59, 4.59, 50.08), vec3(.86, .37, .06)), bx(p - vec3(9.61, 3.94, 50.08), vec3(.75, .21, .06))), 16.); return r;
}
vec3 nrm(vec3 p) { vec2 e = vec2(.004, 0); return normalize(vec3(map(p + e.xyy).x - map(p - e.xyy).x, map(p + e.yxy).x - map(p - e.yxy).x, map(p + e.yyx).x - map(p - e.yyx).x)); }
float shadow(vec3 p, vec3 l) { float t = .05, s = 1.; for (int i = 0; i < 26; i++) { float h = map(p + l * t).x; s = min(s, 7. * h / t); t += clamp(h, .05, .6); if (s < .02 || t > 9.) break; } return clamp(s, 0., 1.); }
const vec3 SUN = vec3(-.893, .309, -.378 * .87);
vec3 envL(vec3 n) { float u = n.y * .5 + .5, f = n.z * .5 + .5; return mix(L(hx(0x3a2038)), mix(L(hx(0x66508f)), L(hx(0xd06a92)), f * .75), u); }
vec3 lights(vec3 p, vec3 n) { // station practicals, analytic
  vec3 s = vec3(0); vec2 q = vec2(1);
  for (int i = 0; i < 4; i++) { vec2 tu = i == 0 ? vec2(.45, .16) : i == 1 ? vec2(.14, .47) : i == 2 ? vec2(.5, .55) : vec2(.16, 1.); vec3 l = vec3(CC.x - 3.36 * tu.x + 3.49 * tu.y, 2.5, CC.y + 4. * tu.x + 3. * tu.y) - p; float d = dot(l, l); s += L(hx(0xffb070)) * 17. * max(0., dot(n, normalize(l))) / max(d, .25) * ss(2.9, 2.4, p.y); }
  vec3 l = vec3(8., 1.2, 46.6) - p; s += L(hx(0xffc080)) * 6. * max(0., dot(n, normalize(l))) / max(dot(l, l), .4); l = vec3(5., 1.6, 48.6) - p; s += L(hx(0xff6a86)) * 11. * max(0., dot(n, normalize(l))) / max(dot(l, l), .5); l = vec3(8.2, 2.2, 47.4) - p; s += L(hx(0x5fb8ff)) * 5. * max(0., dot(n, normalize(l))) / max(dot(l, l), .5); return s / 3.1416;
}
float bar(float a, float b, float x) { return step(a, x) * step(x, b); }
vec3 shopIn(vec2 u, float sd) { vec3 c = mix(hx(0xf3b64e), hx(0xffd25a), u.y); c = mix(c, hx(0xfff3c0), bar(.12, .42, u.x) * bar(.9, .94, u.y)); if (u.x > .13 && u.x < .55 && u.y > .25 && u.y < .74) { vec2 q = vec2((u.x - .13) / .42 * 14., (u.y - .25) / .49 * 4.); float r = h1(floor(q) + sd); c = fract(q.y) < .35 + r * .4 && fract(q.x) > .12 ? mix(hx(0x8a2f2c), mix(hx(0x5a4a68), hx(0xb8863a), fract(r * 9.)), fract(r * 5.)) : hx(0xc89a52); } if (u.x > .64 && u.y < .28) c = mix(hx(0x7a2f2c), hx(0xd8a050), h1(floor(u * vec2(34., 9.)) + sd)); return c; }
float seg(vec2 p, vec2 a, vec2 b) { vec2 d = b - a; return length(p - a - d * clamp(dot(p - a, d) / dot(d, d), 0., 1.)); }
float txt(vec2 p) { // "Desert" as seven-ish stroke letters, unit height, slanted
  p.x -= p.y * .22; float d = 1e3; d = min(d, seg(p, vec2(.0, 0), vec2(0, 1))); d = min(d, abs(length((p - vec2(.02, .5)) * vec2(1.05, 1.)) - .5) + step(p.x, .0)); float x = .78;
  for (int i = 0; i < 2; i++) { vec2 q = p - vec2(i == 0 ? .95 : 1.85, .3); d = min(d, min(abs(length(q) - .26) + step(.0, q.x) * step(q.y, -.02) * ss(0., .2, q.x) * .3, seg(q, vec2(-.24, 0), vec2(.24, .02)))); }
  vec2 q = p - vec2(1.4, .3); d = min(d, min(seg(q, vec2(.15, .25), vec2(-.14, .12)), min(seg(q, vec2(-.14, .12), vec2(.14, -.1)), seg(q, vec2(.14, -.1), vec2(-.16, -.26))))); q = p - vec2(2.28, .3); d = min(d, min(seg(q, vec2(-.1, .28), vec2(-.1, -.28)), seg(q, vec2(-.1, .1), vec2(.16, .27)))); q = p - vec2(2.72, .3); d = min(d, min(seg(q, vec2(0, .65), vec2(0, -.26)), seg(q, vec2(-.2, .28), vec2(.22, .28)))); return d; }
float txt2(vec2 p) { float d = 1e3; for (int i = 0; i < 7; i++) { vec2 q = p - vec2(float(i) * .78, .5); if (i == 0) d = min(d, min(min(seg(q, vec2(.24, .4), vec2(-.1, .46)), seg(q, vec2(-.1, .46), vec2(-.27, .2))), min(min(seg(q, vec2(-.27, .2), vec2(-.27, -.22)), seg(q, vec2(-.27, -.22), vec2(-.08, -.46))), min(min(seg(q, vec2(-.08, -.46), vec2(.25, -.4)), seg(q, vec2(.25, -.4), vec2(.25, -.02))), seg(q, vec2(.25, -.02), vec2(.05, -.02)))))); else if (i == 1) d = min(d, min(min(seg(q, vec2(-.28, -.5), vec2(0, .5)), seg(q, vec2(.28, -.5), vec2(0, .5))), seg(q, vec2(-.15, -.1), vec2(.15, -.1)))); else if (i == 2) d = min(d, min(min(seg(q, vec2(.22, .45), vec2(-.22, .3)), seg(q, vec2(-.22, .3), vec2(.22, -.25))), seg(q, vec2(.22, -.25), vec2(-.22, -.45)))); else if (i == 3) d = min(d, min(min(abs(length(q - vec2(-.02, .26)) - .17), abs(length((q + vec2(.04, .22)) * vec2(.95, 1.)) - .24)), seg(q, vec2(-.1, .12), vec2(.28, -.46)))); else if (i == 4) d = min(d, abs(length(q * vec2(1.4, 1.)) - .45)); else if (i == 5) d = min(d, seg(q, vec2(0, -.48), vec2(0, .48))); else d = min(d, min(seg(q, vec2(-.2, -.48), vec2(-.2, .48)), seg(q, vec2(-.2, -.48), vec2(.22, -.48)))); } return d; }
vec3 shade(vec3 p, vec3 rd, float m) {
  vec3 n = nrm(p), a = vec3(.3), em = vec3(0); float sp = .1;
  if (m == 1.) { a = L(hx(0x12a0c8)); em = L(hx(0x08a0d0)) * .75; if (n.y < -.5) { a = L(hx(0xd8c0b0)); em = L(hx(0xffb070)) * .25; } if (n.y > .5) em *= .0; }
  else if (m == 2.) return vec3(.7, 1.15, 1.25); else if (m == 3.) return vec3(2.2, 1.6, .9); else if (m == 10.) return vec3(.75, 1.2, 1.5); else if (m == 17.) return L(hx(0xffb45c));
  else if (m == 4.) a = L(hx(0xd9b8a4)); else if (m == 5.) a = L(hx(0xa08c84)); else if (m == 7.) a = L(hx(0xc01c24)); else if (m == 9.) a = L(hx(0x2a6fc0)); else if (m == 13.) a = L(hx(0xd89a28)); else if (m == 14.) a = L(hx(0x3a2030)); else if (m == 15.) { a = L(hx(0x1a1820)); sp = .4; }
  else if (m == 6.) { a = L(hx(0xe8d8c0)); float y = p.y - .12; if (n.x > .6) a = L(hx(0x33406e)); else { a = mix(a, L(hx(0x2c2430)), bar(1.23, 1.48, y)); a = mix(a, L(hx(0x31395c)), bar(.7, 1.0, y)); } if (y > 1.56) a = L(hx(0xe6d0b0)); }
  else if (m == 8.) { vec2 q = p.xz - BA; float x = dot(q, b1), z = dot(q, b2), y = p.y; bool front = z < .02; a = L(hx(0x4a9ad8)); float X = front ? x : z;
    if (y > 2.32) { a = L(hx(0xf0708e)) * (fract(X * 3.2) < .07 ? .55 : 1.); } else if (front && x > 3.72) a = L(hx(0xf0708e)) * (fract(X * 3.2) < .07 ? .55 : 1.);
    if (front) { if (bar(.33, 2.3, x) * bar(.83, 2.27, y) > 0.) { vec2 u = vec2(1. - (x - .33) / 1.97, (y - .83) / 1.44); em = L(shopIn(u, 3.)); a = vec3(0); if (abs(u.x - .5) < .012 || abs(u.y - .74) < .012) { em = vec3(0); a = L(hx(0x274a78)); } } else if (bar(2.75, 3.4, x) * bar(0., 2.28, y) > 0.) { a = L(hx(0x3a6a94)); if (bar(2.83, 3.32, x) * bar(.93, 1.75, y) > 0.) em = L(mix(hx(0xc98b3c), hx(0xffd870), (y - .93) / .82)); if (bar(2.79, 3.36, x) * bar(1.9, 2.22, y) > 0.) em = L(hx(0xf2b54c)); } }
    else if (z > .25 && y > .83 && y < 2.27) { em = L(shopIn(vec2(z * .5, (y - .83) / 1.44), 5.)); a = vec3(0); } }
  else if (m == 11.) { vec3 v = vanL(p); float l = v.x, y = v.y; sp = .5; a = L(hx(0x3cc4e8)); if (n.y > .75) a = L(hx(0x3f9fc8));
    else if (l < .22 && abs(dot(n.xz, normalize(vec2(-.32, -1.78)))) > abs(dot(n.xz, normalize(vec2(2.62, -2.63)))) && l < .03 + .16 * ss(1.15, 1.9, y) && v.z > .02 + .07 * ss(1.1, 1.95, y)) { a = mix(a, L(hx(0xc79a3c)), bar(.93, 1.2, y)); if (bar(1.25, 1.83, y) * bar(.1, .9, v.z) > 0.) { a = L(hx(0x1a1428)); em = envL(reflect(rd, n)) * .18; } if (bar(.84, 1.06, y) * bar(.04, .96, v.z) > 0.) a = vec3(.004); if (bar(.57, .74, y) * bar(.18, .84, v.z) > 0.) a = vec3(.004); for (int i = 0; i < 2; i++) if (length(vec2((v.z - (i == 0 ? .125 : .885)) * 1.7, y - .95)) < .11) em = L(hx(0xffe2a8)) * 1.35; if (bar(.64, .72, y) * bar(.03, .13, v.z) > 0.) a = L(hx(0xe07a2a)); }
    else { float w = .86 - .3 * ss(.36, .5, l) * ss(.78, .6, l) + .03 * sin(l * 40.); a = mix(a, L(hx(0xc29a3e)), bar(w, 1.24, y)); if (l > .36 && (abs(y - 1.15) < .012 || abs(y - 1.07) < .012)) a = L(hx(0x8a6a24)); if (bar(1.27, 1.78, y) * bar(.075 + (y - 1.27) * .2, .333, l) > 0.) { a = vec3(.005); } if (bar(1.32, 1.75, y) * bar(.89, .94, l) > 0.) a = vec3(.005); if (bar(1.3, 1.74, y) * bar(.5, .83, l) > 0.) { a = L(hx(0xd2a63a)); float k = vn(vec2(l * 90., y * 22.)); if (k > .42 && l > .52 && l < .81) a = L(hx(0xc62a24)); } for (int i = 0; i < 2; i++) { vec2 f = vec2((l - (i == 0 ? .075 : .66)) * 3.7, y - .88); if (length(f) < .12 + .025 * cos(atan(f.y, f.x) * 6.)) a = L(hx(0xd02c28)); } if (abs(l - .345) < .002 || abs(l - .7) < .002 || abs(y - .55) < .006) a *= .4; for (int i = 0; i < 2; i++) if (length(vec2((l - (i == 0 ? .112 : .765)) * 3.7, y - .33)) < .4) a = vec3(.003); } }
  else if (m == 12.) { vec3 v = vanL(p); float r = min(length(vec2((v.x - .112) * 3.7, v.y - .31)), length(vec2((v.x - .765) * 3.7, v.y - .31))); a = vec3(.004); if (abs(n.y) < .5 && v.z < .2) { if (r < .2 && r > .17 || r < .12) a = L(hx(0xd8c4bc)); else if (r < .17) a = L(hx(0x6a4a48)); } }
  else if (m == 16.) { vec2 u = p.y > 4.2 ? vec2(p.x - 8.73, p.y - 4.22) : vec2(p.x - 8.86, p.y - 3.73); bool top = p.y > 4.2; vec2 sz = top ? vec2(1.72, .74) : vec2(1.5, .42); vec2 b = min(u, sz - u); em = L(hx(0xb3131c)) * 1.2; if (min(b.x, b.y) < .03) em = L(hx(0xffb0c0)); else { float d = top ? txt((u - vec2(.28, .17)) / .42) * .42 : txt2((u - vec2(.22, .09)) / .24) * .24; em = mix(em, L(hx(0xffd24a)) * 1.3, ss(.034, .018, d)); em += L(hx(0xff8a2a)) * .3 * exp(-d * 22.); } return em; }
  vec3 S = normalize(SUN); float sh = shadow(p + n * .03, S); vec3 c = a * (envL(n) * .6 + L(hx(0xff80a6)) * 2.5 / 3.1416 * max(0., dot(n, S)) * sh + lights(p, n)) + em; float fr = pow(1. - max(0., dot(n, -rd)), 4.); c += envL(reflect(rd, n)) * fr * sp * .6; return c;
}
// ---------- plants: analytic blades on billboard planes ----------
vec4 clump(vec2 p, float w, float h, int n, float sd, vec3 c0, vec3 c1, float wd, float shrubby) { if (p.y < -.02 || p.y > h * 1.2 || abs(p.x) > w * .9) return vec4(0); vec4 r = vec4(0); for (int i = 0; i < n; i++) { float fi = float(i) + sd * 31., a = h1(vec2(fi, 1.)), b = h1(vec2(fi, 2.)), c = h1(vec2(fi, 3.)), k = h1(vec2(fi, 4.)); float H = h * (.5 + .55 * a), t = p.y / H; if (t > 1. || t < 0.) continue; float x = (b - .5) * w * .3 + (c - .5) * w * 1.05 * pow(t, 1.35) + shrubby * (vn(vec2(p.y * 14. / h * .4, fi * 3.)) - .5) * w * .22 * t; float d = abs(p.x - x), q = wd * (1. - .72 * t), al = ss(q, q * .35, d); if (shrubby > 0. && t > .3) { float x2 = x + (t - .3) * w * .35 * (k > .5 ? 1. : -1.) + (vn(vec2(p.y * 40., fi)) - .5) * w * .05; al = max(al, ss(q, q * .35, abs(p.x - x2)) * .9); } vec3 col = mix(c0, c1, t) * (.5 + .9 * k) * (1.08 - .5 * ss(-.2, .5, (p.x - 0.) / w)); r.rgb = mix(r.rgb, col * vec3(.62, .46, .58), al); r.a = max(r.a, al); } return r; }
vec3 plant(vec3 c, vec2 px, float gx, float gy, float w, float h, int n, float sd, vec3 c0, vec3 c1, float wd, float sh, float cam) { float d = F * CH / (gy - CY), X = (gx - CX) * d / F; vec2 p = vec2((px.x - CX) * d / F + cam - X, CH - (px.y - CY) * d / F); vec4 k = clump(p, w, h, n, sd, c0, c1, wd, sh); return mix(c, k.rgb, k.a); }
vec3 render(vec2 s) { // s: reference pixel
  float cx = CX + F * uCam / PIV; vec3 ro = vec3(uCam, CH, 0), rd = vec3((s.x - cx) / F, -(s.y - CY) / F, 1.); vec2 vp = vec2(CX + F * rd.x, s.y); vec3 c;
  vec3 bg = L(mountain(vp, s.y < 640. ? sky(vp) : vec3(0))); if (s.y > 716. && s.y < 727.) { vec2 g = vec2(floor(vp.x / 2.2), floor(s.y / 1.8)); float r = h1(g); float z = max(bar(0., 74., vp.x) * bar(718., 722., s.y), max(bar(138., 200., vp.x) * bar(719., 724., s.y), bar(390., 452., vp.x) * bar(722., 727., s.y))); bg += z * step(.8, r) * L(hx(0xffd0c0)) * r; }
  c = bg; float tH = 1e5, id = 0.; vec3 gp; bool hitG = false;
  if (s.y > 731.) { float t0 = (CH - .12) / -rd.y, t1 = (CH + .06) / -rd.y, t = t0, pt = t0; for (int i = 0; i < 40; i++) { vec3 p = ro + rd * t; if (p.y < gH(p.xz)) { float a = pt, b = t; for (int j = 0; j < 6; j++) { float m = .5 * (a + b); vec3 q = ro + rd * m; if (q.y < gH(q.xz)) b = m; else a = m; } t = b; hitG = true; break; } pt = t; t += (t1 - t0) / 40.; } gp = ro + rd * t; tH = t; hitG = true; }
  float m = 0., t = 38.5; if (s.y > 570. && s.y < 830.) { for (int i = 0; i < 150; i++) { vec3 p = ro + rd * t; vec2 h = map(p); if (h.x < .004) { m = h.y; break; } t += h.x * .8; if (t > 60. || t > tH + .3) break; } }
  if (m > 0. && t < tH + .02) c = shade(ro + rd * t, normalize(rd), m);
  else if (hitG) { float e = max(.002, tH * .0009), i0; float h = gH(gp.xz, id); vec3 n = normalize(vec3(gH(gp.xz - vec2(e, 0)) - gH(gp.xz + vec2(e, 0)), 2. * e, gH(gp.xz - vec2(0, e)) - gH(gp.xz + vec2(0, e)))); n = normalize(mix(n, vec3(0, 1, 0), ss(26., 40., tH))); vec3 S = normalize(SUN), a = gCol(gp.xz, id); float sh = 1.; if (tH < 22.) { for (int k = 1; k < 8; k++) { float q = float(k) * .022; vec3 p = gp + S * q; sh = min(sh, clamp(1. - (gH(p.xz) - p.y) * 50., .0, 1.)); } } if (tH > 36. && tH < 56.) sh *= shadow(gp + vec3(0, .03, 0), S); float ao = tH > 36. && tH < 56. ? clamp(.35 + map(gp + vec3(0, .25, 0)).x * 2.6, 0., 1.) : clamp(.75 + (h + .01) * 9., .45, 1.15); c = a * ((envL(n) * .6) * ao + L(hx(0xff80a6)) * 2.5 / 3.1416 * max(0., dot(n, S)) * sh + (tH > 34. ? lights(gp, n) * ao : vec3(0))); }
  // star
  vec2 sp = vec2(CX + (s.x - cx) + F * (uCam / 50.), s.y) - vec2(690., 604.5); { float a = atan(sp.x, -sp.y), k = 6.28318 / 5.; a = abs(mod(a + k * .5, k) - k * .5); vec2 q = length(sp * vec2(1.07, .95)) * vec2(sin(a), cos(a)); float d = seg(q, vec2(0, 14), vec2(3.5, 4.9)), ins = step(q.x * 9.1 + q.y * 3.5, 49.) ; if (length(sp) < 17.) { if (ins > 0.) c = L(hx(0xf03848)) * .9; c = mix(c, vec3(1.3, 1.1, 1.2), ss(1.5, .8, d)); } }
  // bush band around the lot, then foreground plants
  for (int i = 0; i < 7; i++) { vec3 k = i == 0 ? vec3(158, 797, .55) : i == 1 ? vec3(112, 798, .6) : i == 2 ? vec3(70, 797, .6) : i == 3 ? vec3(28, 798, .62) : i == 4 ? vec3(-15, 799, .6) : i == 5 ? vec3(135, 792, .5) : vec3(365, 789, .4); c = plant(c, s - vec2(cx - CX, 0), k.x, k.y, 1.2, k.z, 46, float(i) + 60., L(hx(0x5a3034)), i == 0 ? L(hx(0xb05a48)) : L(hx(0x8a5860)), .035, .8, uCam); }
  vec2 q = s - vec2(cx - CX, 0);
  c = plant(c, q, 78., 888., 1.9, 1.0, 120, 1., L(hx(0x2a1218)), L(hx(0x9a4c48)), .012, 1., uCam); c = plant(c, q, 60., 889., 1.6, .42, 80, 2., L(hx(0x3a181e)), L(hx(0xa05048)), .009, .3, uCam); c = plant(c, q, 150., 886., .6, .25, 40, 3., L(hx(0x4a2020)), L(hx(0xa8584c)), .009, .3, uCam);
  c = plant(c, q, 431., 1062., .56, .36, 110, 4., L(hx(0x3a1a1c)), L(hx(0xb06048)), .0042, .8, uCam);
  c = plant(c, q, 300., 1300., .5, .42, 60, 8., L(hx(0x4a2028)), L(hx(0xa05a58)), .0042, .25, uCam); c = plant(c, q, 150., 1300., .5, .36, 50, 7., L(hx(0x4a2028)), L(hx(0xa05a58)), .0042, .25, uCam);
  c = plant(c, q, 212., 1290., .62, .62, 90, 5., L(hx(0x5a2a30)), L(hx(0xc07468)), .0045, .25, uCam); c = plant(c, q, 425., 1303., .78, .54, 100, 6., L(hx(0x5a2a30)), L(hx(0xc07468)), .0045, .25, uCam); c = plant(c, q, 490., 1308., .4, .3, 40, 9., L(hx(0x5a2a30)), L(hx(0xb06a60)), .0045, .25, uCam);
  return c;
}
void main() {
  vec2 f = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) * 720. / uRes.x; vec3 c = vec3(0); const int N = AA; float st = 720. / uRes.x / float(N);
  for (int i = 0; i < N; i++) for (int j = 0; j < N; j++) c += clamp(render(f + (vec2(i, j) + .5 - float(N) * .5) * st), 0., 1.6); c /= float(N * N);
  // analytic neon haze
  float hz = exp(-max(0., abs(f.y - 677.) - 9.) / 9.) * ss(318., 345., f.x) * ss(614., 590., f.x); c += vec3(.0, .05, .09) * hz;
  o = vec4(pow(clamp(c, 0., 1.), vec3(1. / 2.2)), 1.);
}
