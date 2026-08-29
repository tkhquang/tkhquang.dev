import "./CircuitBoard.css";
import React from "react";

/**
 * The rails the current runs along: centrelines of real traces from the artwork
 * below. That path is filled, so dashing it would outline each 2px bar rather
 * than run through it; these midlines are what a pulse can travel down.
 *
 * `q` picks one of the four quadrants of the 608x608 energy tile. Doubling the
 * artwork's 304px tile stops the sparks repeating within a card. Only the left
 * two quadrants are visible in the narrow sidebar, so they carry more rails.
 */
const SPARK_TRACES = [
  { q: 0, delay: 0, points: "161,220.1 161,121 185,97 300.1,97" },
  {
    q: 0,
    delay: 0.47,
    points: "204.1,257 97,257 97,200.99 57.01,161 37.9,161",
  },
  { q: 0, delay: 3.28, points: "33,0 33,41 9,65 0,65" },
  { q: 0, delay: 6.09, points: "1,300.1 1,257 17,257 17,304" },
  { q: 0, delay: 6.56, points: "117.9,1 177,1 177,33 161,33 161,21.9" },
  { q: 0, delay: 9.38, points: "49,53.9 49,97 1,145 1,209 28.1,209" },
  { q: 0, delay: 12.19, points: "236.1,177 225,177 225,273 273,273 273,304" },
  {
    q: 0,
    delay: 12.66,
    points: "197.9,241 209,241 209,161 225,161 225,145 181.9,145",
  },
  { q: 1, delay: 0.94, points: "161,220.1 161,121 185,97 300.1,97" },
  { q: 1, delay: 1.41, points: "1,300.1 1,257 17,257 17,304" },
  { q: 1, delay: 3.75, points: "17,156.1 17,153 65,105 65,49 97,49 97,0" },
  { q: 1, delay: 4.22, points: "117.9,1 177,1 177,33 161,33 161,21.9" },
  { q: 1, delay: 7.03, points: "49,53.9 49,97 1,145 1,209 28.1,209" },
  {
    q: 1,
    delay: 9.84,
    points: "204.1,257 97,257 97,200.99 57.01,161 37.9,161",
  },
  {
    q: 1,
    delay: 10.31,
    points: "197.9,241 209,241 209,161 225,161 225,145 181.9,145",
  },
  {
    q: 1,
    delay: 13.13,
    points: "241,149.9 241,161 257,161 257,193 241,193 241,257 289,257 289,304",
  },
  { q: 2, delay: 1.88, points: "261.9,209 289,209 289,137 303.3,122.71" },
  { q: 2, delay: 4.69, points: "17,156.1 17,153 65,105 65,49 97,49 97,0" },
  {
    q: 2,
    delay: 5.16,
    points: "241,149.9 241,161 257,161 257,193 241,193 241,257 289,257 289,304",
  },
  { q: 2, delay: 7.5, points: "49,53.9 49,97 1,145 1,209 28.1,209" },
  { q: 2, delay: 7.97, points: "117.9,17 145,17 145,60.1" },
  {
    q: 2,
    delay: 10.78,
    points: "204.1,257 97,257 97,200.99 57.01,161 37.9,161",
  },
  { q: 2, delay: 13.59, points: "161,220.1 161,121 185,97 300.1,97" },
  { q: 2, delay: 14.06, points: "97,101.9 97,145 53.9,145" },
  {
    q: 3,
    delay: 2.34,
    points: "204.1,257 97,257 97,200.99 57.01,161 37.9,161",
  },
  { q: 3, delay: 2.81, points: "124.1,113 113,113 113,161 85.9,161" },
  {
    q: 3,
    delay: 5.63,
    points: "197.9,241 209,241 209,161 225,161 225,145 181.9,145",
  },
  { q: 3, delay: 8.44, points: "17,156.1 17,153 65,105 65,49 97,49 97,0" },
  { q: 3, delay: 8.91, points: "1,300.1 1,257 17,257 17,304" },
  { q: 3, delay: 11.25, points: "145,188.1 145,112 176,81 225,81 225,21.9" },
  { q: 3, delay: 11.72, points: "117.9,1 177,1 177,33 161,33 161,21.9" },
  {
    q: 3,
    delay: 14.53,
    points: "241,149.9 241,161 257,161 257,193 241,193 241,257 289,257 289,304",
  },
];

