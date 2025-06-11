import Image from "@/components/common/NextImage";
import StacksChartFrame from "@/components/landing/stacks/StacksChartFrame";

const stacks = [
  {
    icon: "elixir.svg",
    link: "https://elixir-lang.org/",
    title: "Elixir",
  },
  {
    icon: "javascript.svg",
    link: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
    title: "JavaScript",
  },
  {
    icon: "react.svg",
    link: "https://reactjs.org/",
    title: "React",
  },
  {
    icon: "vue.svg",
    link: "https://vuejs.org/",
    title: "Vue",
  },
  {
    icon: "nodejs.svg",
    link: "https://nodejs.org/en/",
    title: "Node",
  },
  {
    icon: "sass.svg",
    link: "https://sass-lang.com/",
    title: "SASS",
  },
  {
    icon: "tailwindcss.svg",
    link: "https://tailwindcss.com/",
    title: "Tailwind",
  },
  {
    icon: "next.svg",
    link: "https://nextjs.org/",
    title: "Next.js",
  },
  {
    icon: "gridsome.svg",
    link: "https://gridsome.org",
    title: "Gridsome",
  },
  {
    icon: "git.svg",
    link: "https://git-scm.com/",
    title: "Git",
  },
];

export interface ChartData {
  label: string;
  value: number;
  color: string;
}

export default async function Stacks() {
  return (
    <section className="stacks">
      <div className="container">
        <h2 className="heading--section my-10 text-4xl">Stacks 📚</h2>

        <div className="flex flex-col lg:flex-row">
          <div className="flex-center mx-auto w-full md:w-2/3 lg:w-1/3">
            <Image
              src="/assets/resources/svg/Dev.svg"
              alt="Developer"
              width={500}
              height={500}
              style={{ objectFit: "cover" }}
              shouldShowBackground={false}
              unoptimized
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
              <a
                href={stack.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mx-auto inline-block text-center transition-transform duration-300 ease-in-out hover:scale-110"
              >
                <div className="flex-center mx-auto size-24">
                  <Image
                    src={`/assets/resources/svg/stacks/${stack.icon}`}
                    alt=""
                    width={150}
                    height={150}
                    style={{ objectFit: "contain" }}
                    shouldShowBackground={false}
                    unoptimized
                  />
                </div>
                <span className="text-xl font-bold leading-loose text-theme-on-surface">
                  {stack.title}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
