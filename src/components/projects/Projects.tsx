import Image from "@/components/common/NextImage";
import { fetchGitHubProjects } from "@/services/github";
import { getProcessedImage } from "@/utils/image";

interface Demo {
  title: string;
  description: string;
  stacks: string[];
  source: string;
  live: string;
  preview: string;
}

// Static demo data
const demos: Demo[] = [
  {
    description: `A new generation bug tracker with role-based permissions. <br />You can log in with <em>reporter1</em><em>/</em><em>passa1</em> to test.`,
    live: "https://buggi-tracker.netlify.app",
    preview: "/assets/resources/images/demos/buggi-tracker.png",
    source: "https://github.com/tkhquang/buggi-tracker",
    stacks: ["React", "Firebase"],
    title: "Buggi Tracker",
  },
  {
    description: "Landing Page for Smart Watch Company.",
    live: "https://tkhquang-demo-smart-watch-landing-page.netlify.app",
    preview: "/assets/resources/images/demos/smart-watch.png",
    source:
      "https://github.com/tkhquang/demo/tree/master/smart-watch-landing-page",
    stacks: ["Vue", "SCSS"],
    title: "Smart Watch Landing Page",
  },
  {
    description: "A simple yet fully functional Javascript calculator.",
    live: "https://tkhquang.github.io/fcc-reactjs-calculator",
    preview: "/assets/resources/images/demos/calculator.png",
    source: "https://github.com/tkhquang/fcc-reactjs-calculator",
    stacks: ["React", "SCSS"],
    title: "React Calculator",
  },
  {
    description: "A simple, easily configurable accordion library for Vue 2.x.",
    live: "https://tkhquang.github.io/vue-simple-accordion",
    preview: "/assets/resources/images/demos/vue-accordion.png",
    source: "https://github.com/tkhquang/vue-simple-accordion",
    stacks: ["Vue", "SCSS"],
    title: "Vue Simple Accordion",
  },
];

const Projects = async () => {
  const data = await fetchGitHubProjects();

  const repositories = data.viewer.repositories.edges
    .filter(({ node }) => !node.isPrivate && node.primaryLanguage !== null)
    .map(({ node }) => node)
    .sort((a, b) => {
      if (a.stargazers.totalCount > 0 || b.stargazers.totalCount > 0) {
        return b.stargazers.totalCount - a.stargazers.totalCount;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    })
    .slice(0, 12);

  async function getDemoDataWithImages(demos: Demo[]) {
    return Promise.all(
      demos.map(async (demo) => {
        const image = await getProcessedImage({
          source: demo.preview,
          shouldStore: false,
          cache: true,
        });
        return { ...demo, image };
      })
    );
  }

  const demosWithImages = await getDemoDataWithImages(demos);

  return (
    <section className="projects">
      <div className="container">
        <h2 className="heading--section my-10 text-4xl">Projects 💻</h2>

        {/* Repositories Section */}
        <div>
          <h3 className="heading my-10 text-2xl">Repositories</h3>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
            {repositories.map((repo) => (
              <li
                key={repo.id}
                className="surface shadow-box transition-all duration-300 hover:shadow-xl md:hover:scale-105"
              >
                <a
                  className="flex h-full flex-col justify-between px-5 py-8"
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div>
                    <h4 className="font-bold">{repo.name}</h4>
                    <p className="mt-5 text-sm">{repo.description}</p>
                  </div>
                  <div className="mt-5 flex font-medium">
                    <div className="flex-center">
                      <span
                        className="block size-4 rounded-full"
                        style={{ backgroundColor: repo.primaryLanguage.color }}
                      />
                      <span className="ml-2">{repo.primaryLanguage.name}</span>
                    </div>
                    <div className="flex-center ml-4 leading-none">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-4"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                      <span className="ml-1">{repo.stargazers.totalCount}</span>
                    </div>
                    <div className="flex-center ml-4 leading-none">
                      <svg
                        className="size-4"
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="var(--on-background)"
                          d="M21 3c0-1.657-1.343-3-3-3s-3 1.343-3 3c0 1.323.861 2.433 2.05 2.832.168 4.295-2.021 4.764-4.998 5.391-1.709.36-3.642.775-5.052 2.085v-7.492c1.163-.413 2-1.511 2-2.816 0-1.657-1.343-3-3-3s-3 1.343-3 3c0 1.305.837 2.403 2 2.816v12.367c-1.163.414-2 1.512-2 2.817 0 1.657 1.343 3 3 3s3-1.343 3-3c0-1.295-.824-2.388-1.973-2.808.27-3.922 2.57-4.408 5.437-5.012 3.038-.64 6.774-1.442 6.579-7.377 1.141-.425 1.957-1.514 1.957-2.803zm-16.8 0c0-.993.807-1.8 1.8-1.8s1.8.807 1.8 1.8-.807 1.8-1.8 1.8-1.8-.807-1.8-1.8zm3.6 18c0 .993-.807 1.8-1.8 1.8s-1.8-.807-1.8-1.8.807-1.8 1.8-1.8 1.8.807 1.8 1.8zm10.2-16.2c-.993 0-1.8-.807-1.8-1.8s.807-1.8 1.8-1.8 1.8.807 1.8 1.8-.807 1.8-1.8 1.8z"
                        />
                      </svg>
                      <span className="ml-1">{repo.forkCount}</span>
                    </div>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Demos Section */}
        <div>
          <h3 className="heading my-10 text-2xl">Demos</h3>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-10">
            {demosWithImages.map((demo) => {
              const image = demo.image;

              return (
                <li
                  key={demo.title}
                  className="surface shadow-box hover:shadow-box-md flex h-full flex-col rounded-md px-5 py-8 transition-all duration-300"
                >
                  <div className="flex flex-col">
                    <h4 className="text-center text-lg font-bold">
                      {demo.title}
                    </h4>
                    <div className="my-4 block shadow-inner">
                      <div className="relative aspect-video w-full">
                        <Image
                          fill
                          src={
                            image.source ||
                            "/assets/resources/images/demos/default.svg"
                          }
                          alt={demo.title}
                          className="bg-cover bg-center bg-no-repeat"
                          style={{
                            backgroundImage: `linear-gradient(to top right, var(--secondary) 0%, var(--darken) 100%)`,
                            objectFit: "contain",
                            objectPosition: "center",
                          }}
                          blurDataURL={image.placeholder}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <p
                      className="mx-4 leading-normal"
                      dangerouslySetInnerHTML={{ __html: demo.description }}
                    />
                    <div className="flex flex-col">
                      <ul className="flex-center mx-4 my-4 gap-0.5">
                        {demo.stacks.map((stack) => (
                          <li
                            key={stack}
                            className="primary inline-block rounded-md px-4 py-2 leading-normal shadow-md transition-all duration-300 select-none hover:shadow-lg"
                          >
                            {stack}
                          </li>
                        ))}
                      </ul>
                      <div className="flex-center gap-0.5">
                        <a
                          href={demo.live}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="button inline-block"
                        >
                          <span className="flex-center h-full">Live Demo</span>
                        </a>
                        <a
                          href={demo.source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="button inline-block"
                        >
                          <span className="flex-center h-full">Source</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default Projects;
