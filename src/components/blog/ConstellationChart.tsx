import "./ConstellationChart.css";
import React from "react";

/*
 * A star chart, not a tile: six invented constellations drawn to real
 * star-atlas conventions (5-8 stars, chain/tree figures plus one closed
 * crown, magnitude-coded glyphs). The dot-plus-ring glyph is also a PCB
 * via, the one quiet bridge back to the circuit board this replaces.
 * By night it lives (aurora wash, twinkle, shooting stars); by day it is
 * a printed lapis chart. The bio text rectangle stays free of figures.
 * The plate furniture (frame, graticule, gilt ecliptic, boundary
 * meanders, Old Norse labels, magnitude legend) is static and painted
 * under the star layers, Harmonia Macrocosmica style.
 */

interface ChartStar {
  x: number;
  y: number;
  mag: 1 | 2 | 3;
  twinkle?: boolean;
  glint?: boolean;
}

interface ChartFigure {
  stars: ChartStar[];
  links: [number, number][];
}

interface ChartLabel {
  ink?: number;
  rotate?: boolean;
  text: string;
  x: number;
  y: number;
}

const FIGURES: ChartFigure[] = [
  /* The Lantern (upper left showpiece) */
  {
    links: [
      [0, 1],
      [1, 2],
      [1, 3],
      [3, 4],
      [3, 5],
      [2, 6],
    ],
    stars: [
      { mag: 2, twinkle: true, x: 58, y: 52 },
      { glint: true, mag: 1, x: 92, y: 74 },
      { mag: 3, x: 126, y: 60 },
      { mag: 2, x: 104, y: 112 },
      { mag: 3, x: 70, y: 138 },
      { mag: 3, twinkle: true, x: 132, y: 148 },
      { mag: 3, x: 150, y: 96 },
    ],
  },
  /* The Oar (upper right showpiece) */
  {
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [1, 5],
    ],
    stars: [
      { mag: 3, x: 206, y: 36 },
      { mag: 2, x: 232, y: 58 },
      { glint: true, mag: 1, x: 262, y: 52 },
      { mag: 2, x: 288, y: 78 },
      { mag: 3, twinkle: true, x: 276, y: 118 },
      { mag: 3, x: 244, y: 98 },
    ],
  },
  /* The Crown (left edge, the one closed cycle) */
  {
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 0],
    ],
    stars: [
      { mag: 3, x: 14, y: 246 },
      { mag: 2, twinkle: true, x: 34, y: 262 },
      { mag: 3, x: 30, y: 296 },
      { mag: 3, x: 10, y: 304 },
      { mag: 3, x: 4, y: 272 },
    ],
  },
  /* The Reed (right edge chain) */
  {
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
    stars: [
      { mag: 3, x: 306, y: 222 },
      { mag: 2, x: 296, y: 258 },
      { mag: 3, twinkle: true, x: 308, y: 296 },
      { mag: 3, x: 298, y: 338 },
      { mag: 3, x: 310, y: 378 },
    ],
  },
  /* The Hearth (lower left) */
  {
    links: [
      [0, 1],
      [1, 2],
      [1, 3],
      [3, 4],
      [3, 5],
    ],
    stars: [
      { mag: 2, x: 52, y: 498 },
      { mag: 3, x: 84, y: 516 },
      { mag: 2, twinkle: true, x: 118, y: 504 },
      { mag: 3, x: 96, y: 552 },
      { mag: 3, twinkle: true, x: 64, y: 584 },
      { mag: 3, x: 128, y: 572 },
    ],
  },
  /* The Long Walk (lower right) */
  {
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
    ],
    stars: [
      { mag: 3, x: 180, y: 502 },
      { mag: 2, x: 212, y: 514 },
      { mag: 3, x: 244, y: 506 },
      { mag: 1, x: 272, y: 528 },
      { mag: 3, x: 292, y: 562 },
      { mag: 2, twinkle: true, x: 266, y: 586 },
      { mag: 3, x: 232, y: 600 },
      { mag: 3, x: 206, y: 578 },
    ],
  },
];

