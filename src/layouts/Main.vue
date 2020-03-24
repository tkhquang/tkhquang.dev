<template slot-scope="cssVars">
  <div class="flex flex-col min-h-screen">
    <div id="indicator" :style="`width: ${indicator}%`"></div>

    <div class="banner relative">
      <ParticlesJS class="" />
    </div>

    <header
      class="header container mx-auto"
      :class="{ 'header--is-scrolled': fab }"
    >
      <div class="header__left">
        <Logo :show-logo="showLogo" :fab="fab" @click.native="toTop" />
        <ToggleTheme class="ml-4" />
      </div>
      <div class="header__right"></div>
    </header>
    <main class="main-container">
      <slot />
    </main>
    <div
      v-show="fab"
      class="fixed right-0 bottom-0 w-10 h-10 cursor-pointer z-10 m-10"
      title="Scroll To Top"
      @scroll="onScroll"
      @click="toTop"
    >
      <v-icon name="arrow-up-circle"></v-icon>
    </div>
    <footer class="footer text-center py-4 mt-auto flex-center">
      Copyright © {{ new Date().getFullYear() }}&nbsp;-&nbsp;<a
        href="https://github.com/tkhquang"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center justify-center"
      >
        Aleks Quang Trinh&nbsp;<v-icon name="github" class="w-4 h-4"></v-icon
      ></a>
    </footer>
  </div>
</template>

<script>
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
  data: () => ({
    fab: false,
    indicator: 0
  }),
  computed: {
    showLogo() {
      return this.$route.path !== "/";
    }
  },
  inject: {
    settings: {
      type: Object,
      required: true
    },
    cssVars: {
      type: Object,
      default: () => ({})
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
        this.fab = top > parseInt(this.cssVars["header-height"]) * 2;

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

<style lang="scss">
#particles-js {
  position: relative;
  width: 100%;
  height: calc(var(--header-height) * 2);
  background-color: transparent;
}

#indicator {
  position: fixed;
  top: 0;
  left: 0;
  height: 5px;
  background-color: rgb(68, 98, 180);
  z-index: 20;
}

.banner {
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(var(--header-height) * 2);
  padding: 0 calc(var(--space) / 2);
  background-color: transparent;
}

.header {
  position: sticky;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: var(--header-height);
  padding: 5px calc(var(--space) / 2) 0;
  top: 0;
  z-index: 10;
  transition: all 0.3s ease-in-out;
  background-color: transparent;

  &--is-scrolled {
    background-color: transparent;
  }
  &__left,
  &__right {
    display: flex;
    align-items: center;
  }
}

.nav__link {
  margin-left: 20px;
}
</style>
