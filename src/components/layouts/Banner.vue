<template>
  <div id="banner" class="banner relative flex-center px-12 background" />
</template>

<script>
import { tsParticles } from "tsparticles";
import { isEmpty } from "lodash";

import { default as config } from "./banner/config.json";

export default {
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
      if (isEmpty(colors)) {
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
    },

    initParticlesJS() {
      if (process.isClient) {
        tsParticles.load("banner", config);
      }
    }
  }
};
</script>
