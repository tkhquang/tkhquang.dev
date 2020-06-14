<template>
  <header
    class="header h-header-height flex-center sticky inset-0 w-full px-4 sm:px-6 lg:px-8 z-40 transition-all duration-300 ease-in-out background shadow-md"
    :class="{ 'header--is-scrolled': isScrolled }"
  >
    <div class="container mx-auto flex justify-between items-center h-full">
      <div class="header__left flex items-center h-full">
        <Logo />
      </div>
      <div class="header__right flex items-center h-full">
        <Navigation />
        <ToggleTheme class="ml-4" />
      </div>
    </div>
  </header>
</template>

<script>
import Logo from "./header/Logo";
import ToggleTheme from "./header/ToggleTheme";
import Navigation from "./header/Navigation";

export default {
  components: {
    Logo,
    ToggleTheme,
    Navigation
  },
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
