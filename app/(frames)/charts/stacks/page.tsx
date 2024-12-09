import StacksChart from "@/components/landing/stacks/StacksChart";
import { fetchGitHubCommitStats } from "@/services/github";

interface LanguageStats {
  id: string;
  name: string;
  color: string;
  size: number;
  percentage?: number;
}

export const dynamic = "force-static";
export const revalidate = 86400;

export default async function StacksPage() {
  const data = await fetchGitHubCommitStats();
  const repositories = data.viewer.repositories.edges;

  const stats: Record<string, LanguageStats> = {};
  let total = 0;

  repositories
    .filter(({ node: { primaryLanguage } }) => primaryLanguage !== null)
    .forEach(({ node: { languages } }) => {
      languages.edges.forEach(({ node, size }) => {
        total += size;

        if (!stats[node.id]) {
          stats[node.id] = {
            color: node.color,
            id: node.id,
            name: node.name,
            size: 0,
          };
        }

        stats[node.id].size += size;

        // if (node.name === "JavaScript") {
        //   stats[node.id].name = "JavaScript (React,...)";
        // }
      });
    });

  // Calculate percentages
  Object.entries(stats).forEach(([key, value]) => {
    stats[key].percentage = +((value.size * 100) / total).toFixed(4);
  });

  // Remove insignificant languages (less than 1%)
  Object.entries(stats).forEach(([key, value]) => {
    if (value.percentage && value.percentage < 1) {
      delete stats[key];
    }
  });

  // Calculate "other" category
  const totalPercentage = Object.values(stats).reduce(
    (acc, { percentage = 0 }) => acc + percentage,
    0
  );

  stats["other"] = {
    color: "#AAAAAA",
    id: "other",
    name: "Other",
    percentage: 100 - totalPercentage,
    size: total - Object.values(stats).reduce((acc, { size }) => acc + size, 0),
  };

  const chartData = Object.values(stats).map((stat) => ({
    color: stat.color,
    label: stat.name,
    value: stat.size,
  }));

  return (
    <div className="p-0 md:p-4">
      <StacksChart chartData={chartData} />
    </div>
  );
}
