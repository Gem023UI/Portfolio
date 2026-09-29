import { useEffect, useRef, type CSSProperties, type MutableRefObject } from 'react';
import { useTheme } from './ThemeContext';
import { SKY_THEMES, VERTEX_SHADER, SKY_MAX_WIDTH } from './skyShared';
import { SURGE_FRAGMENT_SHADER, BELT_FRAGMENT_SHADER } from './cloudSurgeShader';

// A transparent WebGL canvas that paints procedural cloud over whatever is behind it.
// It is driven imperatively: a parent updates `progressRef.current` (0..1) from a
// ScrollTrigger, and this component redraws when that value changes. No React re-renders
// happen while scrolling.
//
// variant "surge" (default): a coverage wipe.
//   progress 0  -> fully transparent
//   progress 1  -> solid colour == the theme's cloud colour (SKY_THEMES[theme].tones.high)
//   Use `fromTop` to hang the mass from the top edge instead of rising from the bottom.
//
// variant "belt": a horizontal band, billowing on both edges, centred in the canvas.
//   Meant to straddle the seam between two stacked sections so the seam is always hidden
//   inside the belt's solid core, at any scroll position. `progress` only swells it slightly
//   thicker (a "breathing" effect) — it is never a coverage wipe, and it never clears to
//   transparent at progress 0. `fromTop` has no effect on this variant.

interface CloudSurgeProps {
  progressRef: MutableRefObject<number>;
  className?: string;
  style?: CSSProperties;
  /** Shifts the cloud pattern so two surges on the same page don't look identical. */
  timeOffset?: number;
  /** "surge" (default): coverage wipe. "belt": a seam-straddling band, billowing both edges. */
  variant?: 'surge' | 'belt';
  /** surge only: cloud mass hangs from the top edge (billowing edge points down). */
  fromTop?: boolean;
}

function compile(gl: WebGLRenderingContext, kind: number, source: string): WebGLShader {
  const shader = gl.createShader(kind);
  if (!shader) throw new Error('Could not create a shader.');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || 'Cloud shader failed to compile.';
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

export default function CloudSurge({
  progressRef,
  className,
  style,
  timeOffset = 0,
  variant = 'surge',
  fromTop = false,
}: CloudSurgeProps) {
  const { resolvedTheme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
    }) as WebGLRenderingContext | null;
    if (!gl) return;

    const cfg = SKY_THEMES[resolvedTheme];
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const isBelt = variant === 'belt';

    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    let texture: WebGLTexture | null = null;
    let uRes: WebGLUniformLocation | null = null;
    let uTime: WebGLUniformLocation | null = null;
    let uP: WebGLUniformLocation | null = null;
    let frame = 0;
    let lost = false;
    let t = cfg.startT + timeOffset;
    let last = 0;
    let lastDrawnP = -1;
    let dirty = true;
    let visible = true;

    const setup = () => {
      const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
      const fs = compile(gl, gl.FRAGMENT_SHADER, isBelt ? BELT_FRAGMENT_SHADER : SURGE_FRAGMENT_SHADER);
      program = gl.createProgram();
      if (!program) throw new Error('Could not create the cloud program.');
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.bindAttribLocation(program, 0, 'p');
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || 'Cloud program failed to link.');
      }
      gl.useProgram(program);

      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

      texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      const noise = new Uint8Array(256 * 256 * 4);
      for (let i = 0; i < 256 * 256; i++) {
        const v = (Math.random() * 256) | 0;
        noise[i * 4] = v;
        noise[i * 4 + 1] = v;
        noise[i * 4 + 2] = v;
        noise[i * 4 + 3] = 255;
      }
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, noise);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      const U = (name: string) => gl.getUniformLocation(program!, name);
      gl.uniform1i(U('u_noise'), 0);
      gl.uniform3fv(U('u_main'), cfg.tones.main);
      gl.uniform3fv(U('u_low'), cfg.tones.low);
      gl.uniform3fv(U('u_mid'), cfg.tones.mid);
      gl.uniform3fv(U('u_high'), cfg.tones.high);
      gl.uniform1f(U('u_nscale'), 0.35 + (cfg.scale / 100) * 1.15);
      gl.uniform1f(U('u_warp'), (cfg.distortion / 100) * 0.47);
      gl.uniform1f(U('u_wind'), (cfg.swirl / 100) * 0.36);
      const angle = ((cfg.direction % 4) * Math.PI) / 2;
      gl.uniform2f(U('u_dirv'), Math.cos(angle), Math.sin(angle));
      gl.uniform3fv(U('u_cloud'), cfg.tones.high); // == the section colour this cloud hands off to
      gl.uniform3fv(U('u_shade'), cfg.tones.main); // leading/outer banks tint toward the sky
      gl.uniform1f(U('u_flip'), !isBelt && fromTop ? 1 : 0);
      uRes = U('u_res');
      uTime = U('u_t');
      uP = U('u_p');
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
    };

    const draw = (p: number) => {
      if (!program || lost || canvas.width < 1 || canvas.height < 1) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (!isBelt && p <= 0.0005) return; // surge: fully transparent, leave the cleared canvas
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniform1f(uP, Math.min(1, Math.max(0, p)));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (!visible) {
        last = 0;
        return;
      }
      const p = progressRef.current;
      // belt: always drifting gently (it's on screen whenever its section is). surge: only
      // animate the billowing while it's actually mid-transition, and freeze at the 0/1 ends.
      const moving = isBelt || (p > 0.0005 && p < 0.9995);
      if (!moving && !dirty && Math.abs(p - lastDrawnP) < 1e-4) {
        last = 0;
        return;
      }
      if (moving && last && !motion.matches) {
        t += Math.min(0.05, (now - last) / 1000) * (cfg.speed / 100) * cfg.flowSpeedRate * (isBelt ? 0.5 : 1);
      }
      last = moving ? now : 0;
      draw(p);
      lastDrawnP = p;
      dirty = false;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      // soft clouds: render at a reduced resolution and let CSS scale it up (much cheaper)
      const dpr = Math.min(1.5, window.devicePixelRatio || 1) * 0.7;
      const s = Math.min(1, SKY_MAX_WIDTH / Math.max(1, rect.width * dpr));
      const w = Math.max(1, Math.round(rect.width * dpr * s));
      const h = Math.max(1, Math.round(rect.height * dpr * s));
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
      dirty = true;
    };

    const onLost = (event: Event) => {
      event.preventDefault();
      lost = true;
    };
    const onRestored = () => {
      lost = false;
      try {
        setup();
        dirty = true;
      } catch (error) {
        console.warn('Cloud restore failed:', error);
      }
    };
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);

    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    ro?.observe(canvas);
    window.addEventListener('resize', resize);
    const io =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            dirty = true;
          });
    io?.observe(canvas);

    try {
      setup();
      resize();
      frame = requestAnimationFrame(tick);
    } catch (error) {
      console.warn('Cloud WebGL unavailable:', error);
    }

    return () => {
      cancelAnimationFrame(frame);
      ro?.disconnect();
      io?.disconnect();
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      if (!lost) {
        if (texture) gl.deleteTexture(texture);
        if (buffer) gl.deleteBuffer(buffer);
        if (program) gl.deleteProgram(program);
      }
    };
    // Re-create when the theme or variant changes so the colours/shader update.
  }, [resolvedTheme, progressRef, timeOffset, variant, fromTop]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{ display: 'block', width: '100%', height: '100%', pointerEvents: 'none', ...style }}
    />
  );
}