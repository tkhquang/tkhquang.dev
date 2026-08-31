import Reveal from "@/components/common/Reveal";
import SectionHeading from "@/components/common/SectionHeading";
import StacksViz from "@/components/landing/stacks/StacksViz";
import { fetchGitHubCommitStats } from "@/services/github";

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

export default async function Stacks() {
  const languages = await getLanguageStats();

  return (
    <section className="stacks scroll-mt-header-height pt-8" id="stacks">
      <div className="container">
        <SectionHeading kicker="What I work with" title="Stacks" emoji="🧰" />
      </div>

      <Reveal>
        <StacksViz
          languages={languages.map(({ id, name, percentage }) => ({
            id,
            name,
            percentage,
          }))}
        />
      </Reveal>
    </section>
  );
}
