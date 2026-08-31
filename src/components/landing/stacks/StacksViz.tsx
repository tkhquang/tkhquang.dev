"use client";

import Image from "@/components/common/NextImage";
import classNames from "classnames";
import { useState } from "react";

export interface LanguageShare {
  id: string;
  name: string;
  percentage: number;
}

type PersonaKey = "all" | "fe" | "re";

const PERSONAS: Record<PersonaKey, { label: string; languages?: string[] }> = {
  all: {
    label: "Everything",
  },
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
    languages: ["C++", "C", "CMake", "Lua", "Python", "Rust", "Assembly"],
  },
};

const DEFAULT_PERSONA: PersonaKey = "all";

interface ToolkitEntry {
  title: string;
  link: string;
  /** Brand mark under /assets/resources/svg/stacks; a dot fills in without one */
  icon?: string;
  dotColor?: string;
  /** Personas this belongs to; empty = general, shown only under Everything */
  personas: PersonaKey[];
}

const TOOLKIT: ToolkitEntry[] = [
  {
    icon: "typescript.svg",
    link: "https://www.typescriptlang.org/",
    personas: ["fe"],
    title: "TypeScript",
  },
  {
    icon: "javascript.svg",
    link: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
    personas: ["fe"],
    title: "JavaScript",
  },
  {
    icon: "react.svg",
    link: "https://react.dev/",
    personas: ["fe"],
    title: "React",
  },
  {
    icon: "vue.svg",
    link: "https://vuejs.org/",
    personas: ["fe"],
    title: "Vue",
  },
  {
    icon: "next.svg",
    link: "https://nextjs.org/",
    personas: ["fe"],
    title: "Next.js",
  },
  {
    icon: "nodejs.svg",
    link: "https://nodejs.org/en/",
    personas: ["fe"],
    title: "Node",
  },
  {
    icon: "tailwindcss.svg",
    link: "https://tailwindcss.com/",
    personas: ["fe"],
    title: "Tailwind",
  },
  {
    icon: "sass.svg",
    link: "https://sass-lang.com/",
    personas: ["fe"],
    title: "SASS",
  },
  {
    icon: "elixir.svg",
    link: "https://elixir-lang.org/",
    personas: ["fe"],
    title: "Elixir",
  },
  {
    icon: "phoenix.svg",
    link: "https://www.phoenixframework.org/",
    personas: ["fe"],
    title: "Phoenix",
  },
  {
    icon: "c-plusplus.svg",
    link: "https://isocpp.org/",
    personas: ["re"],
    title: "C++",
  },
  {
    icon: "rust.svg",
    link: "https://www.rust-lang.org/",
    personas: ["re"],
    title: "Rust",
  },
  {
    dotColor: "#DA3434",
    link: "https://cmake.org/",
    personas: ["re"],
    title: "CMake",
  },
  {
    icon: "lua.svg",
    link: "https://www.lua.org/",
    personas: ["re"],
    title: "Lua",
  },
  {
    dotColor: "#3572A5",
    link: "https://www.python.org/",
    personas: ["re"],
    title: "Python",
  },
  {
    icon: "git.svg",
    link: "https://git-scm.com/",
    personas: [],
    title: "Git",
  },
  {
    icon: "docker.svg",
    link: "https://www.docker.com/",
    personas: [],
    title: "Docker",
  },
];

/** Ramp position for a row; the catch-all "Other" takes the neutral stop */
function chartColor(index: number, isOther: boolean): string {
  if (isOther) {
    return "var(--chart-6)";
  }
  return `var(--chart-${Math.min(index + 1, 6)})`;
}

/**
 * Language share of GitHub commits plus the toolkit, filterable by persona.
 * The tabs drive both the chart and the chip band: the chart carries the
 * honest commit data, the chips carry the frameworks and tools the commit
 * numbers cannot show. Percentages stay relative to ALL commits.
 */
const StacksViz = ({ languages }: { languages: LanguageShare[] }) => {
  const [persona, setPersona] = useState<PersonaKey>(DEFAULT_PERSONA);

  const personaLanguages = PERSONAS[persona].languages;
  const active = personaLanguages
    ? languages.filter((language) => personaLanguages.includes(language.name))
    : languages;
  const personaTotal = active.reduce(
    (acc, language) => acc + language.percentage,
    0
  );
  const maxPercentage = Math.max(
    ...active.map((language) => language.percentage),
    0.1
  );

  const chips = TOOLKIT.filter(
    (entry) => persona === "all" || entry.personas.includes(persona)
  );

  return (
    <div>
      <div className="container">
        <div
          role="tablist"
          aria-label="Filter the stacks by persona"
          className="border-theme-hairline-soft mb-6 inline-flex flex-wrap gap-1 rounded-lg border p-1"
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
                backgroundColor: chartColor(index, language.id === "other"),
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
                    backgroundColor: chartColor(index, language.id === "other"),
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

      <div className="bg-theme-surface border-theme-hairline-soft mt-14 w-full border-y py-8">
        <ul
          key={`chips-${persona}`}
          className="container flex flex-wrap items-center justify-center gap-3"
        >
          {chips.map((stack) => (
            <li key={stack.title} className="animate-rise-in">
              <a
                href={stack.link}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-theme-raised border-theme-hairline-soft hover:border-theme-primary/40 flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-all duration-200 hover:-translate-y-0.5"
              >
                <span className="flex-center size-5 shrink-0">
                  {stack.icon ? (
                    <Image
                      src={`/assets/resources/svg/stacks/${stack.icon}`}
                      alt=""
                      width={20}
                      height={20}
                      style={{ objectFit: "contain" }}
                      shouldShowBackground={false}
                      unoptimized
                    />
                  ) : (
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: stack.dotColor }}
                    />
                  )}
                </span>
                <span className="text-theme-on-surface font-mono text-xs font-semibold">
                  {stack.title}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default StacksViz;
