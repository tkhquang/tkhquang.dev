import { MarkdownPost } from "@/models/markdown.types";
import { toRoman } from "@/utils/roman";
import { format } from "date-fns";
import Link from "next/link";
import { Fragment } from "react";

/*
 * Plate 404, "The Lost Star": the approved demo ported one to one. An
 * engraved celestial plate in the ConstellationChart grammar: double-rule
 * frame with graduated edges and roman coordinate numerals, the six house
 * constellations re-laid for this sheet, a deterministic 240-star field
 * (mulberry32, seed 404, rejection zones for the furniture), aurora
 * washes and twinkle by night, still lapis ink on dawn paper by day, and
 * the gilt survey reticle around the empty patch at RA 04h 04m. The
 * archive link rides the reticle's annotation: the one action a lost
 * reader needs without scrolling. Everything renders on the server.
 */

const VIEW_W = 1280;
const VIEW_H = 720;

/* House glyph metrics, from ConstellationChart */
const CORE: Record<number, number> = { 1: 2.2, 2: 1.6, 3: 1.2 };
const RING: Record<number, number> = { 1: 4.5, 2: 3.2 };
const CLEAR = 2;
const glyphRadius = (magnitude: number) =>
  (magnitude < 3 ? RING[magnitude] : CORE[3]) + CLEAR;

/* mulberry32: the same seed prints the same plate on every build */
function mulberry32(seed: number) {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type FigureStar = [number, number, number];
interface Figure {
  label: [string, number, number, number?];
  links: [number, number][];
  stars: FigureStar[];
}

/* The six house constellations, re-laid for the 1280 x 720 sheet */
const FIGURES: Figure[] = [
  {
    label: ["LJÓSKER", 166, 296],
    links: [
      [0, 1],
      [1, 2],
      [1, 3],
      [3, 4],
      [3, 5],
      [2, 6],
    ],
    stars: [
      [165, 115, 2],
      [222, 152, 1],
      [280, 128, 3],
      [242, 212, 2],
      [185, 260, 3],
      [290, 278, 3],
      [320, 190, 3],
    ],
  },
  {
    label: ["ÁR", 1044, 272],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [1, 5],
    ],
    stars: [
      [965, 105, 3],
      [1010, 140, 2],
      [1062, 130, 1],
      [1108, 172, 2],
      [1088, 238, 3],
      [1032, 205, 3],
    ],
  },
  {
    label: ["SVEIGR", 74, 502],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 0],
    ],
    stars: [
      [108, 392, 3],
      [142, 412, 2],
      [136, 462, 3],
      [102, 472, 3],
      [88, 428, 3],
    ],
  },
  {
    label: ["SEF", 1214, 428, 90],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
    stars: [
      [1188, 380, 3],
      [1176, 420, 2],
      [1190, 462, 3],
      [1178, 508, 3],
      [1192, 552, 3],
    ],
  },
  {
    label: ["ARINN", 764, 642],
    links: [
      [0, 1],
      [1, 2],
      [1, 3],
      [3, 4],
      [3, 5],
    ],
    stars: [
      [766, 530, 2],
      [806, 550, 3],
      [848, 536, 2],
      [822, 584, 3],
      [782, 614, 3],
      [858, 606, 3],
    ],
  },
  {
    label: ["GANGLERI", 382, 669],
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
      [390, 548, 3],
      [428, 562, 2],
      [466, 552, 3],
      [498, 576, 1],
      [520, 606, 3],
      [492, 628, 2],
      [452, 638, 3],
      [420, 616, 3],
    ],
  },
];

/* No twinkle anywhere on this plate: three dozen looping SVG opacity
   animations repainted the full-viewport sheet continuously and sank
   performance; the engraved plate is deliberately STILL in both themes */