/** Vias picked off the artwork, flickering like idle status LEDs. */
const SPARK_NODES = [
  { q: 0, delay: 0, cx: 113, cy: 1 },
  { q: 0, delay: 1.3, cx: 145, cy: 193 },
  { q: 0, delay: 2.6, cx: 113, cy: 305 },
  { q: 0, delay: 4.1, cx: 1, cy: 305 },
  { q: 0, delay: 5.4, cx: 305, cy: 1 },
  { q: 0, delay: 8.2, cx: 305, cy: 305 },
  { q: 0, delay: 9.5, cx: 1, cy: 97 },
  { q: 1, delay: 1.1, cx: 257, cy: 209 },
  { q: 1, delay: 3.9, cx: 17, cy: 161 },
  { q: 1, delay: 5.2, cx: 97, cy: 97 },
  { q: 1, delay: 6.7, cx: 145, cy: 193 },
  { q: 1, delay: 8, cx: 113, cy: 305 },
  { q: 1, delay: 9.3, cx: 305, cy: 1 },
  { q: 1, delay: 10.8, cx: 161, cy: 17 },
  { q: 2, delay: 0.9, cx: 273, cy: 193 },
  { q: 2, delay: 2.4, cx: 193, cy: 113 },
  { q: 2, delay: 3.7, cx: 97, cy: 97 },
  { q: 2, delay: 5, cx: 209, cy: 273 },
  { q: 2, delay: 6.5, cx: 33, cy: 161 },
  { q: 2, delay: 7.8, cx: 17, cy: 81 },
  { q: 2, delay: 10.6, cx: 209, cy: 17 },
  { q: 3, delay: 0.7, cx: 145, cy: 65 },
  { q: 3, delay: 2.2, cx: 65, cy: 129 },
  { q: 3, delay: 3.5, cx: 257, cy: 209 },
  { q: 3, delay: 6.3, cx: 209, cy: 17 },
  { q: 3, delay: 7.6, cx: 1, cy: 97 },
  { q: 3, delay: 9.1, cx: 177, cy: 161 },
  { q: 3, delay: 10.4, cx: 113, cy: 241 },
];

const QUADRANTS = [
  [0, 0],
  [304, 0],
  [0, 304],
  [304, 304],
];

/** Halo, trail and head share a leading edge, making one comet per pulse. */
const SPARK_LAYERS = ["halo", "trail", "head"];

