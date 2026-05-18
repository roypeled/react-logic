import { useEffect, useMemo, useRef } from 'react';

/* =========================================================================
 *  Y2K Tech-Grunge Background — WebGL canvas variant.
 *  ------------------------------------------------------------------------
 *  Same visual idea as GrungeBackground.tsx (SVG/filters) but the whole
 *  pipeline runs in a fragment shader. Rasterization cost is bounded by the
 *  canvas's intrinsic pixel size regardless of viewport — CSS scales the
 *  resulting bitmap on the GPU.
 *
 *  All animation runs in our own requestAnimationFrame loop with a single
 *  `u_time` uniform. No SMIL, no SVG filters, no browser heuristics to fight.
 * ========================================================================= */

// --- palette (mirrors GrungeBackground.tsx) --------------------------------
type Palette = {
  bg: [string, string, string];
  red: string;
  blue: string;
  purple: string;
  cyan: string;
  pink: string;
};

const PALETTES = {
  classic: {
    bg: ['#1a1438', '#0d0820', '#05030f'],
    red: '#ff2a4a',
    blue: '#2a6fff',
    purple: '#a83cff',
    cyan: '#2affe0',
    pink: '#ff5a7a',
  },
  hellfire: {
    bg: ['#3a0a14', '#1a0410', '#080205'],
    red: '#ff1a2a',
    blue: '#ff6a3c',
    purple: '#c8003c',
    cyan: '#ffaa3c',
    pink: '#ff8a5a',
  },
  midnight: {
    bg: ['#0a1a3a', '#04102a', '#020614'],
    red: '#5a8fff',
    blue: '#2a6fff',
    purple: '#6a3cff',
    cyan: '#2affe0',
    pink: '#7aafff',
  },
  toxic: {
    bg: ['#0a2a1a', '#041a14', '#020a08'],
    red: '#ffaa00',
    blue: '#00ff8a',
    purple: '#aaff00',
    cyan: '#00ffaa',
    pink: '#ffea00',
  },
  vapor: {
    bg: ['#2a0a3a', '#1a0428', '#0a0218'],
    red: '#ff3aaa',
    blue: '#3aaaff',
    purple: '#aa3aff',
    cyan: '#3affea',
    pink: '#ff5acf',
  },
} as const satisfies Record<string, Palette>;

type PaletteKey = keyof typeof PALETTES;

// --- PRNG (same as SVG variant so the same seed produces consistent feel) ---
const mulberry32 = (seed: number): (() => number) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// --- color helpers ---------------------------------------------------------
const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
};