/* Seeded-jitter output, hardcoded so the sky never reshuffles */
const FIELD_STARS = [
  { r: 1.3, x: 29.7, y: 32.9 },
  { r: 1.2, x: 87.4, y: 43.3 },
  { r: 0.8, twinkle: true, x: 134.1, y: 16.4 },
  { r: 1.4, x: 176.4, y: 22.5 },
  { r: 1, x: 247.9, y: 39.7 },
  { r: 1.3, x: 284.2, y: 14.3 },
  { r: 1.1, x: 39.7, y: 111.2 },
  { r: 0.8, x: 71.8, y: 111.3 },
  { r: 1.3, twinkle: true, x: 143.3, y: 116.8 },
  { r: 1.2, x: 172.3, y: 88.7 },
  { r: 1.1, x: 223.4, y: 85.7 },
  { r: 1.1, x: 303.4, y: 85.8 },
  { r: 1.1, x: 8.1, y: 163.5 },
  { r: 1.3, x: 85.7, y: 169.1 },
  { r: 1.3, x: 145, y: 147.9 },
  { r: 0.8, x: 252.9, y: 150.6 },
  { r: 0.9, twinkle: true, x: 292.9, y: 138.8 },
  { r: 1.1, x: 305.1, y: 211.5 },
  { r: 0.9, x: 10.7, y: 266.8 },
  { r: 0.9, x: 296.9, y: 335.2 },
  { r: 1.4, x: 43.5, y: 458.9 },
  { r: 1.2, x: 96.3, y: 484.9 },
  { r: 1.1, x: 134.2, y: 478.2 },
  { r: 0.9, x: 176.7, y: 467.4 },
  { r: 1.2, twinkle: true, x: 233.7, y: 502 },
  { r: 1, x: 283.3, y: 489.1 },
  { r: 1, x: 34.4, y: 561.3 },
  { r: 1.3, x: 63.7, y: 546.1 },
  { r: 1.3, x: 138.6, y: 532.4 },
  { r: 0.8, x: 203.1, y: 529.2 },
  { r: 1.1, twinkle: true, x: 230.4, y: 529.7 },
  { r: 1, x: 283.7, y: 556.1 },
  { r: 1, x: 10.1, y: 594.6 },
  { r: 0.8, x: 63, y: 622.3 },
  { r: 1.2, x: 147.3, y: 588.8 },
  { r: 1, twinkle: true, x: 175.2, y: 620.5 },
  { r: 1.1, x: 235.5, y: 610.2 },
  { r: 1.2, x: 300.5, y: 617.9 },
];

/* Inside the bio text rectangle: field stars only, extra quiet */
const FIELD_STARS_QUIET = [
  { r: 0.9, x: 184, y: 178.7 },
  { r: 1, x: 43, y: 212.4 },
  { r: 1.2, x: 84.3, y: 234.4 },
  { r: 1.2, x: 144.8, y: 228.8 },
  { r: 0.8, x: 171.3, y: 213.7 },
  { r: 0.9, x: 254.9, y: 245.3 },
  { r: 1.4, x: 74.6, y: 289.9 },
  { r: 1, x: 130.5, y: 282.6 },
  { r: 0.8, x: 191.5, y: 284.2 },
  { r: 1.3, x: 249.6, y: 285 },
  { r: 1.1, x: 281, y: 296.2 },
  { r: 1.1, x: 36.5, y: 357.8 },
  { r: 0.8, x: 76.9, y: 340.1 },
  { r: 1, x: 127, y: 353.8 },
  { r: 1.2, x: 204.9, y: 366.5 },
  { r: 1.2, x: 225, y: 372.3 },
  { r: 1.1, x: 39, y: 423.6 },
  { r: 1.3, x: 90.5, y: 422.4 },
  { r: 1.1, x: 127.2, y: 399.3 },
  { r: 1, x: 170.5, y: 434.1 },
  { r: 0.8, x: 247.8, y: 416.4 },
  { r: 1.1, x: 278.1, y: 417.7 },
];

