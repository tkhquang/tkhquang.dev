"use client";

import classNames from "classnames";
import { useState } from "react";

export interface LanguageShare {
  id: string;
  name: string;
  percentage: number;
}

type PersonaKey = "fe" | "re";

const PERSONAS: Record<PersonaKey, { label: string; languages: string[] }> = {
  fe: {
    label: "Front-end",
    languages: [
      "JavaScript",
      "TypeScript",
      "CSS",
      "HTML",
      "Vue",
      "SCSS",
      "Sass",
      "Elixir",
    ],
  },
  re: {
    label: "Reverse engineering",
    languages: ["C++", "C", "CMake", "Lua", "Python", "Assembly"],
  },
};

/** Ramp position for a row within the active persona */
function chartColor(index: number): string {
  return `var(--chart-${Math.min(index + 1, 6)})`;
}

/**
 * Language share of GitHub commits, filterable by persona. Percentages stay
 * relative to ALL commits (the honest number); the composition bar shows the
 * mix within the active persona.
 */
const StacksViz = ({ languages }: { languages: LanguageShare[] }) => {
  const [persona, setPersona] = useState<PersonaKey>("fe");

  const active = languages.filter((language) =>
    PERSONAS[persona].languages.includes(language.name)
  );
  const personaTotal = active.reduce(
    (acc, language) => acc + language.percentage,
    0
  );
  const maxPercentage = Math.max(
    ...active.map((language) => language.percentage),
    0.1
  );

  return (
    <div>
      <div
        role="tablist"
        aria-label="Filter languages by persona"
        className="border-theme-hairline-soft mb-6 inline-flex gap-1 rounded-lg border p-1"
      >
        {(Object.keys(PERSONAS) as PersonaKey[]).map((key) => (
          <button
            key={key}
            role="tab"
            aria-selected={persona === key}
            className={classNames(
              "cursor-pointer rounded-md px-3.5 py-1.5 font-mono text-xs font-semibold transition-colors duration-200",
              persona === key
                ? "bg-theme-primary text-theme-on-primary shadow-sm"
                : "opacity-70 hover:opacity-100"
            )}
            onClick={() => {
              setPersona(key);
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
            className="animate-grow-bar block h-full"
            style={{
              animationDelay: `${index * 60}ms`,
              backgroundColor: chartColor(index),
              width: `${(language.percentage / personaTotal) * 100}%`,
            }}
          />
        ))}
      </div>

      <div
        key={`rows-${persona}`}
        className="mt-6 grid gap-x-10 gap-y-2.5 md:grid-cols-2"
      >
        {active.map((language, index) => (
          <div
            key={language.id}
            className="grid grid-cols-[6.5rem_minmax(0,1fr)_3.5rem] items-center gap-3"
          >
            <span className="truncate font-mono text-sm opacity-85">
              {language.name}
            </span>
            <span className="bg-theme-on-surface/8 h-2 overflow-hidden rounded-full">
              <span
                className="animate-grow-bar block h-full rounded-full"
                style={{
                  animationDelay: `${100 + index * 60}ms`,
                  backgroundColor: chartColor(index),
                  width: `${(language.percentage / maxPercentage) * 100}%`,
                }}
              />
            </span>
            <span className="text-right font-mono text-xs tabular-nums opacity-65">
              {language.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>

      <p className="kicker mt-6 normal-case">
        Based on GitHub commits, share of everything I push. That C++ share is
        the game modding habit <span aria-hidden="true">🎮</span>
      </p>
    </div>
  );
};

export default StacksViz;
