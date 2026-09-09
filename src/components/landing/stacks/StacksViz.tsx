"use client";

import {
  getLanguageShares,
  type LanguageShare,
  type LanguageStat,
} from "@/components/landing/stacks/language-shares";
import classNames from "classnames";
import { useState } from "react";

type PersonaKey = "all" | "fe" | "re";

/*
 * Personas exclude the other language set. Languages outside either set
 * remain in both filtered totals, then group by their share of that total.
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
    caption: "The full language mix returned by GitHub.",
    label: "Everything",
  },
  fe: {
    caption:
      "The same repositories, with the native and modding language group left out.",
    exclude: RE_SPECIFIC,
    label: "Front-end",
  },
  re: {
    caption: "The same repositories, with the web language group left out.",
    exclude: FE_SPECIFIC,
    label: "Reverse engineering",
  },
};

const DEFAULT_PERSONA: PersonaKey = "all";

/**
 * GitHub identity color (matching the repo cards below) through the
 * per-theme legibility tokens in (default)/_02_base.css; the catch-all
 * "Other" takes the neutral stop.
 */
function chartColor(language: LanguageShare): string {
  if (language.id === "other" || !language.color) {
    return "var(--chart-neutral)";
  }
  return `color-mix(in srgb, ${language.color} var(--lang-color-keep), var(--lang-color-tune))`;
}

/**
 * Shares use the selected language byte total. An Other row that rounds
 * to 0.0% is omitted; visible rows keep their original percentages.
 */
const StacksViz = ({ languages }: { languages: LanguageStat[] }) => {
  const [persona, setPersona] = useState<PersonaKey>(DEFAULT_PERSONA);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const active = getLanguageShares(languages, PERSONAS[persona].exclude);
  const maxPercentage = Math.max(
    ...active.map((language) => language.percentage),
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
      {/* Toggle buttons control one result group. Each keeps its normal
          keyboard activation and exposes the selected state. */}
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
            aria-controls="language-shares"
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
        aria-label={`${PERSONAS[persona].label} share of GitHub language bytes`}
        aria-describedby="language-share-scope"
      >
        {active.map((language, index) => (
          <span
            key={language.id}
            className={classNames(
              "animate-grow-bar block h-full cursor-pointer transition-opacity duration-200",
              isDimmed(language.id) && "opacity-30"
            )}
            title={`${language.name} ${language.percentage.toFixed(1)}%`}
            style={{
              animationDelay: `${index * 60}ms`,
              backgroundColor: chartColor(language),
              width: `${language.percentage}%`,
            }}
            {...focusHandlers(language.id)}
          />
        ))}
      </div>

      {/* Keyed like the bar above: switching persona must remount the rows
          so every grow-bar replays together. Without it React keeps the
          nodes a persona shares with the last one, and their finished
          animations leave those bars snapping to the new width while only
          the newly mounted rows grow. */}
      <div
        key={`rows-${persona}`}
        id="language-shares"
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
                  width: `${(language.percentage / maxPercentage) * 100}%`,
                }}
              />
            </span>
            <span className="text-right font-mono text-xs tabular-nums opacity-65">
              {language.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
        {active.length === 0 && (
          <p className="m-0 text-sm opacity-75">
            No language bytes available for this selection.
          </p>
        )}
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
      <p className="kicker mt-2 normal-case" id="language-share-scope">
        GitHub language bytes from up to 100 non-fork repositories, ordered by
        stars. This includes public and private repositories I own or access
        through organization membership or collaboration. These are repository
        sizes, not my contributions or time spent. Filtered views re-total the
        languages left.
      </p>
    </div>
  );
};

export default StacksViz;
