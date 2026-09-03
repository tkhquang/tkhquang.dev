import { MarkdownPost } from "@/models/markdown.types";
import { format } from "date-fns";
import Link from "next/link";

/*
 * Plate 404, "The Lost Star": a celestial plate for the page that is not
 * on the chart. The whole composition fits the viewport (owner ruling):
 * the sky is the upper band of a 100dvh grid and the finding aid is the
 * lower row, always on screen, never buried. The star field is crop-safe
 * cartography (no frame; dotted graticule, gilt ecliptic, magnitude
 * glyphs), while the cartouche, reticle, and headline overlay in HTML so
 * cropping can never cut them. Everything renders on the server; the one
 * random-looking thing, the field, is a fixed-seed PRNG so every build
 * prints the same plate.
 */

/* mulberry32, seeded 404: deterministic across builds */
function makePrng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const VIEW_W = 1440;
const VIEW_H = 760;
/* The reticle's empty patch: RA 04h 04m, naturally */
const RETICLE = { x: VIEW_W * 0.5, y: VIEW_H * 0.42, r: 92 };

interface Star {
  x: number;
  y: number;
  magnitude: 1 | 2 | 3;
}

function buildField(): Star[] {
  const random = makePrng(404);
  const stars: Star[] = [];

  while (stars.length < 220) {
    const x = random() * VIEW_W;
    const y = random() * VIEW_H;

    /* The surveyed patch stays empty: that is the whole joke */
    const dx = x - RETICLE.x;
    const dy = y - RETICLE.y;
    if (Math.sqrt(dx * dx + dy * dy) < RETICLE.r + 26) continue;

    const roll = random();
    stars.push({ x, y, magnitude: roll > 0.965 ? 1 : roll > 0.8 ? 2 : 3 });
  }

  return stars;
}

const STARS = buildField();

const StarGlyph = ({ star }: { star: Star }) => {
  const radius = star.magnitude === 1 ? 2.6 : star.magnitude === 2 ? 1.9 : 1.3;
  const opacity =
    star.magnitude === 1 ? 0.95 : star.magnitude === 2 ? 0.7 : 0.45;

  return (
    <g opacity={opacity}>
      <circle cx={star.x} cy={star.y} r={radius} fill="currentColor" />
      {star.magnitude === 1 && (
        <circle
          cx={star.x}
          cy={star.y}
          r={5.5}
          fill="none"
          stroke="var(--gilt-ink)"
          strokeWidth="0.75"
          opacity={0.8}
        />
      )}
    </g>
  );
};

const LostFolio = ({ newest }: { newest: MarkdownPost[] }) => (
  <section className="lost-folio">
    <div className="lost-folio__sky">
      <svg
        className="lost-folio__field"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        {/* Dotted declination arcs and the gilt ecliptic: crop-safe
            cartography, no frame to break */}
        <g fill="none" strokeWidth="0.75">
          <circle
            cx={VIEW_W * 0.18}
            cy={-VIEW_H * 0.55}
            r={VIEW_H * 1.2}
            className="lost-folio__graticule"
          />
          <circle
            cx={VIEW_W * 0.85}
            cy={VIEW_H * 1.7}
            r={VIEW_H * 1.45}
            className="lost-folio__graticule"
          />
          <path
            d={`M -40 ${VIEW_H * 0.78} Q ${VIEW_W * 0.5} ${VIEW_H * 0.5} ${VIEW_W + 40} ${VIEW_H * 0.68}`}
            stroke="var(--gilt-ink)"
            strokeDasharray="1 7"
            opacity="0.55"
          />
        </g>
        <g className="lost-folio__stars">
          {STARS.map((star, index) => (
            <StarGlyph key={index} star={star} />
          ))}
        </g>
        {/* The dashed survey reticle around the empty patch */}
        <g fill="none" className="lost-folio__reticle">
          <circle
            cx={RETICLE.x}
            cy={RETICLE.y}
            r={RETICLE.r}
            strokeDasharray="6 8"
            strokeWidth="1"
          />
          {[0, 90, 180, 270].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const inner = RETICLE.r - 6;
            const outer = RETICLE.r + 10;
            return (
              <line
                key={angle}
                x1={RETICLE.x + inner * Math.cos(rad)}
                y1={RETICLE.y + inner * Math.sin(rad)}
                x2={RETICLE.x + outer * Math.cos(rad)}
                y2={RETICLE.y + outer * Math.sin(rad)}
                strokeWidth="1"
              />
            );
          })}
        </g>
      </svg>

      {/* Plate furniture in HTML, never cropped */}
      <div className="lost-folio__cartouche" aria-hidden>
        <span className="kicker lost-folio__cartouche-title">Plate 404</span>
        <span className="kicker lost-folio__cartouche-line">
          Epoch {new Date().getFullYear()}.0
        </span>
        <span className="kicker lost-folio__cartouche-line">Uncharted</span>
      </div>

      <div className="lost-folio__caption">
        <span className="kicker lost-folio__kicker">Folio not found</span>
        <h1 className="lost-folio__headline">
          This page is not on the chart.
        </h1>
        <p className="kicker lost-folio__annotation">
          Entry not found in this catalogue · RA 04h 04m · Dec +04° 04′
        </p>
      </div>
    </div>

    <div className="lost-folio__aid">
      <div className="lost-folio__aid-inner">
        <span className="kicker lost-folio__aid-head">Consult instead</span>
        <nav className="lost-folio__doors" aria-label="Blog sections">
          <Link href="/blog" className="kicker tint-link">
            Return to the feed · p. 1
          </Link>
          <Link href="/blog/categories" className="kicker tint-link">
            The Shelves
          </Link>
          <Link href="/blog/tags" className="kicker tint-link">
            The Index
          </Link>
          <Link href="/blog/posts" className="kicker tint-link">
            The Ledger
          </Link>
        </nav>
        {newest.length > 0 && (
          <ol className="lost-folio__rows">
            {newest.map((post) => (
              <li key={post.slug} className="lost-folio__row">
                <span className="lost-folio__row-title">
                  <Link href={`/blog/posts/${post.slug}`} className="tint-link">
                    {post.title}
                  </Link>
                </span>
                <span className="lost-folio__leader" aria-hidden />
                <span className="kicker lost-folio__row-date">
                  {format(post.created_at, "MMM dd, yyyy")}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  </section>
);

export default LostFolio;
