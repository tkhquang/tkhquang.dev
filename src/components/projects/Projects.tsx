import Reveal from "@/components/common/Reveal";
import SectionHeading from "@/components/common/SectionHeading";
import { GrowingUnderline } from "@/components/ui/growing-underline";
import { fetchGitHubProjects } from "@/services/github";
import Link from "next/link";

/* Raw GitHub language colors survive only as these small identity dots */
const CPP_COLOR = "#f34b7d";

interface FeaturedProject {
  name: string;
  meta: string;
  metaColor: string;
  blurb: string;
  source: string;
  devlog?: { href: string; label: string };
}

const FEATURED: FeaturedProject[] = [
  {
    blurb:
      "The C++ toolkit under all my game mods: hooking, memory patching, configuration, and hot reload.",
    devlog: {
      href: "/blog/posts/hot-reload-in-a-live-process-the-two-binary-architecture",
      label: "Read the devlog",
    },
    meta: "C++23 · Library",
    metaColor: CPP_COLOR,
    name: "DetourModKit",
    source: "https://github.com/tkhquang/DetourModKit",
  },
  {
    blurb:
      "Mods for Kingdom Come: Deliverance II. The third person camera, gameplay tweaks, and the tooling underneath them.",
    devlog: {
      href: "/blog/posts/devlog-kingdom-come-deliverance-ii-building-a-proper-third-person-camera",
      label: "Read the devlog",
    },
    meta: "C++ · Game modding",
    metaColor: CPP_COLOR,
    name: "KCD2Tools",
    source: "https://github.com/tkhquang/KCD2Tools",
  },
  {
    blurb:
      "A collection of mods for Crimson Desert that enhance gameplay and add new features to the game.",
    meta: "C++ · Game modding",
    metaColor: CPP_COLOR,
    name: "CrimsonDesertTools",
    source: "https://github.com/tkhquang/CrimsonDesertTools",
  },
];

const LIST_SIZE = 6;

const Projects = async () => {
  const data = await fetchGitHubProjects();

  const featuredNames = new Set(FEATURED.map((project) => project.name));
  const repositories = data.viewer.repositories.edges
    .filter(
      ({ node }) =>
        !node.isPrivate &&
        node.primaryLanguage !== null &&
        !featuredNames.has(node.name)
    )
    .map(({ node }) => node)
    .sort((a, b) => {
      if (a.stargazers.totalCount > 0 || b.stargazers.totalCount > 0) {
        return b.stargazers.totalCount - a.stargazers.totalCount;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    })
    .slice(0, LIST_SIZE);

  return (
    <section
      className="projects scroll-mt-header-height container pt-16"
      id="projects"
    >
      <SectionHeading kicker="What I build" title="Projects" emoji="💻" />

      <Reveal className="grid gap-5 md:grid-cols-3">
        {FEATURED.map((project) => (
          <article
            key={project.name}
            className="bg-theme-raised border-theme-hairline-soft hover:border-theme-primary/40 flex flex-col gap-3 rounded-xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-1"
          >
            <div className="flex items-center gap-2 font-mono text-xs opacity-70">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: project.metaColor }}
              />
              {project.meta}
            </div>
            <h3 className="m-0 font-mono text-lg font-semibold">
              <a
                className="text-theme-primary"
                href={project.source}
                target="_blank"
                rel="noopener noreferrer"
              >
                <GrowingUnderline>{project.name}</GrowingUnderline>
              </a>
            </h3>
            <p className="m-0 flex-1 text-sm leading-relaxed">
              {project.blurb}
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-sm">
              <a
                href={project.source}
                target="_blank"
                rel="noopener noreferrer"
                className="text-theme-primary"
              >
                <GrowingUnderline>Source →</GrowingUnderline>
              </a>
              {project.devlog && (
                <Link href={project.devlog.href} className="text-theme-primary">
                  <GrowingUnderline>
                    {project.devlog.label} <span aria-hidden="true">✍️</span>
                  </GrowingUnderline>
                </Link>
              )}
            </div>
          </article>
        ))}
      </Reveal>

      <Reveal className="mt-6 grid gap-4 md:grid-cols-2" delay={100}>
        {repositories.map((repo) => (
          <div
            key={repo.id}
            className="border-theme-hairline-soft hover:border-theme-primary/40 rounded-lg border p-4 transition-colors duration-200"
          >
            <div className="flex items-baseline justify-between gap-3">
              <a
                className="text-theme-primary min-w-0 truncate font-mono text-sm font-semibold"
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <GrowingUnderline>{repo.name}</GrowingUnderline>
              </a>
              <span className="flex shrink-0 items-center gap-1.5 font-mono text-xs opacity-65">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: repo.primaryLanguage.color }}
                />
                {repo.primaryLanguage.name}
                <span aria-hidden="true">·</span>
                <span aria-label={`${repo.stargazers.totalCount} stars`}>
                  ★ {repo.stargazers.totalCount}
                </span>
              </span>
            </div>
            <p className="mt-1.5 mb-0 line-clamp-2 min-h-10 text-sm opacity-75">
              {repo.description}
            </p>
          </div>
        ))}
      </Reveal>

      <Reveal className="mt-8" delay={150}>
        <a
          href="https://github.com/tkhquang?tab=repositories"
          target="_blank"
          rel="noopener noreferrer"
          className="text-theme-primary font-mono text-sm"
        >
          <GrowingUnderline>
            Everything else lives on GitHub <span aria-hidden="true">🐣</span> →
          </GrowingUnderline>
        </a>
      </Reveal>
    </section>
  );
};

export default Projects;
