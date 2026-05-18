import { useId, useMemo } from 'react';

/* =========================================================================
 *  Y2K Tech-Grunge Background — React component (background only).
 *  ------------------------------------------------------------------------
 *  Renders an SVG background with noise, distortion, glitch, grid, color-orb
 *  and palette. Knobs are baked in via DEFAULTS — no runtime controls. Pass
 *  `seed` to fix the look across renders.
 * ========================================================================= */

// --- palette presets --------------------------------------------------------
type Palette = {
  name: string;
  bg: [string, string, string];
  red: string;
  blue: string;
  purple: string;
  cyan: string;
  pink: string;
};

const PALETTES = {
  classic: {
    name: 'Classic',
    bg: ['#1a1438', '#0d0820', '#05030f'],
    red: '#ff2a4a',
    blue: '#2a6fff',
    purple: '#a83cff',
    cyan: '#2affe0',
    pink: '#ff5a7a'
  },
  hellfire: {
    name: 'Hellfire',
    bg: ['#3a0a14', '#1a0410', '#080205'],
    red: '#ff1a2a',
    blue: '#ff6a3c',
    purple: '#c8003c',
    cyan: '#ffaa3c',
    pink: '#ff8a5a'
  },
  midnight: {
    name: 'Midnight',
    bg: ['#0a1a3a', '#04102a', '#020614'],
    red: '#5a8fff',
    blue: '#2a6fff',
    purple: '#6a3cff',
    cyan: '#2affe0',
    pink: '#7aafff'
  },
  toxic: {
    name: 'Toxic',
    bg: ['#0a2a1a', '#041a14', '#020a08'],
    red: '#ffaa00',
    blue: '#00ff8a',
    purple: '#aaff00',
    cyan: '#00ffaa',
    pink: '#ffea00'
  },
  vapor: {
    name: 'Vapor',
    bg: ['#2a0a3a', '#1a0428', '#0a0218'],
    red: '#ff3aaa',
    blue: '#3aaaff',
    purple: '#aa3aff',
    cyan: '#3affea',
    pink: '#ff5acf'
  }
} as const satisfies Record<string, Palette>;

type PaletteKey = keyof typeof PALETTES;

// --- PRNG -------------------------------------------------------------------
type Rng = {
  next: () => number;
  range: (a: number, b: number) => number;
  int: (a: number, b: number) => number;
  pick: <T>(arr: readonly T[]) => T;
};

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

const rng = (seed: number): Rng => {
  const r = mulberry32(seed);
  return {
    next: r,
    range: (a, b) => a + r() * (b - a),
    int: (a, b) => Math.floor(a + r() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(r() * arr.length)]
  };
};

// --- text fragments for ASCII overlay --------------------------------------
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
  'frame.drop = 0.042ms'
] as const;

// --- params ----------------------------------------------------------------
export interface GrungeParams {
  palette: PaletteKey;
  noiseIntensity: number;
  grainFrequency: number;
  distortion: number;
  distortionFreq: number;
  scanlineOpacity: number;
  glitchCount: number;
  splatterCount: number;
  asciiCount: number;
  showGrid: boolean;
  showCircuits: boolean;
  showCorners: boolean;
  showVignette: boolean;
  vignetteStrength: number;
  width: number;
  height: number;
}

const DEFAULTS: GrungeParams = {
  palette: Object.keys(PALETTES)[Math.floor(Math.random() * Object.keys(PALETTES).length)] as PaletteKey,
  noiseIntensity: 0.85,
  grainFrequency: 1.4,
  distortion: 22,
  distortionFreq: 0.012,
  scanlineOpacity: 0.28,
  glitchCount: 11,
  splatterCount: 3,
  asciiCount: 6,
  showGrid: true,
  showCircuits: true,
  showCorners: true,
  showVignette: true,
  vignetteStrength: 0.7,
  width: 1600,
  height: 900
};

// ============================================================================
//  Background SVG
// ============================================================================
interface GrungeSVGProps {
  params: GrungeParams;
  seed: number;
  /** When true, applies CSS animations to glitch/scan/orbs/crosshairs/ASCII. */
  animate?: boolean;
}

