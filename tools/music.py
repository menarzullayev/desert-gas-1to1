"""Original lo-fi loop synthesised from scratch (no samples). 96 bpm, 11 s, 48 kHz stereo."""
import numpy as np, wave, sys
SR, T, BPM = 48000, 11.0, 96
N = int(SR * T); L = np.zeros(N); R = np.zeros(N); B = 60 / BPM; rng = np.random.default_rng(7)
def lp(x, fc):  # zero-phase FFT low-pass, 12 dB/oct style
    f = np.fft.rfftfreq(len(x), 1 / SR); return np.fft.irfft(np.fft.rfft(x) / (1 + (f / fc) ** 2), len(x))
def hp(x, fc): return x - lp(x, fc)
def put(s, t, g, pan=0.0):
    i = int(t * SR)
    if i >= N: return
    s = s[:N - i]; L[i:i + len(s)] += s * g * np.cos((pan + 1) * np.pi / 4); R[i:i + len(s)] += s * g * np.sin((pan + 1) * np.pi / 4)
def env(n, a, d): t = np.arange(n) / SR; return np.minimum(1, t / a) * np.exp(-t / d)
def ep(m, dur):  # FM electric piano
    n = int(dur * SR); t = np.arange(n) / SR; f = 440 * 2 ** ((m - 69) / 12) * (1 + 0.0016 * np.sin(2 * np.pi * 4.6 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR; mod = np.sin(ph * 2) * 1.1 * np.exp(-t / 0.5) + np.sin(ph * 14) * 0.12 * np.exp(-t / 0.06)
    e = env(n, 0.006, 1.1); e[-int(.08 * SR):] *= np.linspace(1, 0, int(.08 * SR)); return np.sin(ph + mod) * e
def kick(): n = int(.32 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * (46 * t + 70 * .03 * (1 - np.exp(-t / .03)))) * np.exp(-t / .13)
def snare(): n = int(.3 * SR); t = np.arange(n) / SR; return lp(hp(rng.standard_normal(n), 900), 5200) * np.exp(-t / .085) * .6 + np.sin(2 * np.pi * 185 * t) * np.exp(-t / .05) * .5
def hat(): n = int(.07 * SR); t = np.arange(n) / SR; return hp(rng.standard_normal(n), 6500) * np.exp(-t / .017)
# Dm9 | Bbmaj7 | Gm9 | A7sus-A7, one bar each (2.5 s)
ch = [(38, [53, 57, 60, 64]), (34, [53, 57, 58, 62]), (31, [53, 57, 58, 62, 65]), (33, [52, 55, 61, 64])]
mel = [(0.5, 74), (1.5, 72), (2.0, 69), (3.25, 72), (4.5, 70), (5.5, 69), (6.5, 65), (8.5, 69), (9.5, 70), (10.25, 74), (11.5, 72), (12.5, 73), (13.5, 76)]
for b in range(5):
    root, notes = ch[b % 4]; t0 = b * 4 * B
    for k, m in enumerate(notes):
        put(ep(m, 2.4), t0 + .012 * k, .105, -.35 + .2 * k)
        if b < 4: put(ep(m, 1.0), t0 + 2.5 * B + .01 * k, .06, -.35 + .2 * k)
    for q, g in ((0, 1), (1.5, .7), (2.5, .85)):
        n = int(.6 * SR); t = np.arange(n) / SR; f = 440 * 2 ** ((root - 69) / 12); put((np.sin(2 * np.pi * f * t) + .25 * np.sin(4 * np.pi * f * t)) * env(n, .01, .32), t0 + q * B, .22 * g)
    for q in range(4):
        sw = .04
        if q in (0, 2): put(kick(), t0 + q * B + (0 if q == 0 else .5 * B * 0), .5)
        if q in (1, 3): put(snare(), t0 + q * B + .008, .17)
        put(hat(), t0 + q * B, .075, .25); put(hat(), t0 + (q + .5) * B + sw, .05, .25)
for q, m in mel: put(ep(m, 1.3), q * B + .015, .075, .3)
def tape(x):
    x = lp(x, 7500); t = np.arange(N) / SR; d = (1.2 * np.sin(2 * np.pi * .55 * t) + .25 * np.sin(2 * np.pi * 5.1 * t)) * 1e-3 * SR
    return np.interp(np.arange(N) - d - 80, np.arange(N), x)
def rev(x, seed):  # short synthetic room
    g = np.random.default_rng(seed); n = int(1.3 * SR); ir = lp(g.standard_normal(n), 3800) * np.exp(-np.arange(n) / SR / .32); ir /= np.sqrt((ir ** 2).sum()); m = N + n; return np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(ir, m), m)[:N]
crackle = np.zeros(N); k = rng.integers(0, N, 160); crackle[k] = rng.standard_normal(160) * .05
out = np.stack([np.tanh(1.25 * (tape(x) + .13 * rev(x, s))) + lp(crackle, 6000) + rng.standard_normal(N) * .0007 for x, s in ((L, 1), (R, 2))], 1)
fade = np.ones(N); fade[:int(.02 * SR)] = np.linspace(0, 1, int(.02 * SR)); fade[-int(1.1 * SR):] = np.cos(np.linspace(0, np.pi / 2, int(1.1 * SR))) ** 2
out *= fade[:, None]; out *= .5 / np.abs(out).max(); print('peak', np.abs(out).max().round(3), 'rms dBFS', (20 * np.log10(np.sqrt((out ** 2).mean()))).round(1), 'nan', np.isnan(out).any())
with wave.open(sys.argv[1], 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype('<i2').tobytes())
