import { GEN_HEADER, GEN_MAIN, VERT, FX_FRAG } from './glsl.js';
import { SHADER_GENS } from './gens-shader.js';

export const FX_MODES = { none: 0, bayer: 1, halftone: 2, ascii: 3, matrix: 4, stipple: 5, gradient: 6 };
const GEN_U = ['uRes', 'uTime', 'uPhase', 'uSeed', 'uP', 'uPal', 'uW0', 'uW1', 'uW2', 'uW3', 'uW4'];
const ZW = new Float32Array(20);
const FX_U = ['uTex', 'uGlyph', 'uRes', 'uPhase', 'uTime', 'uK', 'uA', 'uB', 'uC', 'uD', 'uPal'];

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
    this.genTex = this._tex(); this.srcTex = this._tex(); this.glyphTex = this._tex();
    gl.bindTexture(gl.TEXTURE_2D, this.glyphTex); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, glyphAtlas());
    this.fbo = gl.createFramebuffer();
    this.c2d = document.createElement('canvas');
    this.ctx = this.c2d.getContext('2d');
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
        // poll the async compile, but never wait more than 1.2s (some drivers never report completion)
        if (this.par && performance.now() - t0 < 1200 && !this.gl.getProgramParameter(e.prog, this.par.COMPLETION_STATUS_KHR)) { setTimeout(check, 16); return; }
        try { res(this._finish(e)); } catch (err) { this.progs.delete(name); rej(err); }
      };
      check();
    });
    this.progs.set(name, pr);
    return pr;
  }
  setSize(w, h) {
    w = Math.max(2, Math.min(Math.round(w), this.maxSize)); h = Math.max(2, Math.min(Math.round(h), this.maxSize));
    if (w === this.w && h === this.h) return false;
    this.w = w; this.h = h; this.canvas.width = w; this.canvas.height = h; this.c2d.width = w; this.c2d.height = h;
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.genTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.genTex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return true;
  }
  _quad() { const gl = this.gl; gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.drawArrays(gl.TRIANGLES, 0, 3); }
  /** job: { prog?, painter?, phase, time, seed:[4], p:[4], pal:Float32Array(15), fx } */
  draw(job) {
    const gl = this.gl, W = this.w, H = this.h; let src;
    if (job.prog) {
      const u = job.prog.u; gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo); gl.viewport(0, 0, W, H); gl.useProgram(job.prog.prog);
      gl.uniform2f(u.uRes, W, H); gl.uniform1f(u.uTime, job.time); gl.uniform1f(u.uPhase, job.phase);
      gl.uniform4fv(u.uSeed, job.seed); gl.uniform4fv(u.uP, job.p); gl.uniform3fv(u.uPal, job.pal);
      const w = job.w || ZW; for (let i = 0; i < 5; i++) if (u['uW' + i]) gl.uniform4fv(u['uW' + i], w.subarray(i * 4, i * 4 + 4));
      this._quad(); src = this.genTex;
    } else {
      job.painter.draw(job.phase);
      gl.bindTexture(gl.TEXTURE_2D, this.srcTex); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.c2d);
      src = this.srcTex;
    }
    const f = job.fx, u = this.fx.u;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H); gl.useProgram(this.fx.prog);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, src); gl.uniform1i(u.uTex, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.glyphTex); gl.uniform1i(u.uGlyph, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform2f(u.uRes, W, H); gl.uniform1f(u.uPhase, job.phase); gl.uniform1f(u.uTime, job.time); gl.uniform1f(u.uK, Math.max(0.5, Math.min(W, H) / 900));
    gl.uniform4f(u.uA, f.grain || 0, f.vig || 0, f.scan || 0, f.ca || 0);
    gl.uniform4f(u.uB, f.glitch || 0, f.pixel || 0, f.poster || 0, f.curve || 0);
    gl.uniform4f(u.uC, f.leak || 0, f.paper || 0, FX_MODES[f.mode || 'none'] || 0, f.cell || 8);
    gl.uniform4f(u.uD, f.tone || 0, f.bloom || 0, f.contrast || 1, 0);
    gl.uniform3fv(u.uPal, job.pal);
    this._quad();
  }
}
