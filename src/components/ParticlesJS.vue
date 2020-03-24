<template>
  <div id="particles-js"></div>
</template>

<script>
import EventBus from "~/utils/EventBus";

const config = {
  DEFAULT_CONFIG: {
    particles: {
      number: {
        value: 80,
        density: {
          enable: true,
          value_area: 120
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
          nb_sides: 5
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
        anim: {
          enable: false,
          speed: 1,
          opacity_min: 0.1,
          sync: false
        }
      },
      size: {
        value: 3,
        random: true,
        anim: {
          enable: false,
          speed: 40,
          size_min: 0.1,
          sync: false
        }
      },
      line_linked: {
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
        out_mode: "bounce",
        bounce: true,
        attract: {
          enable: false,
          rotateX: 600,
          rotateY: 1200
        }
      }
    },
    interactivity: {
      detect_on: "canvas",
      events: {
        onhover: {
          enable: true,
          mode: "grab"
        },
        onclick: {
          enable: true,
          mode: "repulse"
        },
        resize: true
      },
      modes: {
        grab: {
          distance: 140,
          line_linked: {
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
          particles_nb: 2
        },
        remove: {
          particles_nb: 2
        }
      }
    },
    retina_detect: true
  },
  MAX_PARTICLES: 60,
  THEMES: {
    dark: {
      color: "#FFFFFF",
      bgColor: "#111111"
    },
    light: {
      color: "#111111",
      bgColor: "#FFFFFF"
    }
  }
};

export default {
  name: "ParticleJS",

  computed: {
    particleConfig() {
      const particleConfig = config.DEFAULT_CONFIG;

      if (window.__theme) {
        const currentTheme = config.THEMES[window.__theme];

        particleConfig.particles.color.value = currentTheme.color;
        particleConfig.particles.line_linked.color = currentTheme.color;
        particleConfig.particles.shape.stroke.color = currentTheme.bgColor;
      }

      return particleConfig;
    }
  },
  mounted() {
    this.initParticlesJS();

    EventBus.$on("toggleTheme", this.onToggleTheme);
  },

  methods: {
    onToggleTheme(theme) {
      const currentTheme = config.THEMES[theme];

      this.checkParticles();

      this.$nextTick(() => {
        const pJS = global.pJSDom[0].pJS;
        if (pJS) {
          pJS.particles.color.value = currentTheme.color;
          pJS.particles.line_linked.color = currentTheme.color;
          pJS.particles.shape.stroke.color = currentTheme.bgColor;

          pJS.fn.particlesRefresh();
        }
      });
    },
    checkParticles() {
      if (process.isClient) {
        if (!global.pJSDom) {
          this.initParticlesJS();
          return;
        }

        if (global.pJSDom.length > 1) {
          global.pJSDom.splice(1);
          global.pJSDom[0].pJS.fn.particlesRefresh();
        }
      }
    },
    initParticlesJS() {
      if (process.isClient) {
        if (global.particlesJS) {
          this.checkParticles();
          return;
        }

        require("particles.js");

        this.$nextTick(() => {
          global.particlesJS("particles-js", this.particleConfig);

          this.checkParticles();
          const pJS = global.pJSDom[0].pJS;

          // Limit the particles number for maintaining performance
          pJS.fn.modes.pushParticles = function(nb, pos) {
            pJS.tmp.pushing = true;

            if (pJS.particles.array.length < +config.MAX_PARTICLES) {
              for (var i = 0; i < nb; i++) {
                pJS.particles.array.push(
                  new pJS.fn.particle(
                    pJS.particles.color,
                    pJS.particles.opacity.value,
                    {
                      x: pos ? pos.pos_x : Math.random() * pJS.canvas.w,
                      y: pos ? pos.pos_y : Math.random() * pJS.canvas.h
                    }
                  )
                );
                if (i == nb - 1) {
                  if (!pJS.particles.move.enable) {
                    pJS.fn.particlesDraw();
                  }
                  pJS.tmp.pushing = false;
                }
              }
              return;
            }
            pJS.particles.array.splice(0, +config.MAX_PARTICLES / 2);
          };
        });
      }
    }
  }
};
</script>

<style>
/* style goes here */
</style>
