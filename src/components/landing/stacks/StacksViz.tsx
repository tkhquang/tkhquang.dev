"use client";

import classNames from "classnames";
import { useState } from "react";

export interface LanguageShare {
  id: string;
  name: string;
  percentage: number;
  /** GitHub language identity color */
  color?: string;
}

type PersonaKey = "all" | "fe" | "re";

/*
 * Personas filter by EXCLUSION: a view drops the other side's specific
 * languages and keeps everything else, so neutral entries (Other, tooling)
 * stay visible in every view instead of vanishing.
 */
const RE_SPECIFIC = ["C++", "C", "CMake", "Lua", "Rust", "Assembly", "Python"];
const FE_SPECIFIC = [
  "JavaScript",
  "TypeScript",
  "CSS",
  "HTML",
  "Vue",
  "SCSS",
  "Sass",
  "Elixir",
];

const PERSONAS: Record<
  PersonaKey,
  { label: string; caption: string; exclude?: string[] }
> = {
  all: {
    caption:
      "Based on GitHub commits, share of everything I push. That C++ share is the game modding habit",
    label: "Everything",
  },
  fe: {
    caption: "Based on GitHub commits, share within my front-end work",
    exclude: RE_SPECIFIC,
    label: "Front-end",
  },
  re: {
    caption:
      "Based on GitHub commits, share within the reverse engineering side. Mostly the game modding habit",
    exclude: FE_SPECIFIC,
    label: "Reverse engineering",
  },
};

const DEFAULT_PERSONA: PersonaKey = "all";

/**
 * GitHub identity color (matching the repo cards below) through the
 * per-theme legibility tokens in _00_core.css; the catch-all "Other" takes
 * the ramp's neutral stop.
 */
function chartColor(language: LanguageShare): string {
  if (language.id === "other" || !language.color) {
    return "var(--chart-6)";
  }
  return `color-mix(in srgb, ${language.color} var(--lang-color-keep), var(--lang-color-tune))`;
}

/**
 * Language share of GitHub commits, filterable by persona. Percentages are
 * renormalized within the active view so the rows always agree with the
 * composition bar and sum to 100.
 */
const StacksViz = ({ languages }: { languages: LanguageShare[] }) => {
  const [persona, setPersona] = useState<PersonaKey>(DEFAULT_PERSONA);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const excluded = PERSONAS[persona].exclude;
  const filtered = excluded
    ? languages.filter((language) => !excluded.includes(language.name))
    : languages;
  const personaTotal = filtered.reduce(
    (acc, language) => acc + language.percentage,
    0
  );
  const active = filtered.map((language) => ({
    ...language,
    viewPercentage:
      personaTotal > 0 ? (language.percentage / personaTotal) * 100 : 0,
  }));
  const maxPercentage = Math.max(
    ...active.map((language) => language.viewPercentage),
    0.1
  );

  const isDimmed = (id: string) => focusedId !== null && focusedId !== id;
  /*
   * Mouse pointers highlight on hover; touch toggles on tap. Touch also
   * synthesizes mouseenter before click, which would set and immediately
   * clear the focus, so each path only reacts to its own pointer type.
   */
  const focusHandlers = (id: string) => ({
    onPointerEnter: (event: React.PointerEvent) => {
      if (event.pointerType !== "touch") {
        setFocusedId(id);
      }
    },
    onPointerLeave: (event: React.PointerEvent) => {
      if (event.pointerType !== "touch") {
        setFocusedId(null);
      }
    },
    onPointerUp: (event: React.PointerEvent) => {
      if (event.pointerType === "touch") {
        setFocusedId((current) => (current === id ? null : id));
      }
    },
  });

  return (
    <div>
      {/* Filters, not tabs: no tabpanel or arrow-key contract to honor */}
      <div
        role="group"
        aria-label="Filter the stacks by persona"
        className="border-theme-hairline-soft mb-6 inline-flex flex-wrap gap-1 rounded-lg border p-1"
      >
        {(Object.keys(PERSONAS) as PersonaKey[]).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={persona === key}
            className={classNames(
              "cursor-pointer rounded-md px-3.5 py-1.5 font-mono text-xs font-semibold transition-colors duration-200",
              persona === key
                ? "bg-theme-primary text-theme-on-primary shadow-sm"
                : "opacity-70 hover:opacity-100"
            )}
            onClick={() => {
              setPersona(key);
              setFocusedId(null);
            }}
          >
            {PERSONAS[key].label}
          </button>
        ))}
      </div>

      <div
        key={`bar-${persona}`}
        className="flex h-3.5 gap-px overflow-hidden rounded-full"
        role="img"
        aria-label={`${PERSONAS[persona].label} share of GitHub commits`}
      >
        {active.map((language, index) => (
          <span
            key={language.id}
            className={classNames(
              "animate-grow-bar block h-full cursor-pointer transition-opacity duration-200",
              isDimmed(language.id) && "opacity-30"
            )}
            title={`${language.name} ${language.viewPercentage.toFixed(1)}%`}
            style={{
              animationDelay: `${index * 60}ms`,
              backgroundColor: chartColor(language),
              width: `${language.viewPercentage}%`,
            }}
            {...focusHandlers(language.id)}
          />
        ))}
      </div>

      <div
        key={`rows-${persona}`}
        className="mt-6 grid grid-cols-1 gap-x-6 gap-y-1 md:grid-cols-2"
      >
        {active.map((language, index) => (
          <div
            key={language.id}
            className={classNames(
              "grid cursor-default grid-cols-[6.5rem_minmax(0,1fr)_3.5rem] items-center gap-3 rounded-md px-2 py-1 transition-[background-color,opacity] duration-200",
              isDimmed(language.id) && "opacity-40",
              focusedId === language.id && "bg-theme-on-surface/8"
            )}
            {...focusHandlers(language.id)}
          >
            <span className="truncate font-mono text-sm opacity-85">
              {language.name}
            </span>
            <span className="bg-theme-on-surface/8 h-2 overflow-hidden rounded-full">
              <span
                className="animate-grow-bar block h-full rounded-full"
                style={{
                  animationDelay: `${100 + index * 60}ms`,
                  backgroundColor: chartColor(language),
                  width: `${(language.viewPercentage / maxPercentage) * 100}%`,
                }}
              />
            </span>
            <span className="text-right font-mono text-xs tabular-nums opacity-65">
              {language.viewPercentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>

      <p className="kicker mt-6 normal-case">
        {PERSONAS[persona].caption}
        {persona !== "fe" && (
          <>
            {" "}
            <span aria-hidden="true">🎮</span>
          </>
        )}
      </p>
    </div>
  );
};

export default StacksViz;
