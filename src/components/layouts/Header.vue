<template>
  <header
    class="header relative h-header-height p-0 m-0 flex-center flex-wrap sticky inset-0 w-full z-40 transition-all duration-300 ease-in-out background shadow-md"
    :class="{ 'header--is-scrolled': isScrolled }"
  >
    <div
      class="container px-4 sm:px-6 lg:px-8 mx-auto flex justify-between items-center h-full"
    >
      <div class="header__left flex items-center h-full">
        <Logo />
      </div>
      <div class="header__right flex items-center h-full">
        <Navigation />
        <ToggleTheme class="ml-4" />
      </div>
    </div>
    <Indicator v-if="isPostPage && !isLeaving" />
  </header>
</template>

<script>
import pageMixin from "~/vue-utils/mixins/page";
import routerMixin from "~/vue-utils/mixins/router";

import Logo from "./header/Logo";
import ToggleTheme from "./header/ToggleTheme";
import Navigation from "./header/Navigation";
import Indicator from "./header/Indicator";

export default {
  components: {
    Logo,
    ToggleTheme,
    Navigation,
    Indicator
  },

  mixins: [pageMixin, routerMixin],

  props: {
    isScrolled: {
      type: Boolean,
      default: false
    }
  }
};
</script>

<style lang="scss" scoped>
// Styles
</style>