/* Depth tail: near-subpixel stars, seeded like the arrays above */
const TAIL_STARS = [
  { r: 0.6, x: 22, y: 36 },
  { r: 0.5, x: 74, y: 24 },
  { r: 0.65, x: 118, y: 44 },
  { r: 0.45, x: 156, y: 30 },
  { r: 0.55, x: 196, y: 58 },
  { r: 0.6, x: 228, y: 22 },
  { r: 0.5, x: 262, y: 90 },
  { r: 0.65, x: 300, y: 50 },
  { r: 0.5, x: 36, y: 84 },
  { r: 0.6, x: 132, y: 86 },
  { r: 0.45, x: 208, y: 120 },
  { r: 0.55, x: 288, y: 132 },
  { r: 0.6, x: 18, y: 140 },
  { r: 0.5, x: 96, y: 152 },
  { r: 0.65, x: 246, y: 160 },
  { quiet: true, r: 0.5, x: 58, y: 196 },
  { quiet: true, r: 0.6, x: 150, y: 206 },
  { quiet: true, r: 0.45, x: 262, y: 222 },
  { quiet: true, r: 0.55, x: 96, y: 262 },
  { quiet: true, r: 0.5, x: 204, y: 300 },
  { quiet: true, r: 0.6, x: 42, y: 332 },
  { quiet: true, r: 0.45, x: 168, y: 352 },
  { quiet: true, r: 0.55, x: 232, y: 424 },
  { r: 0.6, x: 30, y: 470 },
  { r: 0.5, x: 142, y: 462 },
  { r: 0.65, x: 254, y: 470 },
  { r: 0.55, x: 70, y: 606 },
  { r: 0.6, x: 186, y: 610 },
];

/* Shooting stars, routed through the figure-free corridors */
const COMETS = [
  { delay: 0, hue: "var(--aurora-a)", points: "336,-16 40,200" },
  { delay: 5.7, hue: "var(--aurora-b)", points: "-24,452 336,636" },
  { delay: 11.3, hue: "var(--aurora-c)", points: "324,168 292,432" },
];

const COMET_LAYERS = ["halo", "trail", "head"];

/* Inside-edge rail ticks every 40px, both rails of the plate frame */
const TICK_YS = Array.from({ length: 15 }, (_, index) => 49 + index * 40);

/* Graticule: 3 right-ascension and 2 declination arcs, gently swept */
const GRATICULE = [
  "M 84 12 A 900 900 0 0 1 70 630",
  "M 162 11 A 1200 1200 0 0 1 152 630",
  "M 238 12 A 900 900 0 0 0 252 630",
  "M 11 150 A 800 800 0 0 0 309 142",
  "M 11 460 A 800 800 0 0 1 309 452",
];

/* One gilt ecliptic sweep; the middle segment skirts the bio text
   rectangle at reduced ink so the quiet zone stays quiet */
const ECLIPTIC = [
  { d: "M 12 118 C 60 140 90 152 118 168" },
  { d: "M 118 168 C 180 202 226 330 258 434", quiet: true },
  { d: "M 258 434 C 274 482 292 520 310 556" },
];

/* Boundary meanders around the two showpiece figures only */
const BOUNDARIES = [
  "M 40 48 L 62 46 L 64 28 L 120 26 L 122 42 L 158 44 L 160 76 L 168 78 L 166 130 L 146 132 L 144 158 L 100 160 L 56 158 L 54 118 L 42 116 Z",
  "M 196 30 L 240 28 L 242 16 L 286 14 L 288 30 L 306 32 L 304 88 L 296 90 L 298 128 L 250 130 L 248 138 L 210 136 L 208 96 L 198 94 Z",
];

/* Old Norse figure names; the top-third pair survives the wide-card
   crop. One label per third of the chart inks up (ink is the delay). */
const LABELS: ChartLabel[] = [
  { ink: 0, text: "LJÓSKER", x: 48, y: 168 },
  { text: "ÁR", x: 216, y: 150 },
  { ink: 8, rotate: true, text: "SVEIGR", x: 22, y: 316 },
  { rotate: true, text: "SEF", x: 304, y: 186 },
  { text: "ARINN", x: 44, y: 486 },
  { ink: 16, text: "GANGLERI", x: 172, y: 494 },
];

