<template>
  <section class="stacks">
    <div class="container">
      <h2 class="heading--section my-10 text-4xl">
        Stacks 📚
      </h2>
      <div class="flex flex-col lg:flex-row">
        <div class="w-full lg:w-1/3 flex-center mx-auto">
          <g-image
            src="@/assets/resources/svg/Dev.svg"
            alt="Developer"
            width="500"
            height="500"
            fit="cover"
            blur="10"
            immediate="true"
          />
        </div>
        <div
          class="chart-container w-full lg:w-2/3 text-center overflow-hidden"
        >
          <ClientOnly>
            <fusioncharts
              type="pie3d"
              data-format="json"
              :container-background-opacity="0"
              :data-source="{
                chart: {
                  showpercentintooltip: '1',
                  captionFontSize: '20',
                  subcaptionFontSize: '18',
                  subcaptionFontBold: '0',
                  useDataPlotColorForLabels: '0',
                  labelFontColor: cssVars['on-background'],
                  labelFontBold: '1',
                  labelFontSize: '16',
                  showLabels: '0',
                  canvasBgAlpha: '0',
                  bgColor: '#ffffff',
                  bgAlpha: '0',
                  theme: 'fusion',
                  startingAngle: '0',
                  enablesmartlabels: '1',
                  showPercentValues: '1',
                  decimals: '1',
                  showLegend: '1',
                  legendBgColor: '#ffffff',
                  legendBgAlpha: '0',
                  legendBorderAlpha: '0',
                  legendShadow: '0',
                  legendItemFontSize: '16',
                  legendItemFontColor: cssVars['on-background'],
                  legendPosition: 'bottom',
                  minimiseWrappingInLegend: '1'
                },
                data: stats
              }"
              width="100%"
              height="500"
            />
          </ClientOnly>
          <div class="my-5">
            <h3 class="heading text-2xl">
              Tech Stacks
            </h3>
            <p class="italic">
              Based on Github commits
            </p>
          </div>
        </div>
      </div>
    </div>
    <div
      class="w-full bg-blue-900 py-24 mt-10 overflow-hidden shadow-lg"
      :style="{
        color: 'var(--on-primary-light)'
      }"
    >
      <h3 v-if="false" class="container heading text-4xl text-center mb-10">
        Utilized these
      </h3>
      <ul
        class="stacks-list grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10 md:gap-4"
      >
        <li v-for="stack in stacks" :key="stack.title" class="mx-auto">
          <a
            class="inline-block text-center mx-auto transition-transform duration-300 ease-in-out transform hover:scale-110"
            :href="stack.link"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div class="flex-center w-24 h-24 mx-auto">
              <g-image
                class="block max-w-full max-h-full m-auto pointer-events-none"
                :src="
                  require(`!!assets-loader?width=150&height=150&fit=cover&blur=10!~/assets/resources/svg/stacks/${stack.icon}`)
                "
                :alt="stack.title"
                width="150"
                height="150"
                fit="cover"
                blur="10"
                immediate="true"
              />
            </div>
            <span class="text-xl font-bold leading-loose">
              {{ stack.title }}
            </span>
          </a>
        </li>
      </ul>
    </div>
  </section>
</template>

<static-query>
  query github {
    github {
      viewer {
        repositories(
          orderBy: { field: STARGAZERS, direction: DESC }
          isFork: false
          affiliations: [OWNER, ORGANIZATION_MEMBER, COLLABORATOR]
          ownerAffiliations:[OWNER, ORGANIZATION_MEMBER, COLLABORATOR]
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
/**
 * Base icon path: `~/assets/resources/svg/stacks/`
 */
const stacks = [
  {
    title: "JavaScript",
    icon: "javascript.svg",
    link: "https://developer.mozilla.org/en-US/docs/Web/JavaScript"
  },
  {
    title: "CSS3",
    icon: "css-3.svg",
    link: "https://www.w3.org/TR/CSS/"
  },
  {
    title: "HTML5",
    icon: "html-5.svg",
    link: "https://html.spec.whatwg.org/"
  },
  {
    title: "React",
    icon: "react.svg",
    link: "https://reactjs.org/"
  },
  {
    title: "Vue",
    icon: "vue.svg",
    link: "https://vuejs.org/"
  },
  {
    title: "Node",
    icon: "nodejs.svg",
    link: "https://nodejs.org/en/"
  },
  {
    title: "SASS",
    icon: "sass.svg",
    link: "https://sass-lang.com/"
  },
  {
    title: "Tailwind",
    icon: "tailwindcss.svg",
    link: "https://tailwindcss.com/"
  },
  {
    title: "Gridsome",
    icon: "gridsome.svg",
    link: "https://gridsome.org"
  },
  {
    title: "Git",
    icon: "git.svg",
    link: "https://git-scm.com/"
  }
];

export default {
  data() {
    return {
      stacks
    };
  },

  inject: {
    $getCssVars: {
      type: Object,
      require: true
    }
  },

  computed: {
    cssVars() {
      return this.$getCssVars();
    },

    stats() {
      const {
        github: {
          viewer: {
            repositories: { edges }
          }
        }
      } = this.$static;

      const stats = {};
      let total = 0;

      edges
        .filter(({ node: { primaryLanguage } }) => primaryLanguage !== null)
        .forEach(({ node: { languages } }) => {
          languages.edges.forEach(({ node, size }) => {
            total += +size;

            stats[node.id] = {
              ...(stats[node.id] || {}),
              ...node,
              size: +(stats[node.id] || { size: 0 }).size + +size
            };

            if (node.name === "JavaScript") {
              stats[node.id].name = "JavaScript (React,...)";
            }
          });
        });

      Object.entries(stats).forEach(([key, { size }]) => {
        stats[key].percentage = +((size * 100) / total).toFixed(4);
      });

      Object.entries(stats).forEach(([key, { percentage }]) => {
        if (percentage < 1) {
          delete stats[key];
        }
      });

      Object.values(stats).reduce((acc, { percentage }) => {
        return acc + percentage;
      });

      stats.other = {
        id: "other",
        name: "Other",
        color: "#AAAAAA",
        size:
          total -
          Object.values(stats).reduce((acc, { size }) => {
            return acc + size;
          }, 0),
        percentage:
          100 -
          Object.values(stats).reduce((acc, { percentage }) => {
            return acc + percentage;
          }, 0)
      };

      return Object.values(stats).map((stat) => ({
        label: stat.name,
        value: stat.size,
        color: stat.color
      }));
    }
  }
};
</script>

<style lang="scss">
svg > g[class^="raphael-group-"] > text {
  display: none !important;
}
</style>
