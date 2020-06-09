<template>
  <div class="flex flex-col min-h-screen">
    <Banner v-if="isHomePage" />

    <Indicator v-if="isDetailedPostPage" :width="indicatorWidth" />

    <Header :is-scrolled="isScrolled" />

    <main class="main-container relative flex-1 flex flex-col">
      <slot />
    </main>

    <BackToTop v-show="isScrolled" />

    <Footer />
  </div>
</template>

<script>
import debounce from "lodash/debounce";

import Banner from "~/components/layouts/Banner";
import Header from "~/components/layouts/Header";
import BackToTop from "~/components/layouts/BackToTop";
import Footer from "~/components/layouts/Footer";
import Indicator from "~/components/layouts/Indicator";

export default {
  components: {
    Header,
    Footer,
    Banner,
    BackToTop,
    Indicator
  },

  provide() {
    return {
      $getCssVars: () => this.cssVars
    };
  },

  data() {
    return {
      cssVars: {},
      isScrolled: false,
      indicatorWidth: 0
    };
  },

  computed: {
    isHomePage() {
      return /^\/(\d.+)?$/.test(this.$route.path);
    },
    isDetailedPostPage() {
      return /^\/posts\/.*/.test(this.$route.path);
    }
  },

  // Unused for now
  inject: {
    $settings: {
      type: Object,
      required: true
    }
  },

  created() {
    this.handleScroll = debounce(this.onScroll, 10);
    if (process.isClient) {
      window.addEventListener("scroll", this.handleScroll);
    }
  },

  mounted() {
    this.setCssVariables();

    this.observer = new MutationObserver(this.setCssVariables);
    this.observer.observe(global.document.body, {
      attributes: true,
      attributeFilter: ["data-theme", "style"]
    });

    // const mediaQuery = global.matchMedia("(min-width:640px)");
    // mediaQuery.onchange = () => {
    //   this.setCssVariables();
    // };
  },

  destroyed() {
    this.observer.disconnect();
    window.removeEventListener("scroll", this.handleScroll);
  },

  methods: {
    onScroll(e) {
      const top = window.pageYOffset || e.target.scrollTop || 0;
      this.isScrolled = top > parseInt(this.cssVars["header-height"]) * 2;

      const scrollPos = window.scrollY;
      const winHeight = window.innerHeight;
      const docHeight = window.document.documentElement.scrollHeight;
      const perc = (100 * scrollPos) / (docHeight - winHeight);
      if (perc > 100) {
        this.indicatorWidth = 100;
        return;
      }
      this.indicatorWidth = perc;
    },

    setCssVariables() {
      this.cssVars = {
        ...this.getCssVariable("--header-height"),
        ...this.getCssVariable("--tone-1"),
        ...this.getCssVariable("--tone-2"),
        ...this.getCssVariable("--tone-3"),
        ...this.getCssVariable("--primary"),
        ...this.getCssVariable("--secondary"),
        ...this.getCssVariable("--background"),
        ...this.getCssVariable("--surface"),
        ...this.getCssVariable("--on-primary"),
        ...this.getCssVariable("--on-secondary"),
        ...this.getCssVariable("--on-background"),
        ...this.getCssVariable("--on-surface"),
        ...this.getCssVariable("--error")
      };
    },

    // Get or set a css variable from body
    getCssVariable(name, value) {
      if (process.isClient) {
        if (name.substr(0, 2) !== "--") {
          name = "--" + name;
        }

        if (value) {
          global.document.body.style.setProperty(name, value);
        }

        return {
          [name.replace(/^--/, "")]: global
            .getComputedStyle(global.document.body)
            .getPropertyValue(name)
            .trim()
        };
      }
    }
  }
};
</script>

<style lang="scss" scoped>
#banner {
  height: calc(var(--header-height) * 2);
}
</style>
