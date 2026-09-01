import "./RailSky.css";
import React from "react";

/*
 * The Reader's Constellation: one invented figure (Lesarinn, the Reader)
 * drawn for the post page's right flank in the bio chart's glyph language:
 * dot-plus-ring magnitude glyphs, hairline figure lines, a few field
 * stars. Where scroll-driven animations are supported the stars ignite one
 * by one as the article is read; everywhere else the chart rests as the
 * finished figure. All choreography lives in RailSky.css; this stays a
 * pure server SVG with no pointer story at all.
 */

interface RailStar {
  x: number;
  y: number;
  mag: 1 | 2 | 3;
  /* Idle twinkle offset so the lit figure never blinks in unison */
  delay: number;
}

interface RailFieldStar {
  r: number;
  x: number;
  y: number;
  /* Only a few field stars carry the idle twinkle */
  delay?: number;
}

/* Nine stars igniting top to bottom; the windows live in RailSky.css */
const STARS: RailStar[] = [
  { delay: 0.6, mag: 2, x: 120, y: 80 },
  { delay: 1.8, mag: 1, x: 88, y: 170 },
  { delay: 3.1, mag: 3, x: 152, y: 240 },
  { delay: 4.4, mag: 2, x: 108, y: 330 },
  { delay: 5.7, mag: 3, x: 60, y: 420 },
  { delay: 2.5, mag: 1, x: 128, y: 510 },
  { delay: 6.9, mag: 3, x: 176, y: 610 },
  { delay: 0.9, mag: 2, x: 96, y: 700 },
  { delay: 8.2, mag: 3, x: 140, y: 800 },
];

/* Figure lines in ignition order, each fading in just after its two
   endpoint stars; endpoints pre-trimmed clear of the glyphs they join */
const LINKS = [
  { x1: 117.3, y1: 87.5, x2: 90.7, y2: 162.5 },
  { x1: 93.4, y1: 175.9, x2: 146.6, y2: 234.1 },
  { x1: 148.5, y1: 247.2, x2: 111.5, y2: 322.8 },
  { x1: 104.2, y1: 337.1, x2: 63.8, y2: 412.9 },
  { x1: 108.9, y1: 338, x2: 127.1, y2: 502 },
  { x1: 131.5, y1: 517.2, x2: 172.5, y2: 602.8 },
  { x1: 126.7, y1: 517.9, x2: 97.3, y2: 692.1 },
  { x1: 99.2, y1: 707.3, x2: 136.8, y2: 792.7 },
];

/* Seeded once and hardcoded, like the bio chart's field */
const FIELD_STARS: RailFieldStar[] = [
  { r: 1.1, x: 30, y: 60 },
  { r: 0.9, x: 150, y: 40 },
  { delay: 2.2, r: 0.9, x: 200, y: 120 },
  { r: 1.3, x: 40, y: 200 },
  { r: 0.9, x: 210, y: 260 },
  { r: 1, x: 24, y: 340 },
  { delay: 5.4, r: 1.2, x: 196, y: 380 },
  { r: 1.1, x: 210, y: 470 },
  { r: 0.9, x: 30, y: 520 },
  { r: 1.2, x: 50, y: 640 },
  { delay: 7.8, r: 0.9, x: 214, y: 690 },
  { r: 1, x: 36, y: 760 },
  { r: 1.2, x: 190, y: 860 },
  { r: 0.9, x: 90, y: 880 },
];

const CORE_RADIUS = { 1: 2.2, 2: 1.6, 3: 1.2 } as const;
const RING_RADIUS = { 1: 4.5, 2: 3.2 } as const;
/* Pre-baked radial-gradient glow, the house alternative to SVG filters */
const GLOW_RADIUS = { 1: 12, 2: 9, 3: 7 } as const;

const RailSky = () => {
  return (
    <div className="rail-sky" aria-hidden>
      <div className="rail-sky__frame">
        <svg
          className="rail-sky__chart"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 240 900"
          preserveAspectRatio="xMidYMin meet"
          width="100%"
        >
          <defs>
            <radialGradient id="rail-sky-glow">
              <stop
                offset="0%"
                stopColor="var(--rail-star)"
                stopOpacity="0.32"
              />
              <stop
                offset="100%"
                stopColor="var(--rail-star)"
                stopOpacity="0"
              />
            </radialGradient>
          </defs>

          <g className="rail-field">
            {FIELD_STARS.map((star, index) =>
              star.delay === undefined ? (
                <circle key={index} cx={star.x} cy={star.y} r={star.r} />
              ) : (
                <g
                  key={index}
                  className="rail-twinkle rail-twinkle--field"
                  style={
                    {
                      "--rail-twinkle-delay": `${star.delay}s`,
                    } as React.CSSProperties
                  }
                >
                  <circle cx={star.x} cy={star.y} r={star.r} />
                </g>
              )
            )}
          </g>

          {LINKS.map((link, index) => (
            <line
              key={index}
              className={`rail-figure rail-figure--l${index + 1}`}
              {...link}
            />
          ))}

          {STARS.map((star, index) => (
            <g
              key={index}
              className={`rail-star rail-star--s${index + 1}`}
              transform={`translate(${star.x} ${star.y})`}
            >
              {/* Nested carrier: scroll ignition owns the outer group,
                  the idle twinkle owns this one, so the two opacities
                  multiply instead of fighting over a single element */}
              <g
                className={
                  star.mag === 1 ? "rail-twinkle rail-glint" : "rail-twinkle"
                }
                style={
                  {
                    "--rail-twinkle-delay": `${star.delay}s`,
                  } as React.CSSProperties
                }
              >
                <circle
                  className="rail-glow"
                  r={GLOW_RADIUS[star.mag]}
                  fill="url(#rail-sky-glow)"
                />
                <circle className="rail-star-core" r={CORE_RADIUS[star.mag]} />
                {star.mag < 3 && (
                  <circle
                    className="rail-star-ring"
                    r={RING_RADIUS[star.mag as 1 | 2]}
                  />
                )}
                {star.mag === 1 && (
                  <>
                    <line
                      x1="5.2"
                      y1="0"
                      x2="9"
                      y2="0"
                      className="rail-star-tick"
                    />
                    <line
                      x1="-5.2"
                      y1="0"
                      x2="-9"
                      y2="0"
                      className="rail-star-tick"
                    />
                    <line
                      x1="0"
                      y1="5.2"
                      x2="0"
                      y2="9"
                      className="rail-star-tick"
                    />
                    <line
                      x1="0"
                      y1="-5.2"
                      x2="0"
                      y2="-9"
                      className="rail-star-tick"
                    />
                  </>
                )}
              </g>
            </g>
          ))}

          <text className="rail-label" x="120" y="850" textAnchor="middle">
            LESARINN
          </text>
        </svg>
      </div>
    </div>
  );
};

export default RailSky;
