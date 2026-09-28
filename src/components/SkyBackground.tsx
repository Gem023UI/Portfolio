import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useTheme } from './ThemeContext';
import {
  FRAGMENT_SHADER,
  SKY_HEIGHT,
  SKY_MAX_WIDTH,
  SKY_THEMES,
  SKY_WIDTH,
  VERTEX_SHADER,
  type SkyConfig,
  type ThemeName,
} from './SkyShared';

// One sky component for all three global themes. Rendering logic is the same as
// Sky.tsx / SkySunset.tsx / SkyNight.tsx; only the per-theme constants (colors,
// speed, scale, grain...) come from SKY_THEMES.
//
// Usage: <SkyBackground style={{ position: 'absolute', inset: 0, aspectRatio: 'auto' }} />
// By default it follows the global theme; pass `theme` to force one.

type SkyBackgroundProps = {
  theme?: ThemeName;
  className?: string;
  style?: CSSProperties;
  speed?: number; // overrides the theme's default speed
  paused?: boolean;
};

type Resources = {
  program: WebGLProgram;
  vertex: WebGLShader;
  fragment: WebGLShader;
  buffer: WebGLBuffer;
  texture: WebGLTexture;
  resolution: WebGLUniformLocation | null;
  time: WebGLUniformLocation | null;
};

