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

import cssVars from "~/utils/mixins/cssVars.js";

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

  mixins: [cssVars],

  data() {
    return {
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

  inject: {
    settings: {
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

  destroyed() {
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
    }
  }
};
</script>

<style lang="scss" scoped>
#banner {
  height: calc(var(--header-height) * 2);
}
</style>
