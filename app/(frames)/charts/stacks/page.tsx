import StacksChart from "@/components/landing/stacks/StacksChart";
import { fetchGitHubCommitStats } from "@/services/github";

// Define repository and language types
interface LanguageNode {
  id: string;
  name: string;
  color: string;
}

interface LanguageEdge {
  node: LanguageNode;
  size: number;
}

interface RepositoryNode {
  id: string;
  name: string;
  url: string;
  description: string;
  isPrivate: boolean;
  stargazers: { totalCount: number };
  forkCount: number;
  primaryLanguage: LanguageNode | null;
  isFork: boolean;
  updatedAt: string;
  languages: { edges: LanguageEdge[] };
}

interface RepositoryEdge {
  node: RepositoryNode;
}

interface GitHubData {
  viewer: {
    repositories: {
      edges: RepositoryEdge[];
    };
  };
}

// Type for the stats object
interface LanguageStats {
  id: string;
  name: string;
  color: string;
  size: number;
  percentage?: number;
}

export interface ChartData {
  label: string;
  value: number;
  color: string;
}

export const dynamic = "force-static";
export const revalidate = 86400;

export default async function StacksPage() {
  const data: GitHubData = await fetchGitHubCommitStats();
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
            id: node.id,
            name: node.name,
            color: node.color,
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
    id: "other",
    name: "Other",
    color: "#AAAAAA",
    size: total - Object.values(stats).reduce((acc, { size }) => acc + size, 0),
    percentage: 100 - totalPercentage,
  };

  const chartData = Object.values(stats).map((stat) => ({
    label: stat.name,
    value: stat.size,
    color: stat.color,
  }));

  return (
    <div className="p-0 md:p-4">
      <StacksChart chartData={chartData} />
    </div>
  );
}
