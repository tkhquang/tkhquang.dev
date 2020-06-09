<template>
  <g-link
    class="logo flip-animate font-extrabold uppercase focus:outline-none select-none"
    to="/"
    @click.native="scrollToTop"
  >
    <template v-if="!isHomePage">
      <v-icon name="arrow-left-circle" class="w-8 h-8"></v-icon> &nbsp;Back
      to&nbsp;
    </template>
    <span class="logo__text" :data-hover="$settings.siteTitle">
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
  display: inline-flex;
  justify-content: center;
  align-items: center;
  text-decoration: none;

  &__image {
    vertical-align: middle;
    border-radius: 99px;
    height: 40px;
    width: 40px;
    margin-right: 0.5em;
  }
}
.logo.flip-animate {
  perspective: 1000px;

  span {
    position: relative;
    display: inline-flex;
    padding: 0;
    transition: transform 0.3s;
    transform-origin: 50% 0;
    transform-style: preserve-3d;
  }

  span:before {
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

  &:hover span {
    transform: rotateX(90deg) translateY(-22px);
    &::before {
      color: rgb(210, 73, 54);
    }
  }
}
</style>
