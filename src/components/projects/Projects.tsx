import SectionHeading from "@/components/common/SectionHeading";
import { GrowingUnderline } from "@/components/ui/growing-underline";
import { fetchGitHubProjects } from "@/services/github";
import Link from "next/link";
import { GoRepo, GoRepoForked, GoStar } from "react-icons/go";

interface FeaturedProject {
  name: string;
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
    name: "KCD2Tools",
    source: "https://github.com/tkhquang/KCD2Tools",
  },
  {
    blurb:
      "A collection of mods for Crimson Desert that enhance gameplay and add new features to the game.",
    name: "CrimsonDesertTools",
    source: "https://github.com/tkhquang/CrimsonDesertTools",
  },
];

const LIST_SIZE = 6;

/* 75 percent, not 65: dark-theme text at 65 measures 4.0 to 1 on the
   raised card, under the 4.5 contrast floor */
const REPO_META_CLASS =
  "flex shrink-0 items-center gap-1 font-mono text-xs opacity-75";

const Projects = async () => {
  const data = await fetchGitHubProjects();

  const publicRepos = data.viewer.repositories.edges
    .filter(({ node }) => !node.isPrivate)
    .map(({ node }) => node);

  /* Featured lookup tolerates repos without a detected language yet */
  const repoByName = new Map(publicRepos.map((repo) => [repo.name, repo]));
  const featuredNames = new Set(FEATURED.map((project) => project.name));

  const repositories = publicRepos
    .filter(
      (repo) => repo.primaryLanguage !== null && !featuredNames.has(repo.name)
    )
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

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {FEATURED.map((project) => {
          const live = repoByName.get(project.name);

          return (
            <article
              key={project.name}
              className="bg-theme-raised border-theme-hairline-soft hover:border-theme-primary/40 flex flex-col gap-3 rounded-xl border p-5 shadow-sm transition-all duration-200"
            >
              <div className="flex min-w-0 items-center gap-2">
                <GoRepo className="size-4 shrink-0 opacity-65" />
                <a
                  className="text-theme-primary min-w-0 truncate font-mono text-base font-semibold"
                  href={live?.url ?? project.source}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GrowingUnderline>{project.name}</GrowingUnderline>
                </a>
              </div>
              <p className="m-0 flex-1 text-sm leading-relaxed">
                {project.blurb}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                {live?.primaryLanguage && (
                  <span className={REPO_META_CLASS}>
                    <span
                      className="size-2.5 rounded-full"
                      style={{
                        backgroundColor: live.primaryLanguage.color,
                      }}
                    />
                    {live.primaryLanguage.name}
                  </span>
                )}
                <span
                  className={REPO_META_CLASS}
                  aria-label={`${live?.stargazers.totalCount ?? 0} stars`}
                >
                  <GoStar className="size-3.5" />
                  {live?.stargazers.totalCount ?? 0}
                </span>
                <span
                  className={REPO_META_CLASS}
                  aria-label={`${live?.forkCount ?? 0} forks`}
                >
                  <GoRepoForked className="size-3.5" />
                  {live?.forkCount ?? 0}
                </span>
              </div>
              {/* Always reserve this line so meta rows align across cards */}
              <div className="min-h-6">
                {project.devlog && (
                  <Link
                    href={project.devlog.href}
                    className="text-theme-primary font-mono text-sm"
                  >
                    <GrowingUnderline>
                      {project.devlog.label} <span aria-hidden="true">✍️</span>
                    </GrowingUnderline>
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {repositories.map((repo) => (
          <div
            key={repo.id}
            className="border-theme-hairline-soft hover:border-theme-primary/40 rounded-lg border p-4 transition-colors duration-200"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <GoRepo className="size-3.5 shrink-0 opacity-65" />
                <a
                  className="text-theme-primary min-w-0 truncate font-mono text-sm font-semibold"
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GrowingUnderline>{repo.name}</GrowingUnderline>
                </a>
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span className={REPO_META_CLASS}>
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: repo.primaryLanguage.color }}
                  />
                  {repo.primaryLanguage.name}
                </span>
                <span
                  className={REPO_META_CLASS}
                  aria-label={`${repo.stargazers.totalCount} stars`}
                >
                  <GoStar className="size-3.5" />
                  {repo.stargazers.totalCount}
                </span>
                <span
                  className={REPO_META_CLASS}
                  aria-label={`${repo.forkCount} forks`}
                >
                  <GoRepoForked className="size-3.5" />
                  {repo.forkCount}
                </span>
              </span>
            </div>
            <p className="mt-1.5 mb-0 line-clamp-2 min-h-10 text-sm opacity-75">
              {repo.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <a
          href="https://github.com/tkhquang"
          target="_blank"
          rel="noopener noreferrer"
          className="text-theme-primary font-mono text-sm"
        >
          <GrowingUnderline>
            Everything else lives on GitHub <span aria-hidden="true">🐣</span> →
          </GrowingUnderline>
        </a>
      </div>
    </section>
  );
};

export default Projects;