const CORE_RADIUS = { 1: 2.2, 2: 1.6, 3: 1.2 } as const;
const RING_RADIUS = { 1: 4.5, 2: 3.2 } as const;

/* Atlas convention: figure lines stop short of the glyphs they join */
const LINK_CLEARANCE = 2;

const glyphRadius = (star: ChartStar) =>
  (star.mag < 3 ? RING_RADIUS[star.mag as 1 | 2] : CORE_RADIUS[3]) +
  LINK_CLEARANCE;

const trimLink = (a: ChartStar, b: ChartStar) => {
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const ux = (b.x - a.x) / length;
  const uy = (b.y - a.y) / length;
  const round = (value: number) => Math.round(value * 100) / 100;

  return {
    x1: round(a.x + ux * glyphRadius(a)),
    y1: round(a.y + uy * glyphRadius(a)),
    x2: round(b.x - ux * glyphRadius(b)),
    y2: round(b.y - uy * glyphRadius(b)),
  };
};

const StarGlyph = ({ index, star }: { index: number; star: ChartStar }) => (
  <g
    transform={`translate(${star.x} ${star.y})`}
    className={[
      "chart-star",
      star.twinkle ? "chart-twinkle" : "",
      star.glint ? "chart-glint" : "",
    ]
      .filter(Boolean)
      .join(" ")}
    style={
      {
        "--chart-twinkle-delay": `${(index * 1.7) % 9}s`,
      } as React.CSSProperties
    }
  >
    <circle r={CORE_RADIUS[star.mag]} className="chart-star-core" />
    {star.mag < 3 && (
      <circle
        r={RING_RADIUS[star.mag as 1 | 2]}
        className={
          star.mag === 1
            ? "chart-star-ring chart-star-ring--mag1"
            : "chart-star-ring"
        }
      />
    )}
    {star.mag === 1 && (
      <>
        <line x1="5.2" y1="0" x2="9" y2="0" className="chart-star-tick" />
        <line x1="-5.2" y1="0" x2="-9" y2="0" className="chart-star-tick" />
        <line x1="0" y1="5.2" x2="0" y2="9" className="chart-star-tick" />
        <line x1="0" y1="-5.2" x2="0" y2="-9" className="chart-star-tick" />
      </>
    )}
  </g>
);

