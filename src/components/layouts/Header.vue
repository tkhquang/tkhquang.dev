<template>
  <header
    class="header h-header-height flex-center sticky inset-0 w-full px-4 sm:px-6 lg:px-8 z-40 transition-all duration-300 ease-in-out background shadow-md"
    :class="{ 'header--is-scrolled': isScrolled }"
  >
    <div class="container mx-auto flex justify-between items-center">
      <div class="header__left flex items-center">
        <Logo />
      </div>
      <div class="header__right flex items-center">
        <ToggleTheme class="ml-4" />
      </div>
    </div>
  </header>
</template>

<script>
import Logo from "./header/Logo";
import ToggleTheme from "./header/ToggleTheme";

export default {
  components: {
    Logo,
    ToggleTheme
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
