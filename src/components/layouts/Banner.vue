<template>
  <div
    id="banner"
    aria-hidden="true"
    class="banner relative flex-center px-12 background z-40"
  >
    <Loader v-if="!isInitialized" class="absolute h-1/2" />
  </div>
</template>

<script>
import { tsParticles } from "tsparticles";

import Loader from "~/components/common/Loader";

import { helpers } from "~/utils/";
import { default as config } from "./banner/config.json";

export default {
  components: {
    Loader
  },

  data() {
    return {
      isInitialized: false
    };
  },

  computed: {
    cssVars() {
      return this.$getCssVars();
    }
  },

  inject: {
    $getCssVars: {
      type: Object,
      require: true
    }
  },

  watch: {
    cssVars: {
      handler(newCssVars) {
        this.setParticleColors(newCssVars);
      },
      deep: true,
      immediate: true
    }
  },

  mounted() {
    this.initParticlesJS();

    this.$nextTick(() => {
      this.setParticleColors(this.cssVars);
    });
  },

  beforeDestroy() {
    if (!tsParticles) {
      return;
    }
    const particles = tsParticles.domItem(0);

    if (!particles) {
      return;
    }

    particles.destroy();
  },

  methods: {
    setParticleColors(colors) {
      if (helpers.isEmpty(colors)) {
        return;
      }

      if (!tsParticles) {
        return;
      }

      const particles = tsParticles.domItem(0);

      if (!particles) {
        return;
      }

      const options = particles.options;

      options.particles.color.value = colors["primary"];
      options.particles.lineLinked.color = colors["secondary"];

      particles.refresh();

      this.isInitialized = true;
    },

    initParticlesJS() {
      if (process.isClient) {
        tsParticles.load("banner", config);
      }
    }
  }
};
</script>

<style lang="scss" scoped>
#banner {
  height: calc(var(--header-height) * 2);

  .loader {
    height: 50%;
  }
}
</style>
