<template>
  <div class="flex flex-col min-h-screen">
    <ClientOnly>
      <Banner v-if="isCurrent('Home')" />
    </ClientOnly>

    <Header :is-scrolled="isScrolled" />

    <main class="main-container relative flex-1 flex flex-col">
      <slot />
    </main>

    <BackToTop v-show="isScrolled" />

    <Footer />
  </div>
</template>

<script>
import { mapGetters } from "vuex";

import Banner from "~/components/layouts/Banner";
import Header from "~/components/layouts/Header";
import BackToTop from "~/components/layouts/BackToTop";
import Footer from "~/components/layouts/Footer";

export default {
  components: {
    Header,
    Footer,
    Banner,
    BackToTop
  },

  provide() {
    return {
      $getYOffset: () => this.yOffsett
    };
  },

  data() {
    return {
      isScrolled: false,
      indicatorWidth: 0,
      yOffsett: 0
    };
  },

  computed: {
    ...mapGetters({
      isCurrent: "page/isCurrent",
      cssVars: "page/isCurrent"
    })
  },

  created() {
    if (process.isClient) {
      window.addEventListener("scroll", this.onScroll);
      window.addEventListener("load", this.onScroll);
    }

    this.$bus.$on("toggle-theme", () => {
      this.$store.dispatch("page/CSS_VARIABLES");
    });
  },

  destroyed() {
    window.removeEventListener("scroll", this.onScroll);
    window.removeEventListener("load", this.onScroll);
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
        this.yOffsett = 100;
        return;
      }
      this.yOffsett = perc;
    }
  }
};
</script>

<style lang="scss" scoped>
#banner {
  height: calc(var(--header-height) * 2);
}
</style>