// --- shaders ---------------------------------------------------------------
const VERTEX_SHADER = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;

  varying vec2 v_uv;

  uniform float u_time;
  uniform vec2 u_resolution;
  uniform float u_animate;

  // Background palette (3 stops)
  uniform vec3 u_bg0;
  uniform vec3 u_bg1;
  uniform vec3 u_bg2;

  // Orb data (5 orbs)
  uniform vec2 u_orbCenter[5];   // base center in viewBox units (0..1600, 0..900)
  uniform vec2 u_orbRadius[5];   // (rx, ry) in viewBox units
  uniform vec3 u_orbColor[5];
  uniform float u_orbOpacity[5];

  // Orb drift timing per orb: x = duration (seconds), y = begin offset
  uniform vec2 u_orbTiming[5];

  // ---- noise helpers ----------------------------------------------------
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  // Fractal Brownian motion — replaces feTurbulence.
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * vnoise(p);
      p *= 2.1;
      a *= 0.55;
    }
    return v;
  }

  // ---- orb drift ---------------------------------------------------------
  // 6-keyframe path per orb. The base path covers most of the canvas; we
  // rotate it by 'phase' per orb so each one traces a different loop.
  // Amplitudes scaled to ~half the viewBox so orbs visibly travel across.
  vec2 orbDrift(float t, float phase) {
    vec2 k0 = vec2(0.0, 0.0);
    vec2 k1 = vec2(700.0, -380.0);
    vec2 k2 = vec2(-560.0, 420.0);
    vec2 k3 = vec2(820.0, 260.0);
    vec2 k4 = vec2(-420.0, -500.0);
    vec2 k5 = vec2(0.0, 0.0);

    vec2 p;
    if (t < 0.2) {
      p = mix(k0, k1, smoothstep(0.0, 0.2, t));
    } else if (t < 0.45) {
      p = mix(k1, k2, smoothstep(0.2, 0.45, t));
    } else if (t < 0.7) {
      p = mix(k2, k3, smoothstep(0.45, 0.7, t));
    } else if (t < 0.9) {
      p = mix(k3, k4, smoothstep(0.7, 0.9, t));
    } else {
      p = mix(k4, k5, smoothstep(0.9, 1.0, t));
    }

    // Per-orb rotation so they don't all sweep the same arc.
    float c = cos(phase);
    float s = sin(phase);
    return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
  }

  // ---- main --------------------------------------------------------------
  void main() {
    vec2 uv = v_uv;

    // Convert to viewBox-like coords (1600 x 900) so the numbers in this
    // shader match the original SVG values.
    vec2 box = vec2(1600.0, 900.0);
    vec2 pos = uv * box;

    // Warp displacement — sample fbm twice for x/y offsets. The noise field
    // itself drifts with time so the whole bg ripples slowly.
    float warpTime = u_time * u_animate * 0.015;
    vec2 warp = vec2(
      fbm(pos * 0.012 + vec2(warpTime, -warpTime * 0.7)),
      fbm(pos * 0.012 + vec2(73.0 - warpTime * 0.5, warpTime))
    ) - 0.5;
    vec2 warped = pos + warp * 44.0;

    // Background: 3-stop radial centered around (640, 405) with falloff.
    float bgD = distance(uv, vec2(0.4, 0.45));
    vec3 col = mix(u_bg0, u_bg1, smoothstep(0.0, 0.45, bgD));
    col = mix(col, u_bg2, smoothstep(0.45, 1.05, bgD));

    // 5 orbs with screen blend over the warped background.
    for (int i = 0; i < 5; i++) {
      float dur = u_orbTiming[i].x;
      float begin = u_orbTiming[i].y;
      float t = mod((u_time + begin) * u_animate, dur) / dur;
      // Distinct phase per orb (~72° apart) so the 5 arcs spread out.
      float phase = float(i) * 1.2566;
      vec2 drift = orbDrift(t, phase);
      vec2 center = u_orbCenter[i] + drift;

      vec2 d = (warped - center) / u_orbRadius[i];
      float dist = length(d);
      // Mirror the SVG radialGradient stops: 0% → opacity, 55% → 0.35,
      // 100% → 0. Use smoothstep for a soft falloff.
      float intensity = smoothstep(1.0, 0.0, dist) * u_orbOpacity[i];

      // Screen blend: 1 - (1-A) * (1-B)
      col = 1.0 - (1.0 - col) * (1.0 - u_orbColor[i] * intensity);
    }

    // Scanlines — horizontal dark stripes, slowly scrolling. ~0.4 px/s so
    // the lines drift rather than flash past.
    float scrollPx = u_time * u_animate * 0.4;
    float scanY = mod(gl_FragCoord.y + scrollPx, 3.0);
    float scan = step(scanY, 1.5) * 0.28;
    col *= 1.0 - scan;

    // Chunky chroma noise — multiply + screen passes blended. Drifts very
    // slowly (the field itself oozes over tens of seconds).
    float chroma = fbm(pos * 0.45 + 17.0 + u_time * u_animate * 0.015);
    vec3 chromaCol = vec3(0.9 * chroma, 0.2 * chroma, 1.1 * chroma);
    col = col * (1.0 - 0.18) + chromaCol * 0.18;

    // Fine grain — quantized to 24fps so the noise reshuffles at film/TV
    // cadence instead of the display's native rate. Reads as film grain.
    float grainT = floor(u_time * u_animate * 24.0) / 24.0;
    float grain = hash(pos + grainT * 13.0) - 0.5;
    col += grain * 0.07;

    // Vignette
    float vigD = distance(uv, vec2(0.5));
    col *= 1.0 - smoothstep(0.55, 1.0, vigD) * 0.7;

    gl_FragColor = vec4(col, 1.0);
  }
`;

// --- WebGL helpers ---------------------------------------------------------
const compile = (gl: WebGLRenderingContext, type: number, source: string): WebGLShader => {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('createShader failed');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile failed: ${log}`);
  }
  return shader;
};

