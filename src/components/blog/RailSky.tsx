import "./RailSky.css";
import classNames from "classnames";
import React from "react";

/*
 * The Reader's Constellation: one invented figure (Lesarinn, the Reader)
 * drawn for the post page's right flank in the bio chart's glyph language:
 * dot-plus-ring magnitude glyphs, hairline figure lines, a few field
 * stars. The stars ignite one by one as the article is read, driven by
 * RailSky.css where CSS scroll timelines exist and by RailSkyDriver where
 * they do not; under reduced motion or below xl the chart rests as the
 * finished figure. All choreography lives outside this file, which stays a
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
   endpoint stars; drawn star to star like the bio chart (trimmed-gap
   atlas ends read as cut off at this hairline weight) */
const LINKS = [
  { x1: 120, y1: 80, x2: 88, y2: 170 },
  { x1: 88, y1: 170, x2: 152, y2: 240 },
  { x1: 152, y1: 240, x2: 108, y2: 330 },
  { x1: 108, y1: 330, x2: 60, y2: 420 },
  { x1: 108, y1: 330, x2: 128, y2: 510 },
  { x1: 128, y1: 510, x2: 176, y2: 610 },
  { x1: 128, y1: 510, x2: 96, y2: 700 },
  { x1: 96, y1: 700, x2: 140, y2: 800 },
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
                className={classNames(
                  "rail-twinkle",
                  star.mag === 1 && "rail-glint"
                )}
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
