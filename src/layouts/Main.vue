<template>
  <div class="flex flex-col min-h-screen">
    <div v-if="isHomePage" class="banner relative flex-center px-12 background">
      <ParticlesJS class="w-full" />
    </div>

    <div
      v-if="/^\/posts\/.*/.test($route.path)"
      id="indicator"
      class="fixed left-0 h-5px z-50 primary"
      :style="`width: ${indicator}%`"
    />

    <header
      class="header flex-center sticky inset-0 w-full px-4 sm:px-6 lg:px-8 z-40 transition-all duration-300 ease-in-out background"
      :class="{ 'header--is-scrolled': isScrolled }"
    >
      <div class="container mx-auto flex justify-between items-center">
        <div class="header__left">
          <Logo :show-back-button="!isHomePage" @click.native="toTop" />
        </div>
        <div class="header__right">
          <ToggleTheme class="ml-4" />
        </div>
      </div>
    </header>

    <main class="main-container relative flex-1 flex flex-col">
      <slot />
    </main>

    <div
      v-show="isScrolled"
      class="fixed right-0 bottom-0 w-10 h-10 cursor-pointer z-10 m-10 hover:opacity-75"
      title="Scroll To Top"
      @scroll="onScroll"
      @click="toTop"
    >
      <v-icon name="arrow-up-circle" class="w-10 h-10"></v-icon>
    </div>

    <footer class="footer text-center py-4 mt-auto flex-center">
      Copyright © {{ new Date().getFullYear() }}&nbsp;-&nbsp;
      <a
        href="https://github.com/tkhquang"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center justify-center"
      >
        Aleks Quang Trinh&nbsp;
        <v-icon name="github" class="w-4 h-4"></v-icon>
      </a>
    </footer>
  </div>
</template>

<script>
import cssVars from "~/utils/mixins/cssVars.js";

import ToggleTheme from "~/components/ToggleTheme.vue";
import Logo from "~/components/Logo.vue";
import ParticlesJS from "~/components/ParticlesJS";

// Import typefaces
import "typeface-montserrat";
import "typeface-merriweather";

export default {
  components: {
    ToggleTheme,
    Logo,
    ParticlesJS
  },

  mixins: [cssVars],

  data() {
    return {
      isScrolled: false,
      indicator: 0
    };
  },

  computed: {
    isHomePage() {
      return /^\/(\d.+)?$/.test(this.$route.path);
    }
  },

  inject: {
    settings: {
      type: Object,
      required: true
    }
  },

  created() {
    if (process.isClient) {
      global.addEventListener("scroll", this.onScroll);
    }
  },

  destroyed() {
    if (process.isClient) {
      global.removeEventListener("scroll", this.onScroll);
    }
  },

  methods: {
    onScroll(e) {
      if (process.isClient) {
        const top = global.pageYOffset || e.target.scrollTop || 0;
        this.isScrolled = top > parseInt(this.cssVars["header-height"]) * 2;

        const scrollPos = global.scrollY;
        const winHeight = global.innerHeight;
        const docHeight = global.document.documentElement.scrollHeight;
        const perc = (100 * scrollPos) / (docHeight - winHeight);
        if (perc > 100) {
          this.indicator = 100;
          return;
        }
        this.indicator = perc;
      }
    },

    toTop() {
      if (process.isClient) {
        global.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }
};
</script>

<style lang="scss" scoped>
#particles-js {
  height: calc(var(--header-height) * 2);
}

#indicator {
  top: var(--header-height);
}

.header {
  min-height: var(--header-height);
  box-shadow: 0px 3px 3px rgba($color: #000000, $alpha: 0.1);

  &--is-scrolled {
    //
  }

  &__left,
  &__right {
    display: flex;
    align-items: center;
  }
}
</style>
