<template>
  <header
    class="header h-header-height p-0 m-0 flex-center flex-wrap inset-0 w-full z-header"
    :class="{
      'sticky background shadow-lg transition-all duration-500 ease-in-out': !isHomePage,
      fixed: isHomePage,
      'surface transition-none': isHomePage && isLoading,
      'text-gray-200 bg-transparent': isHomePage && !isLoading,
      'header--is-scrolled bg-theme-tone shadow-lg transition-all duration-500 ease-in-out':
        isHomePage && isScrolled
    }"
  >
    <div
      class="container px-4 sm:px-6 lg:px-8 mx-auto flex justify-between items-center h-full"
    >
      <div class="header__left flex items-center h-full">
        <Logo />
      </div>
      <div class="header__right flex items-center h-full">
        <Navigation v-if="!isHomePage" />
        <ToggleTheme class="ml-4" />
      </div>
    </div>
    <Indicator v-if="isPostPage" />
  </header>
</template>

<script>
import loadMixin from "~/vue-utils/mixins/load";
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

  mixins: [pageMixin, routerMixin, loadMixin],

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
