"use client";

import dynamic from "next/dynamic";
import { useId, useState } from "react";

const CameraRig = dynamic(() => import("./CameraRig"), {
  loading: () => <p role="status">Preparing the camera...</p>,
});

export type CameraLesson = "rig" | "motion" | "collision" | "lens";

/** A small entry point keeps the simulation out of an unopened article plate. */
export default function CameraExplorable({
  lesson = "rig",
}: {
  lesson?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const initialLesson: CameraLesson =
    lesson === "motion" || lesson === "collision" || lesson === "lens"
      ? lesson
      : "rig";

  return (
    <section className="camera-plate" aria-labelledby={`${id}-title`}>
      <header className="camera-header">
        <p className="camera-eyebrow">A study in motion · Interactive plate</p>
        <h3 id={`${id}-title`}>The camera has a body, too.</h3>
        <p>
          A subject, a spring arm, and one inconvenient wall. Change the rig;
          watch what the camera sees.
        </p>
      </header>

      {open ? (
        <CameraRig initialLesson={initialLesson} />
      ) : (
        <div className="camera-cover">
          <svg
            viewBox="0 0 640 200"
            role="img"
            aria-label="Plan of a camera on a boom behind its subject, with a wall beside the rig."
          >
            <defs>
              <pattern
                id={`${id}-grid`}
                width="32"
                height="32"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 32 0 L 0 0 0 32"
                  fill="none"
                  stroke="#233344"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="640" height="200" fill={`url(#${id}-grid)`} />
            <path
              d="M224 164 161 42 357 42Z"
              fill="#8bcbd511"
              stroke="#8bcbd555"
            />
            <path
              d="M224 164 276 68"
              stroke="#8bcbd5"
              strokeWidth="2"
              strokeDasharray="5 5"
            />
            <rect
              x="402"
              y="38"
              width="18"
              height="125"
              fill="#b67b8333"
              stroke="#d69ba4"
            />
            <circle cx="276" cy="68" r="10" fill="#e8cc8c" />
            <path d="m276 46-5 10h10Z" fill="#e8cc8c" />
            <rect
              x="215"
              y="157"
              width="18"
              height="13"
              rx="2"
              fill="#8bcbd5"
            />
            <g fill="#dce4e8" fontSize="12" fontFamily="monospace">
              <text x="298" y="72">
                pivot / subject
              </text>
              <text x="98" y="170">
                camera
              </text>
              <text x="267" y="128">
                boom
              </text>
              <text x="439" y="105">
                collider
              </text>
            </g>
          </svg>
          <button
            className="camera-launch"
            type="button"
            onClick={() => setOpen(true)}
          >
            Explore the camera
          </button>
          <p>Four experiments. Start still, then play the path.</p>
        </div>
      )}

      <footer className="camera-footer">
        <span>Generic teaching model; fading is an experiment here.</span>
        <span>
          The working mod and video live on{" "}
          <a
            href="https://www.nexusmods.com/kingdomcomedeliverance2/mods/3263"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Nexus (opens in a new tab)"
          >
            Nexus
          </a>
          {" / "}
          <a
            href="https://www.youtube.com/watch?v=NuCQHDoQnVE"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube (opens in a new tab)"
          >
            YouTube
          </a>
          . This plate only teaches the motion.
        </span>
      </footer>
    </section>
  );
}
