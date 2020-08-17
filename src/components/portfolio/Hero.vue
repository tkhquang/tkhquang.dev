<template>
  <section class="hero relative flex-center">
    <div
      class="flex-center flex-col items-center justify-center h-full pb-24 transition-all duration-500"
    >
      <h1 class="mx-auto text-4xl lg:text-6xl font-bold leading-loose">
        Hello<span>, I'm Aleks!</span>
      </h1>
      <div class="roles text-xl lg:text-4xl font-medium h-10">
        <div
          v-for="(role, index) in roles"
          :key="role"
          class="h-0 opacity-0 leading-none transition-all duration-500 text-center"
          :class="{ 'h-10 opacity-100': index === selectedIndex }"
        >
          {{ role }}
        </div>
      </div>

      <SocialLinks
        class="social-links flex-center text-3xl lg:text-5xl lg:mt-10 flex-gap-8 h-0 opacity-0"
      />
    </div>
    <svg
      :key="waveKey"
      class="hero__waves absolute bottom-0 inset-x-0 w-full h-24 z-1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 54 14"
      height="70"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="gradient" x2="0%" y2="100%">
          <stop offset="0%" stop-color="var(--background)" />
          <stop offset="100%" stop-color="var(--darken)" />
        </linearGradient>
      </defs>
      <path fill="url(#gradient)">
        <animate
          attributeName="d"
          values="M 27 10C 21 8 14 3 0 3L 0 0L 54 0L 54 14C 40 14 33 12 27 10Z;M 27 14C 12 14 5 7 0 7L 0 0L 54 0L 54 7C 49 7 42 14 27 14Z;M 27 10C 21 12 14 14 0 14L 0 0L 54 0L 54 3C 40 3 33 8 27 10Z;M 27 14C 12 14 5 7 0 7L 0 0L 54 0L 54 7C 49 7 42 14 27 14Z;M 27 10C 21 8 14 3 0 3L 0 0L 54 0L 54 14C 40 14 33 12 27 10Z"
          repeatCount="indefinite"
          dur="15s"
        ></animate>
      </path>
    </svg>
  </section>
</template>

<script>
import { helpers } from "~/utils/";

import SocialLinks from "~/components/common/SocialLinks";

const roles = [
  // Force chomp
  "A Front-End Engineer 💻",
  "A Lifelong Learner 📚"
];

export default {
  components: {
    SocialLinks
  },

  inject: {
    $getCssVars: {
      type: Object,
      require: true
    }
  },

  data() {
    return {
      waveKey: 0,
      interval: null,
      selectedIndex: 0,
      roles
    };
  },

  computed: {
    cssVars() {
      return this.$getCssVars();
    }
  },

  watch: {
    cssVars: {
      handler(newCssVars) {
        if (helpers.isEmpty(newCssVars)) {
          return;
        }
        this.reloadWaves();
      },
      deep: true,
      immediate: true
    }
  },

  mounted() {
    this.interval = setInterval(() => {
      this.selectedIndex = (this.selectedIndex + 1) % this.roles.length;
    }, 5000);
  },

  beforeDestroy() {
    clearInterval(this.interval);
  },

  methods: {
    reloadWaves() {
      this.waveKey += 1;
    }
  }
};
</script>

<style lang="scss" scoped>
@import "~/assets/styles/_mixins";

@keyframes hero-height {
  0% {
    min-height: calc(100vh + 6rem);
  }

  50% {
    min-height: calc(100vh + 6rem);
  }

  100% {
    min-height: 600px;
  }
}

@keyframes typing {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}

.hero {
  min-height: 600px;
  animation: hero-height 1.5s linear;
  overflow: hidden;
  color: var(--on-primary-light);

  h1 {
    overflow: hidden;
    white-space: nowrap;
    margin: 0 auto;
    text-align: center;
    animation: fadeIn 0.3s linear;

    span {
      text-align: left;
      display: inline-block;
      width: 0;
      animation: typing 0.5s steps(40, end) forwards;
      animation-delay: 1s;
    }
  }

  .roles,
  .social-links {
    overflow: hidden;
    height: 0;
    opacity: 0;
    animation: fadeIn 0.3s linear forwards;
    animation-delay: 1.5s;
  }

  &::before {
    position: absolute;
    display: block;
    content: "";
    top: 0;
    left: 0;
    right: 0;
    min-height: 100vh;
    height: 100%;
    background-image: linear-gradient(
      to bottom right,
      var(--tone) 0%,
      var(--on-background-light) 100%
    );
    z-index: -1;
  }
}

.hero__waves {
  transition: opacity 0.5s linear;
  transform: matrix(1, 0, 0, -1, 0, 0);
}
</style>
