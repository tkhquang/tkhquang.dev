<template>
  <div class="flex flex-col min-h-screen">
    <Banner v-if="isBlogPage" />

    <Header :is-scrolled="isScrolled" />

    <main class="main-container relative flex-1 flex flex-col">
      <slot />
    </main>

    <transition name="quick-fade">
      <Loader v-if="isLeaving" class="loader__leaving z-header" />
    </transition>

    <BackToTop v-show="isScrolled" />

    <Footer />
  </div>
</template>

<script>
import { helpers } from "~/utils/";
import pageMixin from "~/vue-utils/mixins/page";

import Loader from "~/components/common/Loader";
import Banner from "~/components/layouts/Banner";
import Header from "~/components/layouts/Header";
import BackToTop from "~/components/layouts/BackToTop";
import Footer from "~/components/layouts/Footer";

export default {
  components: {
    Loader,
    Header,
    Footer,
    Banner,
    BackToTop
  },

  mixins: [pageMixin],

  provide() {
    return {
      $getCssVars: () => this.cssVars,
      $getYOffset: () => this.yOffsett
    };
  },

  data() {
    return {
      isLeaving: false,
      cssVars: {},
      isScrolled: false,
      yOffsett: 0
    };
  },

  created() {
    if (process.isClient) {
      window.addEventListener("scroll", this.setYOffset);
      window.addEventListener("load", this.setYOffset);

      this.styleObserver = new MutationObserver(this.setCssVars);
      this.styleObserver.observe(global.document.body, {
        attributes: true,
        attributeFilter: ["data-theme", "style"]
      });

      // Might need to add polifills later
      if (typeof ResizeObserver === "function") {
        this.resizeObserver = new ResizeObserver(this.setYOffset);
        this.resizeObserver.observe(global.document.body);
      }
    }

    this.$bus.$on("route-leaving", (event) => {
      this.isLeaving = event;

      // Remove the loading overlay after 60s regardless
      if (event) {
        setTimeout(() => {
          this.isLeaving = false;
        }, 60000);
      }
    });
  },

  mounted() {
    if (process.isClient) {
      this.setCssVars();
    }
  },

  destroyed() {
    if (this.styleObserver) {
      this.styleObserver.disconnect();
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    window.removeEventListener("scroll", this.setYOffset);
    window.removeEventListener("load", this.setYOffset);
  },

  methods: {
    setCssVars() {
      this.cssVars = helpers.getCssVars();
    },

    setYOffset() {
      const headerHeight = this.cssVars["header-height"] || 60;

      const top = window.pageYOffset || 0;

      if (this.isHomePage) {
        this.isScrolled = top > 600 - 96;
      } else {
        this.isScrolled = top > parseInt(headerHeight) * 2;
      }

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
.loader__leaving {
  position: fixed;
  pointer-events: none;
  background-color: rgba(0, 0, 0, 0.3);
}
</style>
