<template>
  <div>
    <ParticlesJS />
    <div class="banner text-4xl">
      {{ settings.siteTitle }}
      <span role="image" name="Ljoss">✨</span>
    </div>
    <header class="header">
      <div class="header__left">
        <Logo v-if="showLogo" />
      </div>

      <div class="header__right">
        <ToggleTheme />
      </div>
    </header>
    <main class="main-container container">
      <slot />
    </main>
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
  background-color: var(--bg-color);
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
