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
    <Waves
      :key="waveKey"
      class="hero__waves absolute bottom-0 inset-x-0 h-24 z-1"
    />
  </section>
</template>

<script>
import { helpers } from "~/utils/";

import Waves from "~/components/common/Waves";
import SocialLinks from "~/components/common/SocialLinks";

const roles = [
  // Force chomp
  "A Front-End Engineer 💻",
  "A Lifelong Learner 📚"
];

export default {
  components: {
    Waves,
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
      animation: typing 0.5s steps(20, end) forwards;
      animation-delay: 1s;
    }
  }

  .roles,
  .social-links {
    overflow: hidden;
    height: 0;
    opacity: 0;
    animation: fadeIn 1s linear forwards;
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
</style>
