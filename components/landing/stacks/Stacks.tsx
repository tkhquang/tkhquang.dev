import StacksChartFrame from "@/components/landing/stacks/StacksChartFrame";
import Image from "next/image";
import Link from "next/link";

const stacks = [
  {
    title: "Elixir",
    icon: "elixir.svg",
    link: "https://elixir-lang.org/",
  },
  {
    title: "JavaScript",
    icon: "javascript.svg",
    link: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
  },
  {
    title: "React",
    icon: "react.svg",
    link: "https://reactjs.org/",
  },
  {
    title: "Vue",
    icon: "vue.svg",
    link: "https://vuejs.org/",
  },
  {
    title: "Node",
    icon: "nodejs.svg",
    link: "https://nodejs.org/en/",
  },
  {
    title: "SASS",
    icon: "sass.svg",
    link: "https://sass-lang.com/",
  },
  {
    title: "Tailwind",
    icon: "tailwindcss.svg",
    link: "https://tailwindcss.com/",
  },
  {
    title: "Next.js",
    icon: "next.svg",
    link: "https://nextjs.org/",
  },
  {
    title: "Gridsome",
    icon: "gridsome.svg",
    link: "https://gridsome.org",
  },
  {
    title: "Git",
    icon: "git.svg",
    link: "https://git-scm.com/",
  },
];

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

export default async function Stacks(): Promise<JSX.Element> {
  return (
    <section className="stacks">
      <div className="container">
        <h2 className="heading--section my-10 text-4xl">Stacks 📚</h2>

        <div className="flex flex-col lg:flex-row">
          <div className="flex-center mx-auto w-full lg:w-1/3">
            <Image
              src="/assets/resources/svg/Dev.svg"
              alt="Developer"
              width={500}
              height={500}
              style={{ objectFit: "cover" }}
            />
          </div>

          <div className="chart-container w-full text-center lg:w-2/3">
            <StacksChartFrame />
          </div>
        </div>
      </div>

      <div
        className="mt-10 w-full overflow-hidden bg-theme-surface py-24 shadow-lg"
        style={{ color: "var(--on-primary-light)" }}
      >
        <ul className="stacks-list grid grid-cols-2 gap-10 md:grid-cols-3 md:gap-4 lg:grid-cols-5">
          {stacks.map((stack) => (
            <li key={stack.title} className="mx-auto">
              <Link
                href={stack.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mx-auto inline-block text-center transition-transform duration-300 ease-in-out hover:scale-110"
              >
                <div className="flex-center mx-auto size-24">
                  <Image
                    src={`/assets/resources/svg/stacks/${stack.icon}`}
                    alt={stack.title}
                    width={150}
                    height={150}
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <span className="text-xl font-bold leading-loose text-theme-on-surface">
                  {stack.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
