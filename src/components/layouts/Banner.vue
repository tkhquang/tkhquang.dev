<template>
  <div id="banner" class="banner relative flex-center px-12 background" />
</template>

<script>
import { isEmpty } from "lodash";

import cssVars from "~/utils/mixins/cssVars.js";

const config = {
  DEFAULT_CONFIG: {
    particles: {
      number: {
        value: 40,
        limit: 60,
        density: {
          enable: true,
          area: 120
        }
      },
      color: {
        value: "#FFFFFF"
      },
      shape: {
        type: "circle",
        stroke: {
          width: 0,
          color: "#111111"
        },
        polygon: {
          sides: 5
        },
        image: {
          src: "img/github.svg",
          width: 100,
          height: 100
        }
      },
      opacity: {
        value: 0.5,
        random: false,
        animation: {
          enable: false,
          speed: 1,
          minimumValue: 0.1,
          sync: false
        }
      },
      size: {
        value: 3,
        random: true,
        animation: {
          enable: false,
          speed: 40,
          minimumValue: 0.1,
          sync: false
        }
      },
      lineLinked: {
        enable: true,
        distance: 150,
        color: "#FFFFFF",
        opacity: 0.4,
        width: 1
      },
      move: {
        enable: true,
        speed: 1.5,
        direction: "none",
        random: false,
        straight: false,
        outMode: "out",
        collisions: true,
        attract: {
          enable: false,
          rotate: {
            x: 600,
            y: 1200
          }
        }
      }
    },
    interactivity: {
      detectsOn: "canvas",
      events: {
        onHover: {
          enable: true,
          mode: "grab"
        },
        onClick: {
          enable: true,
          mode: "push"
        },
        resize: true
      },
      modes: {
        grab: {
          distance: 140,
          lineLinked: {
            opacity: 1
          }
        },
        bubble: {
          distance: 400,
          size: 40,
          duration: 2,
          opacity: 8,
          speed: 3
        },
        repulse: {
          distance: 120,
          duration: 0.4
        },
        push: {
          quantity: 2
        },
        remove: {
          quantity: 2
        }
      }
    },
    detectsRetina: true
  },
  MAX_PARTICLES: 60
};

export default {
  mixins: [cssVars],

  watch: {
    cssVars: {
      handler(newCssVars) {
        if (isEmpty(newCssVars)) {
          return;
        }

        this.setParticleColors(newCssVars);
      },
      deep: true,
      immediate: true
    }
  },

  mounted() {
    this.initParticlesJS();
  },

  beforeDestroy() {
    if (!global.tsParticles) {
      return;
    }
    const particles = global.tsParticles.domItem(0);

    if (!particles) {
      return;
    }

    particles.destroy();
  },

  methods: {
    setParticleColors(colors) {
      if (!global.tsParticles) {
        return;
      }

      const particles = global.tsParticles.domItem(0);

      if (!particles) {
        return;
      }

      const options = particles.options;

      options.particles.color.value = colors["on-background"];
      options.particles.lineLinked.color = colors["tone-1"];
      options.particles.shape.stroke.color = colors.surface;

      particles.refresh();
    },

    initParticlesJS() {
      if (process.isClient) {
        require("tsparticles");
        // require("pathseg");

        global.tsParticles.load("banner", config.DEFAULT_CONFIG);
      }
    }
  }
};
</script>