const Glyph = ({
  magnitude,
  x,
  y,
}: {
  x: number;
  y: number;
  magnitude: number;
}) => (
  <g transform={`translate(${x} ${y})`} className="chart-star">
    <circle r={CORE[magnitude]} />
    {magnitude < 3 && (
      <circle
        r={RING[magnitude]}
        className={
          magnitude === 1
            ? "chart-star-ring chart-star-ring--mag1"
            : "chart-star-ring"
        }
      />
    )}
    {magnitude === 1 &&
      (
        [
          [5.2, 0, 9, 0],
          [-5.2, 0, -9, 0],
          [0, 5.2, 0, 9],
          [0, -5.2, 0, -9],
        ] as const
      ).map((tick, index) => (
        <line
          key={index}
          x1={tick[0]}
          y1={tick[1]}
          x2={tick[2]}
          y2={tick[3]}
          className="chart-star-tick"
        />
      ))}
  </g>
);

/* ---- Build-time layers ---- */

function buildGraduation() {
  const ticks: React.ReactNode[] = [];
  for (let t = 0; t <= 32; t++) {
    const x = 42 + t * 37.375;
    const len = t % 4 === 0 ? 12 : t % 2 === 0 ? 7 : 4;
    ticks.push(
      <Fragment key={`ra-${t}`}>
        <line x1={x} y1={42 - len} x2={x} y2={42} className="plate-tick" />
        <line x1={x} y1={678} x2={x} y2={678 + len} className="plate-tick" />
        {t % 4 === 0 && 8 - t / 4 >= 1 && 8 - t / 4 <= 7 && (
          <>
            <text x={x} y={22} className="plate-num" textAnchor="middle">
              {toRoman(8 - t / 4)}
            </text>
            {8 - t / 4 !== 7 && 8 - t / 4 !== 1 && (
              <text x={x} y={712} className="plate-num" textAnchor="middle">
                {toRoman(8 - t / 4)}
              </text>
            )}
          </>
        )}
      </Fragment>
    );
  }
  for (let s = 0; s <= 24; s++) {
    const y = 42 + s * 26.5;
    const deg = 24 - 2 * s;
    const major = deg % 10 === 0;
    const len = major ? 12 : 4;
    ticks.push(
      <Fragment key={`dec-${s}`}>
        <line x1={42 - len} y1={y} x2={42} y2={y} className="plate-tick" />
        <line x1={1238} y1={y} x2={1238 + len} y2={y} className="plate-tick" />
        {major && Math.abs(deg) <= 20 && (
          <>
            <text x={26} y={y + 3.5} className="plate-num" textAnchor="end">
              {(deg > 0 ? "+" : "") + deg}
            </text>
            <text x={1254} y={y + 3.5} className="plate-num">
              {(deg > 0 ? "+" : "") + deg}
            </text>
          </>
        )}
      </Fragment>
    );
  }
  return ticks;
}

