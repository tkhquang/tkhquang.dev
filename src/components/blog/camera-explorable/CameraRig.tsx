"use client";

import type { CameraLesson } from "./CameraExplorable";
import { drawCameraView, drawRigMap } from "./render";
import {
  createRig,
  DEFAULT_SETTINGS,
  settleRig,
  stepRig,
  type RigSettings,
  type RigState,
} from "./simulation";
import { useEffect, useId, useRef, useState } from "react";

const PART_TWO =
  "/blog/posts/devlog-kingdom-come-deliverance-ii-customizing-the-view-tpv-offsets-input-and-whats-under-the-hood";
const PART_THREE =
  "/blog/posts/devlog-kingdom-come-deliverance-ii-building-a-proper-third-person-camera";
const SOURCES = {
  rig: `${PART_THREE}#building-the-rig-and-two-kinds-of-shake`,
  shoulder: `${PART_TWO}#deconstructing-the-3d-math-vectors-quaternions-and-transforms`,
  motion: `${PART_THREE}#a-simpler-rig`,
  collision: `${PART_THREE}#four-ways-to-stay-out-of-a-wall`,
  fade: `${PART_THREE}#and-im-still-not-happy-with-it`,
  aim: `${PART_THREE}#the-crosshair-and-why-it-cant-be-perfect`,
  lens: `${PART_TWO}#fov-and-distance`,
};

const LESSONS: {
  id: CameraLesson;
  label: string;
  title: string;
  text: string;
}[] = [
  {
    id: "rig",
    label: "01 · The rig",
    title: "Position is only half the camera.",
    text: "Lift the pivot, extend the boom, then swap shoulders. Look-at turns the lens back toward the pivot; locked yaw keeps it facing the chosen heading. Watch the subject move across the frame.",
  },
  {
    id: "motion",
    label: "02 · The spring",
    title: "Letting the camera catch up.",
    text: "Play the path, then change the spring. A soft spring lets the camera trail behind; low damping lets it overshoot. A damping ratio of 1 removes oscillation around a stationary target. Pause and step to inspect the lag.",
  },
  {
    id: "collision",
    label: "03 · The wall",
    title: "Keeping the camera out of walls.",
    text: "Play the path or turn the yaw. Collision projects the camera onto a safe wall face, letting it slide sideways. With collision off, fading reveals the subject through the wall. Close subjects fade too. Disable either response to compare.",
  },
  {
    id: "lens",
    label: "04 · The lens",
    title: "A wider lens is not a longer arm.",
    text: "Widen the field of view, then reset and lengthen the boom. Both make the subject smaller in the frame, but only moving the camera changes its proportions against the distant columns. Try a longer boom with a narrower field of view to keep the subject roughly the same size.",
  },
];

function preset(lesson: CameraLesson): RigSettings {
  if (lesson === "motion")
    return {
      ...DEFAULT_SETTINGS,
      collision: false,
      stiffness: 16,
      damping: 0.3,
    };
  if (lesson === "collision") return { ...DEFAULT_SETTINGS, boom: 4.5 };
  return { ...DEFAULT_SETTINGS, collision: false };
}

function readings(state: RigState) {
  return {
    distance: Math.hypot(
      state.camera.x - state.pivot.x,
      state.camera.y - state.pivot.y,
      state.camera.z - state.pivot.z
    ).toFixed(2),
    opacity: Math.round(state.opacity * 100),
    colliding: state.colliding,
    wallOpacity: Math.round(state.wallOpacity * 100),
    time: state.time.toFixed(1),
  };
}

type SliderKey =
  | "boom"
  | "pivotHeight"
  | "shoulder"
  | "stiffness"
  | "damping"
  | "yaw"
  | "fov";
type SwitchKey = "lookAt" | "collision" | "fade";

