<template>
  <div>
    <div class="banner"></div>
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
import mixins from "../utils/mixins";
import ToggleTheme from "~/components/ToggleTheme.vue";
import Logo from "~/components/Logo.vue";

// Import typefaces
import "typeface-montserrat";
import "typeface-merriweather";

export default {
  components: {
    ToggleTheme,
    Logo
  },
  mixins: [mixins],
  props: {
    showLogo: {
      type: Boolean,
      default: true
    }
  }
};
</script>
<style lang="scss">
.banner {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: var(--header-height);
  padding: 0 calc(var(--space) / 2);
  background-color: var(--bg-color);
  filter: brightness(80%);
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
  filter: brightness(80%);
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