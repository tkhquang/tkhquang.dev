<template>
  <div>
    <ParticlesJS />
    <div class="banner text-4xl">
      {{ " " || settings.siteTitle }}
    </div>
    <div id="indicator" :style="`width: ${indicator}%`"></div>

    <header class="header">
      <div class="header__left">
        <Logo :show-logo="showLogo" :fab="fab" @click.native="toTop" />
      </div>
      <div class="header__right">
        <ToggleTheme />
      </div>
    </header>
    <main class="main-container container">
      <slot />
    </main>
    <div
      v-show="fab"
      class="fixed right-0 bottom-0 w-10 h-10 cursor-pointer z-10 m-5"
      title="Scroll To Top"
      @scroll="onScroll"
      @click="toTop"
    >
      <v-icon name="arrow-up-circle"></v-icon>
    </div>
    <footer class="text-center py-4">
      Copyright © {{ new Date().getFullYear() }} - Aleks Quang Trinh
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
        this.fab = top > 60;

        const scrollPos = global.scrollY;
        const winHeight = global.innerHeight;
        const docHeight = global.document.documentElement.scrollHeight;
        const perc = (100 * scrollPos) / (docHeight - winHeight);
        this.indicator = Math.floor(perc);
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
  position: absolute;
  top: 0;
  width: 100%;
  height: calc(var(--header-height) * 2);
  z-index: 1;
}

#indicator {
  position: sticky;
  top: 0;
  left: 0;
  height: 5px;
  background-color: rgb(68, 98, 180);
  z-index: 999;
  transition: width 200ms linear;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: var(--header-height);
  padding: 0 calc(var(--space) / 2);
  top: 0;
  z-index: 10;
  // background-color: var(--bg-color);
  &__left,
  &__right {
    display: flex;
    align-items: center;
  }
  @media screen and (min-width: 800px) {
    /* Make header sticky for large screens */
    position: sticky;
    width: 100%;
  }
}

.nav__link {
  margin-left: 20px;
}
</style>