const CircuitBoard = (props: React.ComponentProps<"svg">) => {
  return (
    <svg
      id="circuit-board"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      {...props}
    >
      <defs>
        <pattern
          id="circuit-pattern"
          x="0"
          y="0"
          width="304"
          height="304"
          patternUnits="userSpaceOnUse"
        >
          <path
            id="circuit-path"
            className="transition-all duration-300"
            fill="var(--primary)"
            fillOpacity="0.1"
            d="M44.1 224a5 5 0 1 1 0 2H0v-2h44.1zm160 48a5 5 0 1 1 0 2H82v-2h122.1zm57.8-46a5 5 0 1 1 0-2H304v2h-42.1zm0 16a5 5 0 1 1 0-2H304v2h-42.1zm6.2-114a5 5 0 1 1 0 2h-86.2a5 5 0 1 1 0-2h86.2zm-256-48a5 5 0 1 1 0 2H0v-2h12.1zm185.8 34a5 5 0 1 1 0-2h86.2a5 5 0 1 1 0 2h-86.2zM258 12.1a5 5 0 1 1-2 0V0h2v12.1zm-64 208a5 5 0 1 1-2 0v-54.2a5 5 0 1 1 2 0v54.2zm48-198.2V80h62v2h-64V21.9a5 5 0 1 1 2 0zm16 16V64h46v2h-48V37.9a5 5 0 1 1 2 0zm-128 96V208h16v12.1a5 5 0 1 1-2 0V210h-16v-76.1a5 5 0 1 1 2 0zm-5.9-21.9a5 5 0 1 1 0 2H114v48H85.9a5 5 0 1 1 0-2H112v-48h12.1zm-6.2 130a5 5 0 1 1 0-2H176v-74.1a5 5 0 1 1 2 0V242h-60.1zm-16-64a5 5 0 1 1 0-2H114v48h10.1a5 5 0 1 1 0 2H112v-48h-10.1zM66 284.1a5 5 0 1 1-2 0V274H50v30h-2v-32h18v12.1zM236.1 176a5 5 0 1 1 0 2H226v94h48v32h-2v-30h-48v-98h12.1zm25.8-30a5 5 0 1 1 0-2H274v44.1a5 5 0 1 1-2 0V146h-10.1zm-64 96a5 5 0 1 1 0-2H208v-80h16v-14h-42.1a5 5 0 1 1 0-2H226v18h-16v80h-12.1zm86.2-210a5 5 0 1 1 0 2H272V0h2v32h10.1zM98 101.9V146H53.9a5 5 0 1 1 0-2H96v-42.1a5 5 0 1 1 2 0zM53.9 34a5 5 0 1 1 0-2H80V0h2v34H53.9zm60.1 3.9V66H82v64H69.9a5 5 0 1 1 0-2H80V64h32V37.9a5 5 0 1 1 2 0zM101.9 82a5 5 0 1 1 0-2H128V37.9a5 5 0 1 1 2 0V82h-28.1zm16-64a5 5 0 1 1 0-2H146v44.1a5 5 0 1 1-2 0V18h-26.1zm102.2 270a5 5 0 1 1 0 2H98v14h-2v-16h124.1zM242 149.9V160h16v34h-16v62h48v48h-2v-46h-48v-66h16v-30h-16v-12.1a5 5 0 1 1 2 0zM53.9 18a5 5 0 1 1 0-2H64V2H48V0h18v18H53.9zm112 32a5 5 0 1 1 0-2H192V0h50v2h-48v48h-28.1zm-48-48a5 5 0 0 1-9.8-2h2.07a3 3 0 1 0 5.66 0H178v34h-18V21.9a5 5 0 1 1 2 0V32h14V2h-58.1zm0 96a5 5 0 1 1 0-2H137l32-32h39V21.9a5 5 0 1 1 2 0V66h-40.17l-32 32H117.9zm28.1 90.1a5 5 0 1 1-2 0v-76.51L175.59 80H224V21.9a5 5 0 1 1 2 0V82h-49.59L146 112.41v75.69zm16 32a5 5 0 1 1-2 0v-99.51L184.59 96H300.1a5 5 0 0 1 3.9-3.9v2.07a3 3 0 0 0 0 5.66v2.07a5 5 0 0 1-3.9-3.9H185.41L162 121.41v98.69zm-144-64a5 5 0 1 1-2 0v-3.51l48-48V48h32V0h2v50H66v55.41l-48 48v2.69zM50 53.9v43.51l-48 48V208h26.1a5 5 0 1 1 0 2H0v-65.41l48-48V53.9a5 5 0 1 1 2 0zm-16 16V89.41l-34 34v-2.82l32-32V69.9a5 5 0 1 1 2 0zM12.1 32a5 5 0 1 1 0 2H9.41L0 43.41V40.6L8.59 32h3.51zm265.8 18a5 5 0 1 1 0-2h18.69l7.41-7.41v2.82L297.41 50H277.9zm-16 160a5 5 0 1 1 0-2H288v-71.41l16-16v2.82l-14 14V210h-28.1zm-208 32a5 5 0 1 1 0-2H64v-22.59L40.59 194H21.9a5 5 0 1 1 0-2H41.41L66 216.59V242H53.9zm150.2 14a5 5 0 1 1 0 2H96v-56.6L56.6 162H37.9a5 5 0 1 1 0-2h19.5L98 200.6V256h106.1zm-150.2 2a5 5 0 1 1 0-2H80v-46.59L48.59 178H21.9a5 5 0 1 1 0-2H49.41L82 208.59V258H53.9zM34 39.8v1.61L9.41 66H0v-2h8.59L32 40.59V0h2v39.8zM2 300.1a5 5 0 0 1 3.9 3.9H3.83A3 3 0 0 0 0 302.17V256h18v48h-2v-46H2v42.1zM34 241v63h-2v-62H0v-2h34v1zM17 18H0v-2h16V0h2v18h-1zm273-2h14v2h-16V0h2v16zm-32 273v15h-2v-14h-14v14h-2v-16h18v1zM0 92.1A5.02 5.02 0 0 1 6 97a5 5 0 0 1-6 4.9v-2.07a3 3 0 1 0 0-5.66V92.1zM80 272h2v32h-2v-32zm37.9 32h-2.07a3 3 0 0 0-5.66 0h-2.07a5 5 0 0 1 9.8 0zM5.9 0A5.02 5.02 0 0 1 0 5.9V3.83A3 3 0 0 0 3.83 0H5.9zm294.2 0h2.07A3 3 0 0 0 304 3.83V5.9a5 5 0 0 1-3.9-5.9zm3.9 300.1v2.07a3 3 0 0 0-1.83 1.83h-2.07a5 5 0 0 1 3.9-3.9zM97 100a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0-16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-48 32a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm32 48a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-16 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm32-16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0-32a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16 32a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm32 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0-16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-16-64a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16 96a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16-144a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 32a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16-32a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16-16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-96 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16-32a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm96 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-16-64a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16-16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-32 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0-16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-16 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-16 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-16 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM49 36a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-32 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm32 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM33 68a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16-48a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 240a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16 32a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-16-64a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-16-32a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm80-176a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-16-16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm32 48a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16-16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0-32a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm112 176a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-16 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 180a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0-32a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 84a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm32 64a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16-16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
          ></path>
        </pattern>

        <pattern
          id="circuit-energy"
          x="0"
          y="0"
          width="608"
          height="608"
          patternUnits="userSpaceOnUse"
        >
          {SPARK_LAYERS.map((layer) => (
            <g key={layer} className={`circuit-spark-layer--${layer}`}>
              {SPARK_TRACES.map(({ q, delay, points }, index) => (
                <polyline
                  key={index}
                  className="circuit-spark"
                  points={points}
                  transform={`translate(${QUADRANTS[q][0]} ${QUADRANTS[q][1]})`}
                  style={
                    {
                      "--circuit-spark-delay": `${delay}s`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </g>
          ))}

          {SPARK_NODES.map(({ q, delay, cx, cy }, index) => (
            <circle
              key={index}
              className="circuit-node"
              cx={cx + QUADRANTS[q][0]}
              cy={cy + QUADRANTS[q][1]}
              r="2.4"
              style={
                { "--circuit-node-delay": `${delay}s` } as React.CSSProperties
              }
            />
          ))}
        </pattern>
      </defs>

      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="url(#circuit-pattern)"
      />
      <rect
        id="circuit-energy-layer"
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="url(#circuit-energy)"
      />
    </svg>
  );
};

export default CircuitBoard;