const ConstellationChart = (props: React.ComponentProps<"svg">) => {
  return (
    <svg
      id="constellation-chart"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 640"
      preserveAspectRatio="xMidYMin slice"
      width="100%"
      height="100%"
      aria-hidden
      {...props}
    >
      <defs>
        <radialGradient id="chart-wash-a">
          <stop offset="0%" stopColor="var(--aurora-a)" stopOpacity="0.14" />
          <stop offset="100%" stopColor="var(--aurora-a)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="chart-wash-b">
          <stop offset="0%" stopColor="var(--aurora-b)" stopOpacity="0.11" />
          <stop offset="100%" stopColor="var(--aurora-b)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="chart-wash-c">
          <stop offset="0%" stopColor="var(--aurora-c)" stopOpacity="0.09" />
          <stop offset="100%" stopColor="var(--aurora-c)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse
        className="chart-wash"
        cx="90"
        cy="110"
        rx="150"
        ry="100"
        fill="url(#chart-wash-a)"
      />
      <ellipse
        className="chart-wash"
        cx="250"
        cy="70"
        rx="130"
        ry="90"
        fill="url(#chart-wash-b)"
        style={{ "--chart-wash-delay": "6s" } as React.CSSProperties}
      />
      <ellipse
        className="chart-wash"
        cx="250"
        cy="540"
        rx="140"
        ry="100"
        fill="url(#chart-wash-c)"
        style={{ "--chart-wash-delay": "12s" } as React.CSSProperties}
      />

      <rect
        className="chart-frame"
        x="9"
        y="9"
        width="302"
        height="622"
        rx="1"
      />
      {TICK_YS.map((y) => (
        <React.Fragment key={y}>
          <line className="chart-frame-tick" x1="9" y1={y} x2="12" y2={y} />
          <line className="chart-frame-tick" x1="311" y1={y} x2="308" y2={y} />
        </React.Fragment>
      ))}
      {GRATICULE.map((d) => (
        <path key={d} className="chart-graticule" d={d} />
      ))}
      {ECLIPTIC.map((segment) => (
        <path
          key={segment.d}
          className={
            segment.quiet
              ? "chart-ecliptic chart-ecliptic--quiet"
              : "chart-ecliptic"
          }
          d={segment.d}
        />
      ))}
      {BOUNDARIES.map((d) => (
        <path key={d} className="chart-boundary" d={d} />
      ))}
      {LABELS.map((label) => (
        <text
          key={label.text}
          x={label.x}
          y={label.y}
          transform={
            label.rotate ? `rotate(90 ${label.x} ${label.y})` : undefined
          }
          className={
            label.ink === undefined
              ? "chart-label"
              : "chart-label chart-label--ink"
          }
          style={
            label.ink === undefined
              ? undefined
              : ({
                  "--chart-ink-delay": `${label.ink}s`,
                } as React.CSSProperties)
          }
        >
          {label.text}
        </text>
      ))}
      <g className="chart-legend">
        <g transform="translate(24 612)">
          <circle r={CORE_RADIUS[1]} className="chart-legend-core" />
          <circle r={RING_RADIUS[1]} className="chart-legend-ring" />
          <line x1="5.2" y1="0" x2="8" y2="0" />
          <line x1="-5.2" y1="0" x2="-8" y2="0" />
          <line x1="0" y1="5.2" x2="0" y2="8" />
          <line x1="0" y1="-5.2" x2="0" y2="-8" />
        </g>
        <g transform="translate(48 612)">
          <circle r={CORE_RADIUS[2]} className="chart-legend-core" />
          <circle r={RING_RADIUS[2]} className="chart-legend-ring" />
        </g>
        <circle
          cx="64"
          cy="612"
          r={CORE_RADIUS[3]}
          className="chart-legend-core"
        />
        <text x="76" y="614.5" className="chart-legend-text">
          MAG · I II III
        </text>
      </g>

      {FIGURES.map((figure, figureIndex) => (
        <g key={figureIndex}>
          {figure.links.map(([from, to], linkIndex) => (
            <line
              key={linkIndex}
              className="chart-figure"
              {...trimLink(figure.stars[from], figure.stars[to])}
            />
          ))}
          {figure.stars.map((star, starIndex) => (
            <StarGlyph
              key={starIndex}
              star={star}
              index={figureIndex * 3 + starIndex}
            />
          ))}
        </g>
      ))}

      <g className="chart-field">
        {FIELD_STARS.map((star, index) => (
          <circle
            key={index}
            cx={star.x}
            cy={star.y}
            r={star.r}
            className={star.twinkle ? "chart-twinkle" : undefined}
            style={
              star.twinkle
                ? ({
                    "--chart-twinkle-delay": `${(index * 2.3) % 9}s`,
                  } as React.CSSProperties)
                : undefined
            }
          />
        ))}
      </g>
      <g className="chart-field chart-field--quiet">
        {FIELD_STARS_QUIET.map((star, index) => (
          <circle key={index} cx={star.x} cy={star.y} r={star.r} />
        ))}
      </g>
      <g className="chart-tail">
        {TAIL_STARS.map((star, index) => (
          <circle
            key={index}
            cx={star.x}
            cy={star.y}
            r={star.r}
            className={star.quiet ? "chart-tail--quiet" : undefined}
          />
        ))}
      </g>

      {COMET_LAYERS.map((layer) => (
        <g key={layer} className={`chart-comet-layer chart-comet--${layer}`}>
          {COMETS.map((comet, index) => (
            <polyline
              key={index}
              className="chart-comet"
              points={comet.points}
              style={
                {
                  "--comet-color": comet.hue,
                  "--comet-delay": `${comet.delay}s`,
                } as React.CSSProperties
              }
            />
          ))}
        </g>
      ))}
    </svg>
  );
};

export default ConstellationChart;