function buildSky() {
  const placed: [number, number][] = [];
  const figures: React.ReactNode[] = [];

  FIGURES.forEach((figure, figureIndex) => {
    figure.links.forEach(([from, to], linkIndex) => {
      const a = figure.stars[from];
      const b = figure.stars[to];
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const ux = (b[0] - a[0]) / length;
      const uy = (b[1] - a[1]) / length;
      figures.push(
        <line
          key={`f${figureIndex}-l${linkIndex}`}
          x1={(a[0] + ux * glyphRadius(a[2])).toFixed(2)}
          y1={(a[1] + uy * glyphRadius(a[2])).toFixed(2)}
          x2={(b[0] - ux * glyphRadius(b[2])).toFixed(2)}
          y2={(b[1] - uy * glyphRadius(b[2])).toFixed(2)}
          className="chart-figure"
        />
      );
    });
    figure.stars.forEach((star, starIndex) => {
      figures.push(
        <Glyph
          key={`f${figureIndex}-s${starIndex}`}
          x={star[0]}
          y={star[1]}
          magnitude={star[2]}
        />
      );
      placed.push([star[0], star[1]]);
    });
    const [text, lx, ly, rotate] = figure.label;
    figures.push(
      <text
        key={`f${figureIndex}-label`}
        x={lx}
        y={ly}
        className="chart-label"
        transform={rotate ? `rotate(${rotate} ${lx} ${ly})` : undefined}
      >
        {text}
      </text>
    );
  });

  /* The seeded field, with rejection zones for the furniture */
  const random = mulberry32(404);
  const isClear = (x: number, y: number) => {
    if (x < 52 || x > 1228 || y < 52 || y > 668) return false;
    if (Math.hypot(x - 630, y - 306) < 88) return false; /* the empty patch */
    if (x > 56 && x < 344 && y > 526 && y < 676) return false; /* cartouche */
    if (x > 926 && y > 628) return false; /* legend */
    if (x > 696 && x < 1072 && y > 434 && y < 500) return false; /* annotation */
    return true;
  };
  const nearPlaced = (x: number, y: number, distance: number) =>
    placed.some(([px, py]) => Math.hypot(x - px, y - py) < distance);

  const glyphs: React.ReactNode[] = [];
  const field: React.ReactNode[] = [];
  const tail: React.ReactNode[] = [];
  let made = 0;
  let guard = 0;
  while (made < 240 && guard < 7000) {
    guard++;
    const x = 52 + random() * 1176;
    const y = 52 + random() * 616;
    if (!isClear(x, y)) continue;
    const roll = random();
    if (roll < 0.28) {
      const magnitude = roll < 0.025 ? 1 : roll < 0.1 ? 2 : 3;
      if (nearPlaced(x, y, 22)) continue;
      glyphs.push(
        <Glyph
          key={`g${made}`}
          x={+x.toFixed(1)}
          y={+y.toFixed(1)}
          magnitude={magnitude}
        />
      );
      placed.push([x, y]);
    } else {
      if (nearPlaced(x, y, 8)) continue;
      const r = 0.5 + random() * 0.95;
      const dot = (
        <circle
          key={`d${made}`}
          cx={x.toFixed(1)}
          cy={y.toFixed(1)}
          r={r.toFixed(2)}
        />
      );
      (r < 0.8 ? tail : field).push(dot);
    }
    made++;
  }

  return { figures, glyphs, field, tail };
}

const GRADUATION = buildGraduation();
const SKY = buildSky();