// Each entry: { dur } seconds and a negative `begin` offset so the orbs are
// already mid-loop at mount time (no synchronized "start" pop).
const ORB_TIMINGS: ReadonlyArray<{ dur: number; begin: number }> = [
  { dur: 70, begin: 0 },
  { dur: 95, begin: -12 },
  { dur: 55, begin: -28 },
  { dur: 110, begin: -6 },
  { dur: 80, begin: -45 },
];

// 4-keyframe drift path in viewBox units. Each value is a translate offset.
const ORB_DRIFT_VALUES = '0,0; 220,-160; -180,240; 300,120; -120,-260; 0,0';
const ORB_DRIFT_KEYTIMES = '0; 0.2; 0.45; 0.7; 0.9; 1';

function GrungeSVG({ params, seed, className, animate = true }: GrungeSVGProps & {className?: string}) {
  const {
    palette,
    noiseIntensity,
    grainFrequency,
    distortion,
    distortionFreq,
    scanlineOpacity,
    glitchCount,
    splatterCount,
    asciiCount,
    showGrid,
    showCircuits,
    showCorners,
    showVignette,
    vignetteStrength,
    width,
    height
  } = params;

  const p = PALETTES[palette] ?? PALETTES.classic;

  const random = useMemo(() => {
    const r = rng(seed);

    const orbs = Array.from({ length: 5 }).map((_, i) => {
      const colors = [p.purple, p.blue, p.red, p.cyan, p.purple];
      return {
        cx: r.range(80, width - 80),
        cy: r.range(80, height - 80),
        rx: r.range(260, 620),
        ry: r.range(200, 460),
        color: colors[i],
        opacity: r.range(0.7, 0.95)
      };
    });

    const splatters = Array.from({ length: splatterCount }).map(() => ({
      cx: r.range(40, width - 40),
      cy: r.range(40, height - 40),
      r: r.range(28, 80),
      color: r.pick([p.purple, p.red, p.blue, p.pink]),
      opacity: r.range(0.25, 0.5),
      shape: r.int(0, 1)
    }));

    const splashes = Array.from({ length: 3 }).map(() => {
      const cx = r.range(80, width - 80);
      const cy = r.range(80, height - 80);
      const color = r.pick([p.red, p.blue, p.purple, p.pink]);
      const dots = Array.from({ length: r.int(8, 14) }).map(() => ({
        cx: cx + r.range(-60, 60),
        cy: cy + r.range(-50, 50),
        r: r.range(0.5, 3.2),
        opacity: r.range(0.5, 0.95)
      }));
      return { color, dots };
    });

    const glitchBars = Array.from({ length: glitchCount }).map(() => ({
      x: r.range(0, width - 40),
      y: r.range(20, height - 20),
      w: r.range(60, 280),
      h: r.range(1, 5),
      color: r.pick([p.red, p.blue, p.purple, p.cyan, p.pink]),
      offsetColor: r.pick([p.cyan, p.pink, p.red]),
      doubled: r.next() > 0.5,
      opacity: r.range(0.7, 1)
    }));

    const tornShapes = Array.from({ length: 3 }).map(() => {
      const cx = r.range(120, width - 120);
      const cy = r.range(120, height - 120);
      const pts = Array.from({ length: r.int(5, 7) })
        .map((_, i, a) => {
          const ang = (i / a.length) * Math.PI * 2 + r.range(-0.3, 0.3);
          const rad = r.range(120, 260);
          return `${cx + Math.cos(ang) * rad},${cy + Math.sin(ang) * rad}`;
        })
        .join(' ');
      return {
        pts,
        color: r.pick([p.purple, p.red, p.blue]),
        opacity: r.range(0.3, 0.55)
      };
    });

    const asciiBlocks = Array.from({ length: asciiCount }).map(() => ({
      x: r.range(40, width - 280),
      y: r.range(40, height - 40),
      text: r.pick(HEX_FRAGMENTS),
      color: r.pick([p.blue, p.pink, p.purple, p.cyan]),
      opacity: r.range(0.35, 0.6)
    }));

    const crosshairs = Array.from({ length: 2 }).map(() => ({
      cx: r.range(120, width - 120),
      cy: r.range(120, height - 120),
      r: r.range(18, 28),
      color: r.pick([p.red, p.blue, p.pink])
    }));

    const dropouts = Array.from({ length: r.int(2, 5) }).map(() => ({
      y: r.range(0, height),
      h: r.range(1, 3)
    }));

    return {
      orbs,
      splatters,
      splashes,
      glitchBars,
      tornShapes,
      asciiBlocks,
      crosshairs,
      dropouts
    };
  }, [seed, palette, glitchCount, splatterCount, asciiCount, width, height, p]);

  // Unique ids per instance so multiple components don't clash on filters.
  // `useId()` is SSR-safe — produces the same value on server and client,
  // unlike `Math.random()` which mismatched and broke the `fill="url(#…)"`
  // references after hydration (orbs rendered transparent).
  const reactId = useId();
  const uid = `g${reactId.replace(/[^a-zA-Z0-9]/g, '')}`;

  const id = (k: string) => `${uid}_${k}`;

  return (
    <svg
      className={className}
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
      role="img"
      aria-label="Y2K tech grunge background"
    >
      <defs>
        <radialGradient id={id('bg')} cx="40%" cy="45%" r="80%">
          <stop offset="0%" stopColor={p.bg[0]} />
          <stop offset="45%" stopColor={p.bg[1]} />
          <stop offset="100%" stopColor={p.bg[2]} />
        </radialGradient>

        {random.orbs.map((o, i) => (
          <radialGradient
            key={i}
            id={id(`orb${i}`)}
            gradientUnits="userSpaceOnUse"
            cx={o.cx}
            cy={o.cy}
            r={Math.max(o.rx, o.ry)}
          >
            <stop offset="0%" stopColor={o.color} stopOpacity={o.opacity} />
            <stop offset="55%" stopColor={o.color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={o.color} stopOpacity="0" />
          </radialGradient>
        ))}

        <pattern
          id={id('scan')}
          x="0"
          y="0"
          width="3"
          height="3"
          patternUnits="userSpaceOnUse"
        >
          <rect width="3" height="1.5" fill="#000" opacity={scanlineOpacity} />
          {animate && (
            <animateTransform
              attributeName="patternTransform"
              attributeType="XML"
              type="translate"
              from="0 0"
              to="0 3"
              dur="0.18s"
              repeatCount="indefinite"
            />
          )}
        </pattern>

        <pattern
          id={id('dot')}
          x="0"
          y="0"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1" cy="1" r="0.6" fill="#fff" opacity="0.14" />
        </pattern>

        <pattern
          id={id('grid')}
          x="0"
          y="0"
          width="48"
          height="48"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 48 0 L 0 0 0 48"
            fill="none"
            stroke={p.blue}
            strokeWidth="0.4"
            opacity="0.2"
          />
        </pattern>

        <pattern
          id={id('grid2')}
          x="0"
          y="0"
          width="120"
          height="120"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 120 0 L 0 0 0 120"
            fill="none"
            stroke={p.purple}
            strokeWidth="0.6"
            opacity="0.22"
          />
        </pattern>

        <pattern
          id={id('circuit')}
          x="0"
          y="0"
          width="80"
          height="80"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 20 L30 20 L30 50 L60 50 L60 10 L80 10 M10 80 L10 60 L40 60 L40 40 L70 40 L70 70 L80 70"
            fill="none"
            stroke={p.blue}
            strokeWidth="0.6"
            opacity="0.35"
          />
          <circle cx="30" cy="20" r="1.5" fill={p.blue} opacity="0.5" />
          <circle cx="60" cy="50" r="1.5" fill={p.blue} opacity="0.5" />
          <circle cx="40" cy="40" r="1.5" fill={p.pink} opacity="0.5" />
        </pattern>

        <filter id={id('grain')} x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={grainFrequency}
            numOctaves="2"
            seed={seed % 100}
          />
          <feColorMatrix
            values={`0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 ${
              noiseIntensity * 0.5
            } 0`}
          />
        </filter>

        <filter id={id('chroma')} x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.45"
            numOctaves="3"
            seed={(seed + 21) % 200}
          />
          <feColorMatrix
            values={`0.9 0 0 0 -0.1
                     0 0.2 0 0 0
                     0 0 1.1 0 -0.1
                     0 0 0 ${noiseIntensity * 0.7} 0`}
          />
        </filter>

        <filter id={id('bands')} x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.005 0.9"
            numOctaves="2"
            seed={(seed + 7) % 200}
          />
          <feColorMatrix
            values={`1.2 0 0 0 -0.2
                     0 0.3 0 0 0
                     0 0 0.8 0 -0.1
                     0 0 0 ${noiseIntensity * 0.55} 0`}
          />
        </filter>

        <filter id={id('warp')} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={`${distortionFreq} ${distortionFreq * 3.5}`}
            numOctaves="2"
            seed={(seed + 5) % 200}
            result="warp"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="warp"
            scale={distortion}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        <filter id={id('warpTight')} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.08 0.2"
            numOctaves="1"
            seed={(seed + 11) % 200}
            result="warp"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="warp"
            scale={Math.min(distortion * 0.3, 12)}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        <filter id={id('blurSoft')}>
          <feGaussianBlur stdDeviation="1" />
        </filter>
        <filter id={id('blur2')}>
          <feGaussianBlur stdDeviation="3" />
        </filter>

        <radialGradient id={id('vig')} cx="50%" cy="50%" r="75%">
          <stop offset="60%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity={vignetteStrength} />
        </radialGradient>
      </defs>

      <rect data-name="background" width={width} height={height} fill={`url(#${id('bg')})`} />

      <g data-name="warp-layer" filter={`url(#${id('warp')})`}>
        <g data-name="orbs" style={{ mixBlendMode: 'screen' }}>
          {random.orbs.map((o, i) => {
            const { dur, begin } = ORB_TIMINGS[i] ?? ORB_TIMINGS[0];
            return (
              <ellipse
                key={i}
                data-name={`orb-${i}`}
                cx={o.cx}
                cy={o.cy}
                rx={o.rx}
                ry={o.ry}
                fill={`url(#${id(`orb${i}`)})`}
              >
                {animate && (
                  <animateTransform
                    attributeName="transform"
                    attributeType="XML"
                    type="translate"
                    values={ORB_DRIFT_VALUES}
                    keyTimes={ORB_DRIFT_KEYTIMES}
                    dur={`${dur}s`}
                    begin={`${begin}s`}
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines="0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1"
                  />
                )}
              </ellipse>
            );
          })}
        </g>

        {showGrid && (
          <>
            <rect
              data-name="grid-primary"
              width={width}
              height={height}
              fill={`url(#${id('grid')})`}
              style={{ mixBlendMode: 'screen' }}
            />
            <g
              data-name="grid-secondary"
              transform={`translate(40,30) rotate(-2 ${width / 2} ${height / 2})`}
              style={{ mixBlendMode: 'screen', opacity: 0.55 }}
            >
              <rect width={width} height={height} fill={`url(#${id('grid2')})`} />
            </g>
          </>
        )}

        {showCircuits && (
          <g data-name="circuits" style={{ mixBlendMode: 'screen' }}>
            <rect
              x="40"
              y={height * 0.55}
              width={width * 0.33}
              height={height * 0.38}
              fill={`url(#${id('circuit')})`}
              opacity="0.65"
            />
            <rect
              x={width * 0.64}
              y="60"
              width={width * 0.34}
              height={height * 0.36}
              fill={`url(#${id('circuit')})`}
              opacity="0.55"
              transform={`rotate(180 ${width * 0.81} ${height * 0.24})`}
            />
          </g>
        )}

        <g data-name="torn-shapes" style={{ mixBlendMode: 'screen' }}>
          {random.tornShapes.map((s, i) => (
            <polygon key={i} points={s.pts} fill={s.color} opacity={s.opacity} />
          ))}
        </g>
      </g>

      <g data-name="streak-bars-dark" style={{ mixBlendMode: 'multiply', opacity: 0.85 }}>
        <rect
          x="-200"
          y={height * 0.18}
          width={width + 400}
          height="14"
          fill="#000018"
          transform={`rotate(-8 ${width / 2} ${height * 0.185})`}
        />
        <rect
          x="-200"
          y={height * 0.8}
          width={width + 400}
          height="22"
          fill="#000010"
          transform={`rotate(-8 ${width / 2} ${height * 0.812})`}
        />
      </g>

      <g data-name="streaks-bright" style={{ mixBlendMode: 'screen' }} filter={`url(#${id('warpTight')})`}>
        <rect
          x="-100"
          y={height * 0.34}
          width={width + 200}
          height="3"
          fill={p.red}
          opacity="0.85"
          transform={`rotate(-6 ${width / 2} ${height * 0.341})`}
        />
        <rect
          x="-100"
          y={height * 0.6}
          width={width + 200}
          height="2"
          fill={p.blue}
          opacity="0.8"
          transform={`rotate(-6 ${width / 2} ${height * 0.601})`}
        />
        <rect
          x="-100"
          y={height * 0.67}
          width={width + 200}
          height="4"
          fill={p.purple}
          opacity="0.85"
          transform={`rotate(-6 ${width / 2} ${height * 0.672})`}
        />
      </g>

      <g data-name="splashes" style={{ mixBlendMode: 'screen' }} filter={`url(#${id('blurSoft')})`}>
        {random.splashes.map((s, i) => (
          <g key={i}>
            {s.dots.map((d, j) => (
              <circle
                key={j}
                cx={d.cx}
                cy={d.cy}
                r={d.r}
                fill={s.color}
                opacity={d.opacity}
              />
            ))}
          </g>
        ))}
      </g>

      <g data-name="splatters" style={{ mixBlendMode: 'screen' }}>
        {random.splatters.map((s, i) =>
          s.shape === 0 ? (
            <circle
              key={i}
              cx={s.cx}
              cy={s.cy}
              r={s.r}
              fill={s.color}
              opacity={s.opacity}
              filter={`url(#${id('blur2')})`}
            />
          ) : (
            <ellipse
              key={i}
              cx={s.cx}
              cy={s.cy}
              rx={s.r}
              ry={s.r * 0.6}
              fill={s.color}
              opacity={s.opacity}
              filter={`url(#${id('blur2')})`}
            />
          )
        )}
      </g>

      <g data-name="glitch-bars" style={{ mixBlendMode: 'screen' }} filter={`url(#${id('warpTight')})`}>
        {random.glitchBars.map((g, i) => (
          <g key={i}>
            <rect
              x={g.x}
              y={g.y}
              width={g.w}
              height={g.h}
              fill={g.color}
              opacity={g.opacity}
            />
            {g.doubled && (
              <rect
                x={g.x + 4}
                y={g.y}
                width={g.w}
                height={g.h}
                fill={g.offsetColor}
                opacity={g.opacity * 0.7}
              />
            )}
          </g>
        ))}
      </g>

      <rect
        data-name="vhs-bands"
        width={width}
        height={height}
        filter={`url(#${id('bands')})`}
        style={{ mixBlendMode: 'screen' }}
        opacity="0.55"
      />

      <g
        data-name="ascii-text"
        fontFamily="Courier New, monospace"
        style={{ mixBlendMode: 'screen' }}
        filter={`url(#${id('warpTight')})`}
      >
        {random.asciiBlocks.map((b, i) => (
          <text
            key={i}
            x={b.x}
            y={b.y}
            fontSize="11"
            fill={b.color}
            opacity={b.opacity}
          >
            {b.text}
          </text>
        ))}
      </g>

      {random.crosshairs.map((c, i) => (
        <g
          key={i}
          data-name={`crosshair-${i}`}
          stroke={c.color}
          strokeWidth="0.8"
          fill="none"
          opacity="0.75"
          style={{ mixBlendMode: 'screen' }}
        >
          <circle cx={c.cx} cy={c.cy} r={c.r} />
          <line x1={c.cx - c.r - 10} y1={c.cy} x2={c.cx - c.r + 5} y2={c.cy} />
          <line x1={c.cx + c.r - 5} y1={c.cy} x2={c.cx + c.r + 10} y2={c.cy} />
          <line x1={c.cx} y1={c.cy - c.r - 10} x2={c.cx} y2={c.cy - c.r + 5} />
          <line x1={c.cx} y1={c.cy + c.r - 5} x2={c.cx} y2={c.cy + c.r + 10} />
          {animate && (
            <animate
              attributeName="opacity"
              values="0.75; 0.4; 0.75"
              dur="4s"
              begin={`${i * 1.6}s`}
              repeatCount="indefinite"
            />
          )}
        </g>
      ))}

      {showCorners && (
        <g data-name="corner-brackets" stroke={p.cyan} strokeWidth="1" fill="none" opacity="0.7">
          <path d="M60 60 L60 40 L100 40" />
          <path d={`M${width - 60} 40 L${width - 40} 40 L${width - 40} 80`} />
          <path d={`M60 ${height - 60} L60 ${height - 40} L100 ${height - 40}`} />
          <path
            d={`M${width - 60} ${height - 40} L${width - 40} ${height - 40} L${width - 40} ${height - 80}`}
          />
        </g>
      )}

      <rect
        data-name="dot-matrix"
        width={width}
        height={height}
        fill={`url(#${id('dot')})`}
        style={{ mixBlendMode: 'screen' }}
      />

      <rect
        data-name="chroma-noise-multiply"
        width={width}
        height={height}
        filter={`url(#${id('chroma')})`}
        style={{ mixBlendMode: 'multiply' }}
        opacity="0.6"
      />
      <rect
        data-name="chroma-noise-screen"
        width={width}
        height={height}
        filter={`url(#${id('chroma')})`}
        style={{ mixBlendMode: 'screen' }}
        opacity="0.55"
      />
      <rect
        data-name="grain"
        width={width}
        height={height}
        filter={`url(#${id('grain')})`}
        style={{ mixBlendMode: 'screen' }}
      />

      <rect
        data-name="scanlines"
        width={width}
        height={height}
        fill={`url(#${id('scan')})`}
        style={{ mixBlendMode: 'multiply' }}
      />

      <g data-name="tape-dropouts" style={{ mixBlendMode: 'multiply' }} opacity="0.7">
        {random.dropouts.map((d, i) => (
          <rect key={i} x="0" y={d.y} width={width} height={d.h} fill="#000" />
        ))}
      </g>

      {showVignette && (
        <rect data-name="vignette" width={width} height={height} fill={`url(#${id('vig')})`} />
      )}
    </svg>
  );
}

// ============================================================================
//  Public API — background only, no controls
// ============================================================================
interface GrungeBackgroundProps extends Partial<GrungeParams> {
  /** Fixed seed. Defaults to a stable random value per mount. */
  seed?: number;
  /** Toggle CSS animations on the SVG. Defaults to true. */
  animate?: boolean;
}

/**
 * Full-viewport grunge background. Override any of the DEFAULTS via props.
 */
export default function GrungeBackground({
                                           seed,
                                           animate = true,
                                           ...overrides
                                         }: GrungeBackgroundProps = {}) {
  const stableSeed = useMemo(
    () => seed ?? Math.floor(Math.random() * 1e9),
    [seed]
  );
  const params: GrungeParams = { ...DEFAULTS, ...overrides };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        background: '#05030f'
      }}
    >
      <div
        data-grunge-svg="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%'
        }}
      >
        <GrungeSVG params={params} seed={stableSeed} animate={animate} />
      </div>
    </div>
  );
}

/**
 * Bare SVG variant — drop into an existing relatively-positioned container.
 */
export function GrungeBackgroundOnly({
                                       seed = 42 * Math.random(),
                                       width = 1600,
                                       height = 900,
                                       className,
                                       animate = true,
                                       ...overrides
                                     }: Partial<GrungeParams> & { seed?: number, className?:string, animate?: boolean } = {}) {
  const params: GrungeParams = { ...DEFAULTS, width, height, ...overrides };
  return <GrungeSVG params={params} seed={seed} className={className} animate={animate} />;
}
