import { GEN_HEADER, GEN_MAIN, VERT, FX_FRAG, COMP_FRAG } from './glsl.js';
import { SHADER_GENS } from './gens-shader.js';

export const FX_MODES = { none: 0, bayer: 1, halftone: 2, ascii: 3, matrix: 4, stipple: 5, gradient: 6 };
const GEN_U = ['uRes', 'uTime', 'uPhase', 'uSeed', 'uP', 'uPal', 'uW0', 'uW1', 'uW2', 'uW3', 'uW4'];
const FX_U = ['uTex', 'uGlyph', 'uPrev', 'uTr', 'uRes', 'uPhase', 'uTime', 'uK', 'uA', 'uB', 'uC', 'uD', 'uPal'];
const COMP_U = ['uA', 'uB', 'uM', 'uRes', 'uPhase', 'uS', 'uC0', 'uC1', 'uC2', 'uC3', 'uPal'];
const ZW = new Float32Array(20);

function glyphAtlas() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 64;
  const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, 512, 64);
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = 'bold 28px ui-monospace, Menlo, Consolas, "DejaVu Sans Mono", monospace';
  const ramp = ' .:-=+*#%@', mat = 'ｱｲｳｴｵｶｷｸ01ﾊﾐﾋｰZ7';
  for (let i = 0; i < 16; i++) { if (i < ramp.length) x.fillText(ramp[i], i * 32 + 16, 17); x.fillText(mat[i], i * 32 + 16, 49); }
  return c;
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    const o = { preserveDrawingBuffer: true, antialias: false, alpha: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: 'high-performance' };
    const gl = canvas.getContext('webgl', o) || canvas.getContext('experimental-webgl', o);
    if (!gl) throw new Error('WebGL is not available on this device.');
    this.gl = gl;
    gl.getExtension('OES_standard_derivatives');
    this.par = gl.getExtension('KHR_parallel_shader_compile');
    this.maxSize = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), gl.getParameter(gl.MAX_RENDERBUFFER_SIZE), 8192);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    this.vs = this._sh(gl.VERTEX_SHADER, VERT);
    this.progs = new Map();
    this.fx = this._link(FX_FRAG, FX_U, true);
    this.comp = this._link(COMP_FRAG, COMP_U, true);
    this.glyphTex = this._tex();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, glyphAtlas());
    this.prevTex = this._tex(); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    this.slots = [];
    this.compSlot = null;
    this.w = this.h = 0;
  }
  _tex() {
    const gl = this.gl, t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  _sh(type, src) { const gl = this.gl, s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
  _link(fsrc, names, sync) {
    const gl = this.gl, fs = this._sh(gl.FRAGMENT_SHADER, fsrc), p = gl.createProgram();
    gl.attachShader(p, this.vs); gl.attachShader(p, fs); gl.bindAttribLocation(p, 0, 'aPos'); gl.linkProgram(p);
    const e = { prog: p, fs, names, u: null };
    if (sync) this._finish(e);
    return e;
  }
  _finish(e) {
    const gl = this.gl;
    if (!gl.getProgramParameter(e.prog, gl.LINK_STATUS)) throw new Error('Shader error: ' + (gl.getShaderInfoLog(e.fs) || gl.getProgramInfoLog(e.prog)));
    e.u = {}; for (const n of e.names) e.u[n] = gl.getUniformLocation(e.prog, n);
    return e;
  }
  /** Compile a shader generator; resolves when ready (non-blocking where KHR_parallel_shader_compile exists). */
  load(name) {
    if (this.progs.has(name)) return this.progs.get(name);
    const src = SHADER_GENS[name]; if (!src) return Promise.reject(new Error('Unknown generator ' + name));
    const e = this._link(GEN_HEADER + src + GEN_MAIN, GEN_U, false);
    const t0 = performance.now();
    const pr = new Promise((res, rej) => {
      const check = () => {
        if (this.par && performance.now() - t0 < 1200 && !this.gl.getProgramParameter(e.prog, this.par.COMPLETION_STATUS_KHR)) { setTimeout(check, 16); return; }
        try { res(this._finish(e)); } catch (err) { this.progs.delete(name); rej(err); }
      };
      check();
    });
    this.progs.set(name, pr);
    return pr;
  }
  _alloc(s) {
    const gl = this.gl;
    if (!s.tex) { s.tex = this._tex(); s.fbo = gl.createFramebuffer(); }
    if (s.w === this.w && s.h === this.h) return s;
    s.w = this.w; s.h = this.h;
    gl.bindTexture(gl.TEXTURE_2D, s.tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, s.w, s.h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, s.fbo); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, s.tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return s;
  }
  slot(i) { return this._alloc(this.slots[i] || (this.slots[i] = {})); }
  /** 2D canvas for layer slot i, sized to the render. */
  ctx2d(i) {
    const s = this.slots[i] || (this.slots[i] = {});
    if (!s.c2d) { s.c2d = document.createElement('canvas'); s.ctx = s.c2d.getContext('2d'); }
    if (s.c2d.width !== this.w || s.c2d.height !== this.h) { s.c2d.width = this.w; s.c2d.height = this.h; }
    return s.ctx;
  }
  setSize(w, h) {
    w = Math.max(2, Math.min(Math.round(w), this.maxSize)); h = Math.max(2, Math.min(Math.round(h), this.maxSize));
    if (w === this.w && h === this.h) return false;
    this.w = w; this.h = h; this.canvas.width = w; this.canvas.height = h;
    return true;
  }
  /** Copy what is on screen now, so the next style can transition away from it. */
  capturePrev() {
    const gl = this.gl; if (!this.w) return;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, this.prevTex); gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGB, 0, 0, this.w, this.h, 0);
  }
  _quad() { const gl = this.gl; gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.drawArrays(gl.TRIANGLES, 0, 3); }
  _layer(i, L, job) {
    const gl = this.gl, s = this.slot(i), ph = (job.phase + (L.phaseOff || 0)) % 1;
    if (L.prog) {
      const u = L.prog.u; gl.bindFramebuffer(gl.FRAMEBUFFER, s.fbo); gl.viewport(0, 0, this.w, this.h); gl.useProgram(L.prog.prog);
      gl.uniform2f(u.uRes, this.w, this.h); gl.uniform1f(u.uTime, job.time); gl.uniform1f(u.uPhase, ph);
      gl.uniform4fv(u.uSeed, L.seed); gl.uniform4fv(u.uP, L.p); gl.uniform3fv(u.uPal, L.pal || job.pal);
      const w = L.w || ZW; for (let k = 0; k < 5; k++) if (u['uW' + k]) gl.uniform4fv(u['uW' + k], w.subarray(k * 4, k * 4 + 4));
      this._quad();
    } else {
      L.painter.draw(ph);
      gl.bindTexture(gl.TEXTURE_2D, s.tex); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.slots[i].c2d);
    }
    return s.tex;
  }
  /** job: { layers:[{prog|painter, seed, p, w, pal?, phaseOff?}], comp?, fx, pal, phase, time, tr? } */
  draw(job) {
    const gl = this.gl, W = this.w, H = this.h;
    const texs = job.layers.map((L, i) => this._layer(i, L, job));
    let src = texs[0];
    const C = job.comp;
    if (C) {
      const cs = this.compSlot = this._alloc(this.compSlot || {}), u = this.comp.u;
      gl.bindFramebuffer(gl.FRAMEBUFFER, cs.fbo); gl.viewport(0, 0, W, H); gl.useProgram(this.comp.prog);
      [texs[0], texs[1] || texs[0], texs[2] || texs[0]].forEach((t, k) => { gl.activeTexture(gl.TEXTURE0 + k); gl.bindTexture(gl.TEXTURE_2D, t); });
      gl.uniform1i(u.uA, 0); gl.uniform1i(u.uB, 1); gl.uniform1i(u.uM, 2);
      gl.uniform2f(u.uRes, W, H); gl.uniform1f(u.uPhase, job.phase); gl.uniform4fv(u.uS, job.layers[0].seed);
      gl.uniform4f(u.uC0, C.blend, C.amount, C.mask, C.thr); gl.uniform4f(u.uC1, C.xa, C.xb, C.xamt, C.warp);
      gl.uniform4f(u.uC2, C.shape, C.soft, C.inv, C.hue); gl.uniform4f(u.uC3, C.sat, C.scale, C.rot, texs.length > 1 ? 1 : 0);
      gl.uniform3fv(u.uPal, job.pal);
      this._quad(); gl.activeTexture(gl.TEXTURE0);
      src = cs.tex;
    }
    const f = job.fx, u = this.fx.u, tr = job.tr || { t: 1, mode: 0 };
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H); gl.useProgram(this.fx.prog);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, src); gl.uniform1i(u.uTex, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.glyphTex); gl.uniform1i(u.uGlyph, 1);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, this.prevTex); gl.uniform1i(u.uPrev, 2);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform4f(u.uTr, tr.t, tr.mode, 0, 0);
    gl.uniform2f(u.uRes, W, H); gl.uniform1f(u.uPhase, job.phase); gl.uniform1f(u.uTime, job.time); gl.uniform1f(u.uK, Math.max(0.5, Math.min(W, H) / 900));
    gl.uniform4f(u.uA, f.grain || 0, f.vig || 0, f.scan || 0, f.ca || 0);
    gl.uniform4f(u.uB, f.glitch || 0, f.pixel || 0, f.poster || 0, f.curve || 0);
    gl.uniform4f(u.uC, f.leak || 0, f.paper || 0, FX_MODES[f.mode || 'none'] || 0, f.cell || 8);
    gl.uniform4f(u.uD, f.tone || 0, f.bloom || 0, f.contrast || 1, 0);
    gl.uniform3fv(u.uPal, job.pal);
    this._quad();
  }
}