export default function CameraRig({
  initialLesson,
}: {
  initialLesson: CameraLesson;
}) {
  const id = useId();
  const [lesson, setLesson] = useState(initialLesson);
  /* Each experiment starts with settings that demonstrate its lesson and
     retains the reader's edits independently. In particular, disabling
     collision in the spring experiment must not disable it in the wall one. */
  const [setups, setSetups] = useState(() => ({
    rig: preset("rig"),
    motion: preset("motion"),
    collision: preset("collision"),
    lens: preset("lens"),
  }));
  const settings = setups[lesson];
  const [playing, setPlaying] = useState(false);
  const [revision, setRevision] = useState(0);
  const [metrics, setMetrics] = useState(() =>
    readings(createRig(preset(initialLesson)))
  );
  const [canvasUnavailable, setCanvasUnavailable] = useState(false);
  const stateRef = useRef<RigState | null>(null);
  /* Slider edits rebuild the drawing effect. Preserve the frame clock across
     those edits so dragging a control does not stall simulation time. */
  const clockRef = useRef(0);
  const previousSettings = useRef(settings);
  const mapRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const currentLesson = LESSONS.find((entry) => entry.id === lesson)!;

  useEffect(() => {
    playButtonRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const view = viewRef.current;
    const stage = stageRef.current;
    if (!map || !view || !stage) return;

    let frame = 0;
    let lastReport = 0;
    let visible = true;
    let disposed = false;
    if (!stateRef.current) stateRef.current = createRig(settings);
    if (previousSettings.current !== settings && !playing) {
      stateRef.current = settleRig(stateRef.current, settings);
    }
    previousSettings.current = settings;

    const paint = (now: number) => {
      frame = 0;
      if (disposed) return;
      if (!map.getContext("2d") || !view.getContext("2d")) {
        setCanvasUnavailable(true);
        return;
      }
      const stepping = playing && visible && !document.hidden;
      const dt =
        stepping && clockRef.current
          ? Math.min((now - clockRef.current) / 1000, 0.05)
          : 0;
      // A paused, hidden or scrolled-away loop keeps no stamp, so the frame
      // that resumes it starts from zero instead of the elapsed wall time.
      clockRef.current = stepping ? now : 0;
      if (stepping) {
        stateRef.current = stepRig(stateRef.current!, settings, dt, true);
      }
      drawRigMap(map, stateRef.current!, settings);
      drawCameraView(view, stateRef.current!, settings);
      if (!lastReport || now - lastReport > 100 || !playing) {
        setMetrics(readings(stateRef.current!));
        lastReport = now;
      }
      if (stepping) frame = requestAnimationFrame(paint);
    };
    const wake = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(paint);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      wake();
    });
    observer.observe(stage);
    const resize = new ResizeObserver(wake);
    resize.observe(stage);
    document.addEventListener("visibilitychange", wake);
    wake();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      document.removeEventListener("visibilitychange", wake);
    };
  }, [settings, playing, revision]);

  /* Reset restores the current experiment alone; the other three keep
     whatever the reader left in them. */
  function reset() {
    const fresh = preset(lesson);
    stateRef.current = createRig(fresh);
    setSetups((all) => ({ ...all, [lesson]: fresh }));
    setPlaying(false);
    setRevision((value) => value + 1);
  }

  function adjust(patch: Partial<RigSettings>) {
    setSetups((all) => ({ ...all, [lesson]: { ...all[lesson], ...patch } }));
  }

  function slider(
    key: SliderKey,
    label: string,
    min: number,
    max: number,
    step: number,
    unit: string,
    hint: string,
    source: string
  ) {
    const inputId = `${id}-${key}`;
    const formatted = settings[key].toFixed(step < 1 ? 2 : 0);
    return (
      <div className="camera-control">
        <label htmlFor={inputId}>
          <span>{label}</span>
          <output htmlFor={inputId}>
            {formatted}
            {unit === "°" ? "" : " "}
            {unit}
          </output>
        </label>
        <input
          id={inputId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={settings[key]}
          aria-describedby={`${inputId}-hint`}
          aria-valuetext={`${formatted} ${unit === "°" ? "degrees" : unit === "m" ? "metres" : unit}`}
          onChange={(event) => adjust({ [key]: event.target.valueAsNumber })}
        />
        <p id={`${inputId}-hint`}>
          {hint}{" "}
          <a
            href={source}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${label} in the post (opens in a new tab)`}
          >
            In the post
          </a>
        </p>
      </div>
    );
  }

  function toggle(key: SwitchKey, label: string, hint: string, source: string) {
    const inputId = `${id}-${key}`;
    return (
      <div className="camera-control">
        <label className="camera-toggle" htmlFor={inputId}>
          <input
            id={inputId}
            type="checkbox"
            checked={settings[key]}
            aria-describedby={`${inputId}-hint`}
            onChange={(event) => adjust({ [key]: event.target.checked })}
          />
          {label}
        </label>
        <p id={`${inputId}-hint`}>
          {hint}{" "}
          <a
            href={source}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${label} in the post (opens in a new tab)`}
          >
            In the post
          </a>
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="camera-stage" ref={stageRef}>
        <div className="camera-viewport">
          <div className="camera-view-label">
            <span>Rig / plan view</span>
            <span>+Z ↑</span>
          </div>
          <canvas
            ref={mapRef}
            role="img"
            aria-label="Top view of the subject, pivot, desired and actual camera positions, field of view, and wall."
            aria-describedby={`${id}-readings`}
          >
            The camera follows behind the pivot with a sideways shoulder offset.
            A wall can shorten its distance.
          </canvas>
        </div>
        <div className="camera-viewport">
          <div className="camera-view-label">
            <span>Through the lens</span>
            <span>{settings.fov}° vertical</span>
          </div>
          <canvas
            ref={viewRef}
            role="img"
            aria-label="Perspective from the simulated camera, showing the subject, wall, and distant columns."
            aria-describedby={`${id}-readings`}
          >
            Changing camera distance changes perspective; field of view changes
            framing.
          </canvas>
        </div>
      </div>
      {canvasUnavailable && (
        <p role="status">
          Canvas is unavailable in this browser. The controls and post links
          remain available; the live views need Canvas 2D.
        </p>
      )}
      <div className="camera-legend" aria-label="Diagram legend">
        <span>
          <i className="camera-swatch-subject" />
          Subject / pivot
        </span>
        <span>
          <i className="camera-swatch-camera" />
          Camera
        </span>
        <span>
          <i className="camera-swatch-wall" />
          Wall
        </span>
        <span>
          <i className="camera-swatch-ghost" />
          Desired position
        </span>
      </div>
      <div className="camera-transport">
        <div className="camera-actions">
          <button
            type="button"
            className="camera-play"
            ref={playButtonRef}
            onClick={() => setPlaying((value) => !value)}
          >
            {playing ? "Pause" : "Play path"}
          </button>
          <button
            type="button"
            disabled={playing}
            onClick={() => {
              stateRef.current = stepRig(
                stateRef.current ?? createRig(settings),
                settings,
                1 / 30,
                true
              );
              setRevision((value) => value + 1);
            }}
          >
            Step 1/30 s
          </button>
          <button type="button" onClick={() => reset()}>
            Reset
          </button>
        </div>
        <span className="camera-clock">{metrics.time} s</span>
      </div>
      <div className="camera-readings" id={`${id}-readings`}>
        <span>
          Pivot → camera <strong>{metrics.distance} m</strong>
        </span>
        <span>
          Subject opacity <strong>{metrics.opacity}%</strong>
        </span>
        <span>
          Wall opacity <strong>{metrics.wallOpacity}%</strong>
        </span>
        <span>
          Wall{" "}
          <strong>
            {settings.collision
              ? metrics.colliding
                ? "arm constrained"
                : "clear"
              : "collision off"}
          </strong>
        </span>
      </div>

      <div
        className="camera-lessons"
        role="group"
        aria-label="Camera experiments"
      >
        {LESSONS.map((entry) => (
          <button
            type="button"
            key={entry.id}
            aria-pressed={lesson === entry.id}
            aria-controls={`${id}-controls`}
            onClick={() => setLesson(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>
      <div className="camera-lesson" id={`${id}-controls`}>
        <div className="camera-lesson-intro">
          <h4>{currentLesson.title}</h4>
          <p>{currentLesson.text}</p>
        </div>
        <div className="camera-controls">
          {lesson === "rig" && (
            <>
              {slider(
                "pivotHeight",
                "Pivot height",
                0.5,
                2.5,
                0.05,
                "m",
                "The point the boom follows above the subject's feet.",
                SOURCES.rig
              )}
              {slider(
                "boom",
                "Boom length",
                0.6,
                7,
                0.1,
                "m",
                "Desired distance behind the pivot, before collision.",
                SOURCES.rig
              )}
              {slider(
                "shoulder",
                "Shoulder offset",
                -1.5,
                1.5,
                0.05,
                "m",
                "Move the rig to either side in its local frame.",
                SOURCES.shoulder
              )}
              {slider(
                "yaw",
                "Rig yaw",
                -80,
                80,
                1,
                "°",
                "Turn the boom around its pivot.",
                SOURCES.shoulder
              )}
              {toggle(
                "lookAt",
                "Look at the pivot",
                "Off: lock the lens to the rig's yaw with level pitch.",
                SOURCES.aim
              )}
            </>
          )}
          {lesson === "motion" && (
            <>
              {slider(
                "stiffness",
                "Spring stiffness",
                4,
                100,
                1,
                "",
                "A stronger spring closes the gap faster (unit mass).",
                SOURCES.motion
              )}
              {slider(
                "damping",
                "Damping ratio",
                0.1,
                2,
                0.05,
                "",
                "For a stationary target: below 1 oscillates, 1 is critical damping, above 1 returns more slowly.",
                SOURCES.motion
              )}
              {slider(
                "boom",
                "Boom length",
                0.6,
                7,
                0.1,
                "m",
                "The spring follows this desired arm position.",
                SOURCES.rig
              )}
              {toggle(
                "collision",
                "Resolve wall collision",
                "Compare free spring motion with immediate wall correction.",
                SOURCES.collision
              )}
            </>
          )}
          {lesson === "collision" && (
            <>
              {toggle(
                "collision",
                "Resolve wall collision",
                "Keep the camera outside the solid wall and slide along its face.",
                SOURCES.collision
              )}
              {toggle(
                "fade",
                "Fade occluders",
                "Fade a wall between lens and pivot, or a subject too close to the lens. Turn collision off to look through the wall.",
                SOURCES.fade
              )}
              {slider(
                "boom",
                "Boom length",
                0.6,
                7,
                0.1,
                "m",
                "The dashed camera is the position the rig asked for.",
                SOURCES.rig
              )}
              {slider(
                "yaw",
                "Rig yaw",
                -80,
                80,
                1,
                "°",
                "Rotate into the wall to see the camera slide sideways.",
                SOURCES.shoulder
              )}
            </>
          )}
          {lesson === "lens" && (
            <>
              {slider(
                "fov",
                "Vertical field of view",
                30,
                100,
                1,
                "°",
                "Widen the frame from the same camera position.",
                SOURCES.lens
              )}
              {slider(
                "boom",
                "Boom length",
                0.6,
                7,
                0.1,
                "m",
                "Move the viewpoint and change foreground/background proportions.",
                SOURCES.lens
              )}
              {slider(
                "shoulder",
                "Shoulder offset",
                -1.5,
                1.5,
                0.05,
                "m",
                "See parallax as the lens moves sideways.",
                SOURCES.shoulder
              )}
              {toggle(
                "lookAt",
                "Look at the pivot",
                "Off: the subject can drift away from the reticle.",
                SOURCES.aim
              )}
            </>
          )}
        </div>
        <p className="camera-note">
          Every experiment keeps its own setup, and Reset restores this one.
          Edits while paused settle the rig immediately. Play or step to see the
          spring respond. All distances are illustrative metres.
        </p>
      </div>
    </div>
  );
}
