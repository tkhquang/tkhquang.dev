<template>
  <section>
    <div class="container">
      <h2 class="heading--section my-10 text-4xl">
        Projects 💻
      </h2>
      <div>
        <h3 class="heading text-2xl my-10">Repositories</h3>
        <ul
          class="grid grid-cols-1 gap-10 md:gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          <li
            v-for="{
              id,
              url,
              name,
              description,
              stargazers,
              forkCount,
              primaryLanguage
            } in repositories"
            :key="id"
            class="transition-all duration-300 shadow-box surface transform hover:scale-105 hover:shadow-xl"
          >
            <a
              class="h-full px-5 py-8 flex flex-col justify-between"
              :href="url"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div>
                <h4 class="font-bold">{{ name }}</h4>
                <p class="mt-5 text-sm break-all">
                  {{ description }}
                </p>
              </div>
              <div class="flex mt-5 font-medium">
                <div class="flex-center">
                  <span
                    class="block w-4 h-4 rounded-full"
                    :style="{ backgroundColor: primaryLanguage.color }"
                  />
                  <span class="ml-2">{{ primaryLanguage.name }}</span>
                </div>
                <div class="flex-center ml-4 leading-none">
                  <v-icon name="star" class="w-4 h-4" />
                  <span class="ml-1">{{ stargazers.totalCount }}</span>
                </div>
                <div class="flex-center ml-4 leading-none">
                  <svg
                    class="w-4 h-4"
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
                  <span class="ml-1">{{ forkCount }}</span>
                </div>
              </div>
            </a>
          </li>
        </ul>
      </div>
      <div>
        <h3 class="heading text-2xl my-10">Demos</h3>
        <ul class="grid grid-cols-1 md:grid-cols-2 gap-10">
          <li
            v-for="{
              title,
              description,
              stacks,
              source,
              live,
              preview
            } in demos"
            :key="title"
            class="px-5 py-8 rounded-md shadow-box hover:shadow-box-md grid grid-flow-row surface transition-all duration-300"
          >
            <h4 class="text-lg font-bold text-center">
              {{ title }}
            </h4>
            <div class="my-10 block shadow-inner">
              <g-image
                :src="
                  require(`!!assets-loader?width=1280&height=720&fit=cover&blur=10!@/assets/resources/images/demos/${
                    preview || 'default.svg'
                  }`)
                "
                width="1280"
                height="720"
                quality="80"
                fit="cover"
                blur="10"
                class="object-contain object-center"
                alt="Preview"
                :style="{
                  backgroundImage: `linear-gradient(
                      to top right,
                      var(--secondary) 0%,
                      var(--darken) 100%
                    )`,
                  maxHeight: '280px'
                }"
              />
            </div>
            <p class="mx-4" v-html="description" />
            <ul class="flex-center flex-gap-2 my-5 mx-4">
              <li
                v-for="stack in stacks"
                :key="stack"
                class="inline-block py-2 px-4 primary rounded-md shadow-md hover:shadow-lg transition-all duration-300 select-none"
              >
                <span>{{ stack }}</span>
              </li>
            </ul>
            <div class="flex-center flex-gap-2">
              <a
                :href="live"
                target="_blank"
                rel="noopener noreferrer"
                class="button inline-block"
              >
                <span class="flex-center h-full">
                  Live Demo
                </span>
              </a>
              <a
                :href="source"
                target="_blank"
                rel="noopener noreferrer"
                class="button inline-block"
              >
                <span class="flex-center h-full">
                  Source
                </span>
              </a>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<static-query>
  query github {
    github {
      viewer {
        repositoriesContributedTo(
          contributionTypes: COMMIT
          first: 100
          orderBy: { field: STARGAZERS, direction: DESC }
        ) {
          edges {
            node {
              forkCount
              id
              url
              name
              nameWithOwner
            }
          }
        }
        repositories(
          orderBy: { field: STARGAZERS, direction: DESC }
          isFork: false
          affiliations: [OWNER, ORGANIZATION_MEMBER, COLLABORATOR]
          first: 100
        ) {
          edges {
            node {
              id
              name
              url
              description
              isPrivate
              stargazers {
                totalCount
              }
              forkCount
              primaryLanguage {
                color
                id
                name
              }
              isFork
              updatedAt
              languages(
                orderBy: { field: SIZE, direction: DESC }
                first: 100
              ) {
                edges {
                  node {
                    color
                    id
                    name
                  }
                  size
                }
              }
            }
          }
        }
      }
    }
  }
</static-query>

<script>
const demos = [
  {
    title: "Buggi Tracker",
    description: `A new generation bug tracker with role-based permissions. <br />You can log in with <em>reporter1/passa1</em> to test.`,
    stacks: ["React", "Firebase"],
    source: "https://github.com/tkhquang/buggi-tracker",
    live: "https://buggi-tracker.netlify.app",
    preview: "buggi-tracker.png"
  },
  {
    title: "Smart Watch Landing Page",
    description: "Landing Page for Smart Watch Company.",
    stacks: ["Vue", "SCSS"],
    source:
      "https://github.com/tkhquang/demo/tree/master/smart-watch-landing-page",
    live: "https://tkhquang-demo-smart-watch-landing-page.netlify.app",
    preview: "smart-watch.png"
  },
  {
    title: "React Calculator",
    description: "A simple yet fully functional Javascript calculator.",
    stacks: ["React", "SCSS"],
    source: "https://github.com/tkhquang/fcc-reactjs-calculator",
    live: "https://tkhquang.github.io/fcc-reactjs-calculator",
    preview: "calculator.png"
  },
  {
    title: "Vue Simple Accordion",
    description: "A simple, easily configurable accordion library for Vue 2.x.",
    stacks: ["Vue", "SCSS"],
    source: "https://github.com/tkhquang/vue-simple-accordion",
    live: "https://tkhquang.github.io/vue-simple-accordion",
    preview: "vue-accordion.png"
  }
];

export default {
  data() {
    return {
      demos
    };
  },

  computed: {
    repositories() {
      const {
        github: {
          viewer: {
            repositories: { edges }
          }
        }
      } = this.$static;

      const results = edges.filter(
        ({ node: { primaryLanguage, isPrivate } }) =>
          !isPrivate && primaryLanguage !== null
      );

      results.sort((a, b) => {
        if (
          a.node.stargazers.totalCount > 0 ||
          b.node.stargazers.totalCount > 0
        ) {
          return b.node.stargazers.totalCount - a.node.stargazers.totalCount;
        }

        return new Date(b.node.updatedAt) - new Date(a.node.updatedAt);
      });

      return results.slice(0, 12).map((item) => item.node);
    }
  }
};
</script>
