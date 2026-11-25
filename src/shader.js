// Method 3 runner: one full-screen triangle, rendered in tiles so the GPU watchdog never fires.
import src from './scene.frag.glsl';
import { W, H, camX } from './util.js';
function start() {
  const sc = window.__scale || 1, c = document.querySelector('canvas'); c.width = W * sc; c.height = H * sc; const gl = c.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false });
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, '#version 300 es\nvoid main(){vec2 v=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(v*2.-1.,0,1);}')); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, src.replace('AA;', (window.__aa || 2) + ';'))); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  gl.useProgram(p); gl.viewport(0, 0, c.width, c.height); gl.uniform2f(gl.getUniformLocation(p, 'uRes'), c.width, c.height); gl.uniform1f(gl.getUniformLocation(p, 'uCam'), camX(window.__frame ?? 150));
  gl.enable(gl.SCISSOR_TEST); const t0 = performance.now(), px = new Uint8Array(4); for (let y = 0; y < c.height; y += 64) for (let x = 0; x < c.width; x += 180) { gl.scissor(x, y, 180, 64); gl.drawArrays(gl.TRIANGLES, 0, 3); gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); } console.log('shader ms', (performance.now() - t0).toFixed(0));
}
if (window.__method === 'shader') setTimeout(() => { try { start(); } catch (e) { window.__err = e.stack; } window.__done = true; }, 300);
