import Image from "@/components/common/NextImage";
import Reveal from "@/components/common/Reveal";
import SectionHeading from "@/components/common/SectionHeading";
import { fetchGitHubCommitStats } from "@/services/github";

const toolkit = [
  {
    icon: "typescript.svg",
    link: "https://www.typescriptlang.org/",
    title: "TypeScript",
  },
  {
    icon: "javascript.svg",
    link: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
    title: "JavaScript",
  },
  {
    icon: "react.svg",
    link: "https://react.dev/",
    title: "React",
  },
  {
    icon: "next.svg",
    link: "https://nextjs.org/",
    title: "Next.js",
  },
  {
    icon: "nodejs.svg",
    link: "https://nodejs.org/en/",
    title: "Node",
  },
  {
    icon: "tailwindcss.svg",
    link: "https://tailwindcss.com/",
    title: "Tailwind",
  },
  {
    icon: "elixir.svg",
    link: "https://elixir-lang.org/",
    title: "Elixir",
  },
  {
    icon: "c-plusplus.svg",
    link: "https://isocpp.org/",
    title: "C++",
  },
  {
    icon: "lua.svg",
    link: "https://www.lua.org/",
    title: "Lua",
  },
  {
    icon: "git.svg",
    link: "https://git-scm.com/",
    title: "Git",
  },
];

interface LanguageStat {
  id: string;
  name: string;
  size: number;
  percentage: number;
}

/**
 * Language share of GitHub commits, aggregated across repositories. Colors
 * come from the palette's categorical ramp, never from raw GitHub colors.
 */
async function getLanguageStats(): Promise<LanguageStat[]> {
  const data = await fetchGitHubCommitStats();
  const repositories = data.viewer.repositories.edges;

  const stats: Record<string, Omit<LanguageStat, "percentage">> = {};
  let total = 0;

  repositories
    .filter(({ node: { primaryLanguage } }) => primaryLanguage !== null)
    .forEach(({ node: { languages } }) => {
      languages.edges.forEach(({ node, size }) => {
        total += size;

        if (!stats[node.id]) {
          stats[node.id] = {
            id: node.id,
            name: node.name,
            size: 0,
          };
        }

        stats[node.id].size += size;
      });
    });

  if (total === 0) {
    return [];
  }

  const significant = Object.values(stats)
    .map((stat) => ({
      ...stat,
      percentage: (stat.size * 100) / total,
    }))
    .filter((stat) => stat.percentage >= 1)
    .sort((a, b) => b.percentage - a.percentage);

  const significantShare = significant.reduce(
    (acc, { percentage }) => acc + percentage,
    0
  );

  return [
    ...significant,
    {
      id: "other",
      name: "Other",
      percentage: 100 - significantShare,
      size: 0,
    },
  ];
}

/** Ramp position for a row: "Other" always takes the neutral last stop */
function chartColor(index: number, isOther: boolean): string {
  if (isOther) {
    return "var(--chart-6)";
  }
  return `var(--chart-${Math.min(index + 1, 6)})`;
}

export default async function Stacks() {
  const languages = await getLanguageStats();
  const maxPercentage = Math.max(
    ...languages.map((language) => language.percentage),
    1
  );

  return (
    <section className="stacks scroll-mt-header-height pt-8" id="stacks">
      <div className="container">
        <SectionHeading kicker="What I work with" title="Stacks" emoji="🧰" />

        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)]">
          <div className="flex-center mx-auto hidden w-full max-w-xs lg:flex">
            <Image
              src="/assets/resources/svg/Dev.svg"
              alt=""
              width={500}
              height={500}
              style={{ objectFit: "cover" }}
              shouldShowBackground={false}
              unoptimized
            />
          </div>

          <Reveal>
            <div
              className="flex h-3.5 overflow-hidden rounded-full"
              role="img"
              aria-label="Language share of GitHub commits"
            >
              {languages.map((language, index) => (
                <span
                  key={language.id}
                  className="block h-full"
                  style={{
                    backgroundColor: chartColor(
                      index,
                      language.id === "other"
                    ),
                    width: `${language.percentage}%`,
                  }}
                />
              ))}
            </div>

            <div className="mt-6 space-y-2.5">
              {languages.map((language, index) => (
                <div
                  key={language.id}
                  className="grid grid-cols-[7.5rem_minmax(0,1fr)_3.5rem] items-center gap-3"
                >
                  <span className="truncate font-mono text-sm opacity-85">
                    {language.name}
                  </span>
                  <span className="bg-theme-on-surface/8 h-2 overflow-hidden rounded-full">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        backgroundColor: chartColor(
                          index,
                          language.id === "other"
                        ),
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
              Based on GitHub commits. That C++ share is the game modding
              habit <span aria-hidden="true">🎮</span>
            </p>
          </Reveal>
        </div>
      </div>

      <Reveal className="bg-theme-surface border-theme-hairline-soft mt-14 w-full border-y py-8">
        <ul className="container flex flex-wrap items-center justify-center gap-3">
          {toolkit.map((stack) => (
            <li key={stack.title}>
              <a
                href={stack.link}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-theme-raised border-theme-hairline-soft hover:border-theme-primary/40 flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-all duration-200 hover:-translate-y-0.5"
              >
                <span className="flex-center size-5 shrink-0">
                  <Image
                    src={`/assets/resources/svg/stacks/${stack.icon}`}
                    alt=""
                    width={20}
                    height={20}
                    style={{ objectFit: "contain" }}
                    shouldShowBackground={false}
                    unoptimized
                  />
                </span>
                <span className="text-theme-on-surface font-mono text-xs font-semibold">
                  {stack.title}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