const link = (gl: WebGLRenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram => {
  const program = gl.createProgram();
  if (!program) throw new Error('createProgram failed');
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link failed: ${log}`);
  }
  return program;
};

// --- generated per-instance data -------------------------------------------
type GlitchBar = { kind: 'glitch'; x: number; y: number; w: number; h: number; color: string; opacity: number };
type AsciiBlock = { kind: 'ascii'; x: number; y: number; color: string; opacity: number; text: string };
type Crosshair = { kind: 'crosshair'; cx: number; cy: number; r: number; color: string };
type Streak = { kind: 'streak'; x: number; y: number; w: number; h: number; color: string; opacity: number };
type DarkStreak = { kind: 'darkStreak'; x: number; y: number; w: number; h: number; color: string };
type Dropout = { kind: 'dropout'; y: number; h: number };
type CornerBracket = { kind: 'corner'; color: string };
type TornShape = { kind: 'torn'; points: string; color: string; opacity: number };
type Splatter = { kind: 'splatter'; cx: number; cy: number; rx: number; ry: number; color: string; opacity: number };
type Splash = { kind: 'splash'; color: string; dots: Array<{ cx: number; cy: number; r: number; opacity: number }> };
type Decoration =
  | GlitchBar
  | AsciiBlock
  | Crosshair
  | Streak
  | DarkStreak
  | Dropout
  | CornerBracket
  | TornShape
  | Splatter
  | Splash;

interface InstanceData {
  bg: [number, number, number][];          // 3 colors
  orbCenter: [number, number][];           // 5 centers
  orbRadius: [number, number][];           // 5 radii
  orbColor: [number, number, number][];    // 5 colors
  orbOpacity: number[];                    // 5 opacities
  orbTiming: [number, number][];           // 5 (dur, begin)
  decorations: Decoration[];
  warpSeed: number;
}

const HEX_FRAGMENTS = [
  '0xFF3A4A : 1010_1100 // SYS.LOAD',
  '>> init.exe -- bootstrap [OK]',
  'PORT 0451 :: CONNECT 56k',
  'ERR_404 :: NOT_FOUND',
  'RGB(170,60,255) // BLEND.SCREEN',
  '{ sector: 0x0F, status: corrupt }',
  '// ENCRYPT.MODULE v2.0.1',
  'TX 0x0A8F :: ACK',
  'buffer.overflow @ 0x7FFE',
  'MEM 384k / 640k :: OK',
  'trace[0] = stack.push(null)',
  'kernel32.dll :: loaded',
  '//-- handshake complete --//',
  'IRQ.07 :: COM2 ready',
  'frame.drop = 0.042ms',
];

const VIEWBOX_W = 1600;
const VIEWBOX_H = 900;

const buildInstance = (seed: number, palette: PaletteKey): InstanceData => {
  const p = PALETTES[palette];
  const r = mulberry32(seed);
  const range = (a: number, b: number) => a + r() * (b - a);
  const int = (a: number, b: number) => Math.floor(a + r() * (b - a + 1));
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(r() * arr.length)];

  const orbColors = [p.purple, p.blue, p.red, p.cyan, p.purple];
  const orbCenter: [number, number][] = [];
  const orbRadius: [number, number][] = [];
  const orbColor: [number, number, number][] = [];
  const orbOpacity: number[] = [];

  for (let i = 0; i < 5; i++) {
    orbCenter.push([range(80, VIEWBOX_W - 80), range(80, VIEWBOX_H - 80)]);
    orbRadius.push([range(260, 620), range(200, 460)]);
    orbColor.push(hexToRgb(orbColors[i]));
    orbOpacity.push(range(0.7, 0.95));
  }

  const decorations: Decoration[] = [];

  // Torn polygon shapes — big semi-transparent vector blobs that move under
  // the warp filter for an organic, smeared look.
  for (let i = 0; i < 3; i++) {
    const cx = range(120, VIEWBOX_W - 120);
    const cy = range(120, VIEWBOX_H - 120);
    const n = int(5, 7);
    const pts: string[] = [];
    for (let j = 0; j < n; j++) {
      const ang = (j / n) * Math.PI * 2 + range(-0.3, 0.3);
      const rad = range(120, 260);
      pts.push(`${cx + Math.cos(ang) * rad},${cy + Math.sin(ang) * rad}`);
    }
    decorations.push({
      kind: 'torn',
      points: pts.join(' '),
      color: pick([p.purple, p.red, p.blue]),
      opacity: range(0.3, 0.55),
    });
  }

  // Splatters — blurred circles/ellipses.
  for (let i = 0; i < 3; i++) {
    const radius = range(28, 80);
    const isEllipse = int(0, 1) === 1;
    decorations.push({
      kind: 'splatter',
      cx: range(40, VIEWBOX_W - 40),
      cy: range(40, VIEWBOX_H - 40),
      rx: radius,
      ry: isEllipse ? radius * 0.6 : radius,
      color: pick([p.purple, p.red, p.blue, p.pink]),
      opacity: range(0.25, 0.5),
    });
  }

  // Splashes — clusters of tiny dots around a center, slight blur.
  for (let i = 0; i < 3; i++) {
    const cx = range(80, VIEWBOX_W - 80);
    const cy = range(80, VIEWBOX_H - 80);
    const dotCount = int(8, 14);
    const dots: Array<{ cx: number; cy: number; r: number; opacity: number }> = [];
    for (let j = 0; j < dotCount; j++) {
      dots.push({
        cx: cx + range(-60, 60),
        cy: cy + range(-50, 50),
        r: range(0.5, 3.2),
        opacity: range(0.5, 0.95),
      });
    }
    decorations.push({
      kind: 'splash',
      color: pick([p.red, p.blue, p.purple, p.pink]),
      dots,
    });
  }

  // 3 bright horizontal streaks
  decorations.push(
    { kind: 'streak', x: -100, y: VIEWBOX_H * 0.34, w: VIEWBOX_W + 200, h: 3, color: p.red, opacity: 0.85 },
    { kind: 'streak', x: -100, y: VIEWBOX_H * 0.6, w: VIEWBOX_W + 200, h: 2, color: p.blue, opacity: 0.8 },
    { kind: 'streak', x: -100, y: VIEWBOX_H * 0.67, w: VIEWBOX_W + 200, h: 4, color: p.purple, opacity: 0.85 }
  );

  // 2 thick dark diagonal streaks — multiply-blend bands that knock the
  // canvas back to the underlying page bg (page gradient behind the hero).
  decorations.push(
    { kind: 'darkStreak', x: -200, y: VIEWBOX_H * 0.18, w: VIEWBOX_W + 400, h: 14, color: '#000018' },
    { kind: 'darkStreak', x: -200, y: VIEWBOX_H * 0.8, w: VIEWBOX_W + 400, h: 22, color: '#000010' },
  );

  // 11 glitch bars
  for (let i = 0; i < 11; i++) {
    decorations.push({
      kind: 'glitch',
      x: range(0, VIEWBOX_W - 40),
      y: range(20, VIEWBOX_H - 20),
      w: range(60, 280),
      h: range(1, 5),
      color: pick([p.red, p.blue, p.purple, p.cyan, p.pink]),
      opacity: range(0.7, 1),
    });
  }

  // 6 ASCII fragments
  for (let i = 0; i < 6; i++) {
    decorations.push({
      kind: 'ascii',
      x: range(40, VIEWBOX_W - 280),
      y: range(40, VIEWBOX_H - 40),
      color: pick([p.blue, p.pink, p.purple, p.cyan]),
      opacity: range(0.35, 0.6),
      text: pick(HEX_FRAGMENTS),
    });
  }

  // 2 crosshair markers
  for (let i = 0; i < 2; i++) {
    decorations.push({
      kind: 'crosshair',
      cx: range(120, VIEWBOX_W - 120),
      cy: range(120, VIEWBOX_H - 120),
      r: range(18, 28),
      color: pick([p.red, p.blue, p.pink]),
    });
  }

  // Corner brackets
  decorations.push({ kind: 'corner', color: p.cyan });

  // Tape dropouts — 2–5 thin horizontal dark lines, full width. Read as
  // VHS/film dropout bands when blended with multiply.
  const dropoutCount = int(2, 5);
  for (let i = 0; i < dropoutCount; i++) {
    decorations.push({
      kind: 'dropout',
      y: range(0, VIEWBOX_H),
      h: range(1, 3),
    });
  }

  return {
    bg: p.bg.map(hexToRgb) as [number, number, number][],
    orbCenter,
    orbRadius,
    orbColor,
    orbOpacity,
    // Cicada principle: all durations are distinct primes, so the loops
    // only re-align at lcm(d0..d4) = product of all primes ≈ 1.6 billion
    // seconds. Begin offsets are also primes for the same reason — phase
    // at t=0 doesn't repeat between orbs either.
    orbTiming: [
      [127, -13],
      [173, -41],
      [211, -83],
      [257, -149],
      [313, -197],
    ],
    decorations,
    warpSeed: Math.floor(r() * 200),
  };
};

// --- static overlay (SVG, no animation) -----------------------------------
// Filters here run once at rasterization — no per-frame cost. They give the
// overlay the same torn/wobbly feel as the original SVG variant without the
// animated SMIL re-rasterization that was killing perf at 4K.
const Overlay = ({ data }: { data: InstanceData }) => {
  // Split decorations into layers so we can apply different filters.
  const torn = data.decorations.filter((d) => d.kind === 'torn');
  const splatters = data.decorations.filter((d) => d.kind === 'splatter');
  const splashes = data.decorations.filter((d) => d.kind === 'splash');
  const darkStreaks = data.decorations.filter((d) => d.kind === 'darkStreak');
  const rest = data.decorations.filter(
    (d) =>
      d.kind !== 'torn' &&
      d.kind !== 'splatter' &&
      d.kind !== 'splash' &&
      d.kind !== 'darkStreak'
  );

  const renderDecoration = (d: Decoration, i: number) => {
    switch (d.kind) {
      case 'streak':
          return (
            <rect
              key={i}
              x={d.x}
              y={d.y}
              width={d.w}
              height={d.h}
              fill={d.color}
              opacity={d.opacity}
              transform={`rotate(-6 ${VIEWBOX_W / 2} ${d.y + d.h / 2})`}
              style={{ mixBlendMode: 'screen' }}
            />
          );
        case 'glitch':
          return (
            <rect
              key={i}
              x={d.x}
              y={d.y}
              width={d.w}
              height={d.h}
              fill={d.color}
              opacity={d.opacity}
              style={{ mixBlendMode: 'screen' }}
            />
          );
        case 'ascii':
          return (
            <text
              key={i}
              x={d.x}
              y={d.y}
              fontFamily="Courier New, monospace"
              fontSize="11"
              fill={d.color}
              opacity={d.opacity}
              style={{ mixBlendMode: 'screen' }}
            >
              {d.text}
            </text>
          );
        case 'crosshair':
          return (
            <g
              key={i}
              stroke={d.color}
              strokeWidth="0.8"
              fill="none"
              opacity="0.75"
              style={{ mixBlendMode: 'screen' }}
            >
              <circle cx={d.cx} cy={d.cy} r={d.r} />
              <line x1={d.cx - d.r - 10} y1={d.cy} x2={d.cx - d.r + 5} y2={d.cy} />
              <line x1={d.cx + d.r - 5} y1={d.cy} x2={d.cx + d.r + 10} y2={d.cy} />
              <line x1={d.cx} y1={d.cy - d.r - 10} x2={d.cx} y2={d.cy - d.r + 5} />
              <line x1={d.cx} y1={d.cy + d.r - 5} x2={d.cx} y2={d.cy + d.r + 10} />
            </g>
          );
        case 'corner':
          return (
            <g key={i} stroke={d.color} strokeWidth="1" fill="none" opacity="0.7">
              <path d="M60 60 L60 40 L100 40" />
              <path d={`M${VIEWBOX_W - 60} 40 L${VIEWBOX_W - 40} 40 L${VIEWBOX_W - 40} 80`} />
              <path d={`M60 ${VIEWBOX_H - 60} L60 ${VIEWBOX_H - 40} L100 ${VIEWBOX_H - 40}`} />
              <path
                d={`M${VIEWBOX_W - 60} ${VIEWBOX_H - 40} L${VIEWBOX_W - 40} ${VIEWBOX_H - 40} L${VIEWBOX_W - 40} ${VIEWBOX_H - 80}`}
              />
            </g>
          );
        case 'torn':
          return (
            <polygon
              key={i}
              points={d.points}
              fill={d.color}
              opacity={d.opacity}
              style={{ mixBlendMode: 'screen' }}
            />
          );
        case 'splatter':
          return (
            <ellipse
              key={i}
              cx={d.cx}
              cy={d.cy}
              rx={d.rx}
              ry={d.ry}
              fill={d.color}
              opacity={d.opacity}
              style={{ mixBlendMode: 'screen' }}
            />
          );
        case 'splash':
          return (
            <g key={i} fill={d.color} style={{ mixBlendMode: 'screen' }}>
              {d.dots.map((dot, j) => (
                <circle
                  key={j}
                  cx={dot.cx}
                  cy={dot.cy}
                  r={dot.r}
                  opacity={dot.opacity}
                />
              ))}
            </g>
          );
        case 'darkStreak':
          // Rendered via CSS mask on the wrapper, not painted here.
          return null;
        case 'dropout':
          return (
            <rect
              key={i}
              x={0}
              y={d.y}
              width={VIEWBOX_W}
              height={d.h}
              fill="#000"
              opacity={0.7}
              style={{ mixBlendMode: 'multiply' }}
            />
          );
      }
    };

  const warpId = `gc-warp-${data.warpSeed}`;
  const warpTightId = `gc-warp-tight-${data.warpSeed}`;
  const blurSoftId = `gc-blur-soft-${data.warpSeed}`;
  const blurHeavyId = `gc-blur-heavy-${data.warpSeed}`;

  const maskUrl = buildStreakMaskUrl(darkStreaks as DarkStreak[]);

  return (
    <svg
      width={VIEWBOX_W}
      height={VIEWBOX_H}
      viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        maskImage: maskUrl,
        WebkitMaskImage: maskUrl,
        maskMode: 'luminance',
        maskSize: '100% 100%',
        WebkitMaskSize: '100% 100%',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        mixBlendMode: 'color-dodge',
        filter: 'blur(6px)',
      }}
      aria-hidden="true"
    >
      <defs>
        {/* Static turbulence + displacement. Rasterized once — no per-frame
            cost since the filter inputs never change. */}
        <filter id={warpId} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.042"
            numOctaves={2}
            seed={data.warpSeed}
            result="warp"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="warp"
            scale={22}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        {/* Lighter warp for sharp UI bits — keeps them legible but kills the
            "too clean vector" look. */}
        <filter id={warpTightId} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.08 0.2"
            numOctaves={1}
            seed={data.warpSeed + 11}
            result="warpT"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="warpT"
            scale={7}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <filter id={blurSoftId}>
          <feGaussianBlur stdDeviation="1" />
        </filter>
        <filter id={blurHeavyId}>
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* The CSS mask on the <svg> root cuts the diagonal bands out of the
          entire overlay, revealing the WebGL canvas underneath cleanly. */}

      {/* Heavy-warp: splatters (blurred) + torn polygons. */}
      <g filter={`url(#${warpId})`}>
        <g filter={`url(#${blurHeavyId})`}>{splatters.map(renderDecoration)}</g>
        <g>
          {torn.map(renderDecoration)}
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="translate"
            values="0,0; 380,-220; -280,260; 420,140; -220,-300; 0,0"
            keyTimes="0; 0.2; 0.45; 0.7; 0.9; 1"
            dur="180s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1"
          />
        </g>
      </g>

      {/* Splashes — soft blur, no warp. */}
      <g filter={`url(#${blurSoftId})`}>{splashes.map(renderDecoration)}</g>

      {/* HUD bits: subtle warp. */}
      <g filter={`url(#${warpTightId})`}>{rest.map(renderDecoration)}</g>
    </svg>
  );
};

/**
 * Build an inline-SVG mask as a data URL. The mask is white everywhere
 * (visible) with blurred black diagonal bands (cut out). Applied via CSS
 * `mask-image` to the overlay SVG so the diagonal bands punch through the
 * SVG layer cleanly — the WebGL canvas underneath stays visible.
 *
 * The Gaussian blur on the streaks softens the cut edges so the bands look
 * like torn/feathered film rather than sharp scissors.
 */
const buildStreakMaskUrl = (streaks: DarkStreak[]): string => {
  const rects = streaks
    .map(
      (d) =>
        `<rect x='${d.x}' y='${d.y}' width='${d.w}' height='${d.h}' fill='black' transform='rotate(-8 ${VIEWBOX_W / 2} ${d.y + d.h / 2})'/>`
    )
    .join('');
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${VIEWBOX_W} ${VIEWBOX_H}' preserveAspectRatio='none'>` +
    `<defs><filter id='b' x='-10%' y='-10%' width='120%' height='120%'><feGaussianBlur stdDeviation='6'/></filter></defs>` +
    `<rect width='${VIEWBOX_W}' height='${VIEWBOX_H}' fill='white'/>` +
    `<g filter='url(#b)'>${rects}</g>` +
    `</svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
};

// --- React component -------------------------------------------------------
export interface GrungeCanvasProps {
  /** Intrinsic canvas pixel dimensions. Filter cost is bounded by this. */
  width?: number;
  height?: number;
  /** Stable random seed. Defaults to a per-mount random value. */
  seed?: number;
  /** Palette key. Defaults to a random palette. */
  palette?: PaletteKey;
  /** Whether the rAF loop runs. False renders one static frame. */
  animate?: boolean;
  className?: string;
}

const PALETTE_KEYS = Object.keys(PALETTES) as PaletteKey[];

export const GrungeCanvas = ({
  width = 1024,
  height = 576,
  seed,
  palette,
  animate = true,
  className,
}: GrungeCanvasProps = {}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Stabilize seed and palette once per mount. Avoids re-creating WebGL state
  // when the parent re-renders.
  const stableSeed = useMemo(
    () => seed ?? Math.floor(Math.random() * 1e9),
    // Intentionally only on mount — parent re-renders shouldn't churn the
    // scene. Pass a different React key to reset.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const stablePalette = useMemo(
    () => palette ?? PALETTE_KEYS[Math.floor(Math.random() * PALETTE_KEYS.length)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Single source of truth for the per-mount randomized data. Used by both
  // the WebGL render and the SVG overlay so seeds match.
  const data = useMemo(
    () => buildInstance(stableSeed, stablePalette),
    [stableSeed, stablePalette]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
    if (!gl) {
      console.warn('GrungeCanvas: WebGL not available, falling back to nothing');
      return;
    }

    // ---- compile shaders ------------------------------------------------
    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = link(gl, vs, fs);
    gl.useProgram(program);

    // ---- fullscreen quad ------------------------------------------------
    const quad = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // ---- uniforms -------------------------------------------------------
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uResolution = gl.getUniformLocation(program, 'u_resolution');
    const uAnimate = gl.getUniformLocation(program, 'u_animate');

    gl.uniform2f(uResolution, width, height);
    gl.uniform1f(uAnimate, animate ? 1.0 : 0.0);

    gl.uniform3fv(gl.getUniformLocation(program, 'u_bg0'), data.bg[0]);
    gl.uniform3fv(gl.getUniformLocation(program, 'u_bg1'), data.bg[1]);
    gl.uniform3fv(gl.getUniformLocation(program, 'u_bg2'), data.bg[2]);

    gl.uniform2fv(
      gl.getUniformLocation(program, 'u_orbCenter'),
      new Float32Array(data.orbCenter.flat())
    );
    gl.uniform2fv(
      gl.getUniformLocation(program, 'u_orbRadius'),
      new Float32Array(data.orbRadius.flat())
    );
    gl.uniform3fv(
      gl.getUniformLocation(program, 'u_orbColor'),
      new Float32Array(data.orbColor.flat())
    );
    gl.uniform1fv(
      gl.getUniformLocation(program, 'u_orbOpacity'),
      new Float32Array(data.orbOpacity)
    );
    gl.uniform2fv(
      gl.getUniformLocation(program, 'u_orbTiming'),
      new Float32Array(data.orbTiming.flat())
    );

    gl.viewport(0, 0, width, height);

    // ---- render loop ----------------------------------------------------
    let raf = 0;
    const start = performance.now();
    const draw = () => {
      const t = (performance.now() - start) / 1000;
      gl.uniform1f(uTime, t);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (animate) {
        raf = requestAnimationFrame(draw);
      }
    };
    draw();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      gl.deleteBuffer(buffer);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteProgram(program);
    };
  }, [data, width, height, animate]);

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        aria-hidden="true"
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />
      <Overlay data={data} />
    </div>
  );
};
