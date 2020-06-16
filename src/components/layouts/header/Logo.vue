<template>
  <g-link
    class="logo flip-animate flex-center whitespace-no-wrap no-underine font-extrabold uppercase focus:outline-none select-none"
    to="/"
    @click.native="scrollToTop"
  >
    <template v-if="!isHomePage">
      <v-icon name="arrow-left-circle" class="w-8 h-8"></v-icon>
      <span class="hidden md:inline-flex">
        &nbsp;Back to&nbsp;
      </span>
      <span
        class="logo__text relative hidden md:inline-flex"
        :data-hover="$settings.siteTitle"
      >
        Home
      </span>
    </template>
    <span
      v-else
      class="logo__text relative inline-flex"
      :data-hover="$settings.siteTitle"
    >
      Home
    </span>
  </g-link>
</template>

<script>
export default {
  inject: {
    $settings: {
      type: Object,
      required: true
    }
  },
  computed: {
    isHomePage() {
      return /^\/(\d.+)?$/.test(this.$route.path);
    }
  },
  methods: {
    scrollToTop() {
      if (!this.isHomePage) {
        return;
      }
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.logo {
  perspective: 1000px;

  &__text {
    transition: transform 0.3s;
    transform-origin: 50% 0;
    transform-style: preserve-3d;

    &::before {
      position: absolute;
      top: 100%;
      left: 0;
      width: 100%;
      height: 100%;
      content: attr(data-hover);
      transition: color 0.3s;
      transform: rotateX(-90deg);
      transform-origin: 50% 0;
      text-align: center;
    }
  }

  &:hover &__text {
    transform: rotateX(90deg) translateY(-22px);
    &::before {
      color: var(--error);
    }
  }
}
</style>