const LostFolio = ({ newest }: { newest: MarkdownPost[] }) => (
  <>
    <section className="plate-wrap">
      <svg
        className="p404"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label="Celestial atlas plate 404: the surveyed patch at this address is empty"
      >
        <defs>
          <radialGradient id="p404-wash-a">
            <stop offset="0%" stopColor="var(--aurora-a)" stopOpacity="0.14" />
            <stop offset="100%" stopColor="var(--aurora-a)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="p404-wash-b">
            <stop offset="0%" stopColor="var(--aurora-b)" stopOpacity="0.11" />
            <stop offset="100%" stopColor="var(--aurora-b)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="p404-wash-c">
            <stop offset="0%" stopColor="var(--aurora-c)" stopOpacity="0.09" />
            <stop offset="100%" stopColor="var(--aurora-c)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse
          className="chart-wash"
          cx="300"
          cy="190"
          rx="260"
          ry="150"
          fill="url(#p404-wash-a)"
        />
        <ellipse
          className="chart-wash"
          cx="1010"
          cy="170"
          rx="240"
          ry="140"
          fill="url(#p404-wash-b)"
        />
        <ellipse
          className="chart-wash"
          cx="840"
          cy="560"
          rx="260"
          ry="140"
          fill="url(#p404-wash-c)"
        />

        <rect className="plate-rule-outer" x="30" y="30" width="1220" height="660" />
        <rect className="plate-rule-inner" x="42" y="42" width="1196" height="636" />

        <g>{GRADUATION}</g>

        <text className="plate-cap" x="42" y="22">
          R.A. IN HOURS
        </text>
        <text className="plate-cap" x="1238" y="22" textAnchor="end">
          DECL. IN DEGREES
        </text>
        <text className="plate-cap" x="42" y="712">
          LJÓSS ATLAS · VOL. VII
        </text>
        <text className="plate-cap" x="1238" y="712" textAnchor="end">
          THE LAMPLIGHT LIBRARY
        </text>

        <path className="plate-register" d="M 50 60 L 50 50 L 60 50" />
        <path className="plate-register" d="M 1220 50 L 1230 50 L 1230 60" />
        <path className="plate-register" d="M 1230 660 L 1230 670 L 1220 670" />
        <path className="plate-register" d="M 60 670 L 50 670 L 50 660" />

        <path className="chart-graticule" d="M 191 44 A 2800 2800 0 0 0 180 676" />
        <path className="chart-graticule" d="M 341 44 A 2600 2600 0 0 0 333 676" />
        <path className="chart-graticule" d="M 490 44 A 3000 3000 0 0 0 486 676" />
        <path className="chart-graticule" d="M 640 44 L 640 676" />
        <path className="chart-graticule" d="M 789 44 A 3000 3000 0 0 1 793 676" />
        <path className="chart-graticule" d="M 939 44 A 2600 2600 0 0 1 947 676" />
        <path className="chart-graticule" d="M 1088 44 A 2800 2800 0 0 1 1099 676" />
        <path className="chart-graticule" d="M 44 95 A 6400 6400 0 0 0 1236 95" />
        <path className="chart-graticule" d="M 44 227.5 A 12000 12000 0 0 0 1236 227.5" />
        <path className="chart-graticule" d="M 44 360 L 1236 360" />
        <path className="chart-graticule" d="M 44 492.5 A 12000 12000 0 0 1 1236 492.5" />
        <path className="chart-graticule" d="M 44 625 A 6400 6400 0 0 1 1236 625" />

        <path
          className="chart-ecliptic"
          d="M 44 520 C 300 478 520 428 720 378 C 930 326 1100 258 1236 198"
        />

        <path
          className="chart-boundary"
          d="M 128 86 L 208 84 L 210 68 L 300 66 L 302 90 L 352 92 L 354 158 L 366 160 L 364 246 L 330 248 L 332 306 L 236 308 L 152 304 L 150 246 L 126 244 Z"
        />
        <path
          className="chart-boundary"
          d="M 938 92 L 1006 90 L 1008 74 L 1092 72 L 1094 92 L 1132 94 L 1130 152 L 1142 154 L 1140 216 L 1116 218 L 1118 260 L 1024 262 L 1022 246 L 952 244 L 950 170 L 936 168 Z"
        />

        <g>{SKY.figures}</g>
        <g>{SKY.glyphs}</g>
        <g className="chart-field">{SKY.field}</g>
        <g className="chart-tail">{SKY.tail}</g>

        <g>
          <rect className="plate-cartouche-ground" x="70" y="540" width="260" height="120" />
          <rect className="plate-cartouche-rule" x="70" y="540" width="260" height="120" />
          <rect
            className="plate-cartouche-rule plate-cartouche-rule--inner"
            x="75"
            y="545"
            width="250"
            height="110"
          />
          <text className="plate-cartouche-kicker" x="200" y="572" textAnchor="middle">
            LJÓSS · CELESTIAL ATLAS
          </text>
          <text className="plate-cartouche-title" x="200" y="614" textAnchor="middle">
            PLATE 404
          </text>
          <line className="plate-cartouche-divide" x1="150" y1="628" x2="250" y2="628" />
          <text className="plate-cartouche-kicker" x="200" y="648" textAnchor="middle">
            EPOCH {new Date().getFullYear()}.0 · UNCHARTED
          </text>
        </g>

        <rect className="plate-legend-panel" x="932" y="630" width="302" height="32" />
        <g className="plate-legend">
          <g transform="translate(952 646)">
            <circle className="chart-legend-core" r="2.2" />
            <circle className="chart-legend-ring" r="4.5" />
            <line className="chart-legend-tick" x1="5.2" y1="0" x2="8" y2="0" />
            <line className="chart-legend-tick" x1="-5.2" y1="0" x2="-8" y2="0" />
            <line className="chart-legend-tick" x1="0" y1="5.2" x2="0" y2="8" />
            <line className="chart-legend-tick" x1="0" y1="-5.2" x2="0" y2="-8" />
          </g>
          <g transform="translate(984 646)">
            <circle className="chart-legend-core" r="1.6" />
            <circle className="chart-legend-ring" r="3.2" />
          </g>
          <circle className="chart-legend-core" cx="1008" cy="646" r="1.2" />
          <text className="plate-legend-text" x="1022" y="649.5">
            MAG · I II III
          </text>
          <line className="ecliptic-sample" x1="1128" y1="646" x2="1156" y2="646" />
          <text className="plate-legend-text" x="1164" y="649.5">
            ECLIPTIC
          </text>
        </g>

        <g>
          <circle className="plate-reticle-outer" cx="630" cy="306" r="74" />
          <circle className="plate-reticle-main" cx="630" cy="306" r="58" />
          <line className="plate-reticle-tick" x1="630" y1="245" x2="630" y2="236" />
          <line className="plate-reticle-tick" x1="630" y1="367" x2="630" y2="376" />
          <line className="plate-reticle-tick" x1="691" y1="306" x2="700" y2="306" />
          <line className="plate-reticle-tick" x1="569" y1="306" x2="560" y2="306" />
          <circle className="plate-leader-dot" cx="671" cy="347" r="1.4" />
          <polyline className="plate-leader" points="671,347 700,440 706,440" />
          <text className="plate-note" x="712" y="456">
            ENTRY NOT FOUND IN THIS CATALOGUE
          </text>
          <text className="plate-note-sub" x="712" y="476">
            RA 04h 04m · DEC +04° 04′ · NO MAGNITUDE RECORDED
          </text>
          {/* The one action a lost reader needs, right in the central
              text: the way the old page led with the archive */}
          <a href="/blog/posts" aria-label="Consult the archive">
            <text className="plate-note plate-note-link" x="712" y="498">
              CONSULT THE ARCHIVE
            </text>
          </a>
        </g>
      </svg>
    </section>

    <section className="p404-aid">
      <hr className="p404-aid__rule" />
      <p className="p404-aid__lede">
        The catalogue holds no entry at this address. The shelves below
        remain well charted.
      </p>
      <div className="p404-aid__grid">
        <div>
          <p className="kicker p404-aid__head">Consult Instead</p>
          <Link className="p404-aid__row" href="/blog">
            <span className="p404-aid__label">Return to the feed</span>
            <span className="p404-aid__leader" aria-hidden />
            <span className="p404-aid__ref">P. 1</span>
          </Link>
          <Link className="p404-aid__row" href="/blog/tags">
            <span className="p404-aid__label">The Index</span>
            <span className="p404-aid__leader" aria-hidden />
            <span className="p404-aid__ref">Tags</span>
          </Link>
          <Link className="p404-aid__row" href="/blog/posts">
            <span className="p404-aid__label">The Ledger</span>
            <span className="p404-aid__leader" aria-hidden />
            <span className="p404-aid__ref">Archive</span>
          </Link>
        </div>
        <div>
          <p className="kicker p404-aid__head">The Three Newest Entries</p>
          {newest.map((post) => (
            <Link
              key={post.slug}
              className="p404-aid__entry"
              href={`/blog/posts/${post.slug}`}
            >
              <span className="p404-aid__meta">
                {format(post.created_at, "MMM dd, yyyy")} ·{" "}
                <em
                  className="p404-aid__cat"
                  style={{
                    color: `var(--shelf-${post.category_slug}, var(--primary))`,
                  }}
                >
                  {post.category_title ?? post.category_slug}
                </em>
              </span>
              <span className="p404-aid__title">{post.title}</span>
            </Link>
          ))}
        </div>
      </div>
      <hr className="p404-aid__rule p404-aid__rule--foot" />
      <p className="kicker p404-aid__foot">
        HTTP 404 · Nothing is charted at this address
      </p>
    </section>
  </>
);

export default LostFolio;