function compile(gl: WebGLRenderingContext, kind: number, source: string): WebGLShader {
  const shader = gl.createShader(kind);
  if (!shader) throw new Error('Could not create the Sky shader.');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || 'Sky shader failed to compile.';
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function SkyCanvas({
  config,
  className,
  style,
  speed,
  paused = false,
}: {
  config: SkyConfig;
  className?: string;
  style?: CSSProperties;
  speed: number;
  paused?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const grainRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef({ speed, paused });
  const syncRef = useRef<(() => void) | null>(null);
  const [failed, setFailed] = useState(false);
  controlsRef.current = { speed, paused };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = (canvas.getContext('webgl', { alpha: false, antialias: false }) ||
      canvas.getContext('experimental-webgl', { alpha: false, antialias: false })) as WebGLRenderingContext | null;
    if (!gl) {
      setFailed(true);
      return;
    }

    const { tones, scale, distortion, swirl, direction, grain, startT, flowSpeedRate } = config;

    let resources: Resources | null = null;
    let frame = 0;
    let last = 0;
    let t = startT;
    let visible = true;
    let lost = false;
    let disposed = false;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const destroy = () => {
      if (!resources || lost) {
        resources = null;
        return;
      }
      gl.deleteTexture(resources.texture);
      gl.deleteBuffer(resources.buffer);
      gl.deleteProgram(resources.program);
      gl.deleteShader(resources.vertex);
      gl.deleteShader(resources.fragment);
      resources = null;
    };

    const setup = () => {
      const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
      let fragment: WebGLShader | null = null;
      let program: WebGLProgram | null = null;
      let buffer: WebGLBuffer | null = null;
      let texture: WebGLTexture | null = null;
      try {
        fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
        program = gl.createProgram();
        if (!program) throw new Error('Could not create the Sky program.');
        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);
        gl.bindAttribLocation(program, 0, 'p');
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          throw new Error(gl.getProgramInfoLog(program) || 'Sky program failed to link.');
        }
        gl.useProgram(program);
        buffer = gl.createBuffer();
        if (!buffer) throw new Error('Could not create the Sky geometry.');
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        texture = gl.createTexture();
        if (!texture) throw new Error('Could not create the Sky noise texture.');
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        const noise = new Uint8Array(256 * 256 * 4);
        for (let i = 0; i < 256 * 256; i++) {
          const value = (Math.random() * 256) | 0;
          noise[i * 4] = value;
          noise[i * 4 + 1] = value;
          noise[i * 4 + 2] = value;
          noise[i * 4 + 3] = 255;
        }
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, noise);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.uniform1i(gl.getUniformLocation(program, 'u_noise'), 0);
        gl.uniform3fv(gl.getUniformLocation(program, 'u_main'), tones.main);
        gl.uniform3fv(gl.getUniformLocation(program, 'u_low'), tones.low);
        gl.uniform3fv(gl.getUniformLocation(program, 'u_mid'), tones.mid);
        gl.uniform3fv(gl.getUniformLocation(program, 'u_high'), tones.high);
        gl.uniform1f(gl.getUniformLocation(program, 'u_nscale'), 0.35 + (scale / 100) * 1.15);
        gl.uniform1f(gl.getUniformLocation(program, 'u_warp'), (distortion / 100) * 0.47);
        gl.uniform1f(gl.getUniformLocation(program, 'u_wind'), (swirl / 100) * 0.36);
        const angle = ((direction % 4) * Math.PI) / 2;
        gl.uniform2f(gl.getUniformLocation(program, 'u_dirv'), Math.cos(angle), Math.sin(angle));
        resources = {
          program,
          vertex,
          fragment,
          buffer,
          texture,
          resolution: gl.getUniformLocation(program, 'u_res'),
          time: gl.getUniformLocation(program, 'u_t'),
        };
      } catch (error) {
        if (texture) gl.deleteTexture(texture);
        if (buffer) gl.deleteBuffer(buffer);
        if (program) gl.deleteProgram(program);
        if (fragment) gl.deleteShader(fragment);
        gl.deleteShader(vertex);
        throw error;
      }
    };

    const paint = () => {
      if (!resources || lost || disposed || canvas.width < 1 || canvas.height < 1) return;
      gl.useProgram(resources.program);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(resources.resolution, canvas.width, canvas.height);
      gl.uniform1f(resources.time, t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const active = () =>
      !disposed &&
      !lost &&
      !!resources &&
      visible &&
      !document.hidden &&
      !motion.matches &&
      !controlsRef.current.paused &&
      controlsRef.current.speed > 0;

    const tick = (now: number) => {
      frame = 0;
      if (!active()) {
        last = 0;
        return;
      }
      if (last) {
        t +=
          Math.min(0.05, (now - last) / 1000) *
          (Math.min(100, Math.max(0, controlsRef.current.speed)) / 100) *
          flowSpeedRate;
      }
      last = now;
      paint();
      frame = requestAnimationFrame(tick);
    };

    const sync = () => {
      if (!active()) {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        last = 0;
        paint();
      } else if (!frame) {
        last = 0;
        paint();
        frame = requestAnimationFrame(tick);
      }
    };
    syncRef.current = sync;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      const s = Math.min(1, SKY_MAX_WIDTH / Math.max(1, rect.width * dpr));
      const width = Math.max(1, Math.round(rect.width * dpr * s));
      const height = Math.max(1, Math.round(rect.height * dpr * s));
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      paint();
    };

    const onLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      resources = null;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      setFailed(true);
    };
    const onRestored = () => {
      lost = false;
      try {
        setup();
        setFailed(false);
        resize();
        sync();
      } catch (error) {
        console.warn('Sky WebGL restore failed:', error);
        setFailed(true);
      }
    };
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    observer?.observe(canvas);
    window.addEventListener('resize', resize);
    const intersection =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            sync();
          });
    intersection?.observe(canvas);
    document.addEventListener('visibilitychange', sync);
    motion.addEventListener('change', sync);

    if (grain > 0 && grainRef.current) {
      const tile = document.createElement('canvas');
      tile.width = tile.height = 256;
      const context = tile.getContext('2d');
      if (context) {
        const image = context.createImageData(256, 256);
        for (let i = 0; i < image.data.length; i += 4) {
          const value = Math.round((Math.random() + Math.random()) * 127.5);
          image.data[i] = image.data[i + 1] = image.data[i + 2] = value;
          image.data[i + 3] = 255;
        }
        context.putImageData(image, 0, 0);
        grainRef.current.style.backgroundImage = 'url(' + tile.toDataURL() + ')';
      }
    }

    try {
      setup();
      setFailed(false);
      resize();
      sync();
    } catch (error) {
      console.warn('Sky WebGL unavailable:', error);
      setFailed(true);
    }

    return () => {
      disposed = true;
      syncRef.current = null;
      if (frame) cancelAnimationFrame(frame);
      observer?.disconnect();
      intersection?.disconnect();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', sync);
      motion.removeEventListener('change', sync);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      destroy();
    };
  }, [config]);

  useEffect(() => {
    syncRef.current?.();
  }, [speed, paused]);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        display: 'block',
        overflow: 'hidden',
        width: '100%',
        aspectRatio: String(SKY_WIDTH) + ' / ' + String(SKY_HEIGHT),
        background: 'linear-gradient(180deg, ' + config.stops.join(', ') + ')',
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={config.name}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'block',
          width: '100%',
          height: '100%',
          visibility: failed ? 'hidden' : 'visible',
          transform: config.blur > 0 ? 'scale(' + String(1 + config.blur / 200) + ')' : undefined,
          filter: config.blur > 0 ? 'blur(' + String(config.blur) + 'px)' : undefined,
        }}
      />
      {config.grain > 0 && (
        <div
          ref={grainRef}
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            backgroundSize: '256px 256px',
            imageRendering: 'pixelated',
            mixBlendMode: 'overlay',
            opacity: config.grain / 200,
          }}
        />
      )}
    </div>
  );
}

export default function SkyBackground({ theme, className, style, speed, paused }: SkyBackgroundProps) {
  const { resolvedTheme } = useTheme();
  const active = theme ?? resolvedTheme;
  const config = SKY_THEMES[active];
  // Keyed by theme so a theme change rebuilds the WebGL program with the new palette.
  return (
    <SkyCanvas
      key={active}
      config={config}
      className={className}
      style={style}
      speed={speed ?? config.speed}
      paused={paused}
    />
  );
}