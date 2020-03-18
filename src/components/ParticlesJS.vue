<template>
  <div id="particles-js"></div>
</template>

<script>
/* eslint-disable no-undef */
import EventBus from "~/utils/EventBus";

export default {
  name: "ParticleJS",

  data() {
    return {
      particleConfig: {}
    };
  },

  mounted() {
    if (process.isClient) {
      require("particles.js");
    }
    EventBus.$on("toggleTheme", this.onToggleTheme);

    this.particleConfig = this.getConfig();

    this.$nextTick(() => {
      particlesJS("particles-js", this.particleConfig);
    });
  },

  methods: {
    getConfig() {
      const color = window.__theme === "light" ? "#111111" : "#FFFFFF";
      const bgColor = window.__theme === "light" ? "#FFFFFF" : "#111111";
      return {
        particles: {
          number: {
            value: 380,
            density: {
              enable: true,
              value_area: 800
            }
          },
          color: {
            value: color
          },
          shape: {
            type: "circle",
            stroke: {
              width: 0,
              color: bgColor
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
            color: color,
            opacity: 0.4,
            width: 1
          },
          move: {
            enable: true,
            speed: 6,
            direction: "none",
            random: false,
            straight: false,
            out_mode: "out",
            bounce: false,
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
              mode: "push"
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
              distance: 200,
              duration: 0.4
            },
            push: {
              particles_nb: 4
            },
            remove: {
              particles_nb: 2
            }
          }
        },
        retina_detect: true
      };
    },
    onToggleTheme(theme) {
      const newColor = theme === "light" ? "#111111" : "#FFFFFF";
      const newBgColor = theme === "light" ? "#FFFFFF" : "#111111";

      if (pJSDom[0]) {
        pJSDom[0].pJS.particles.color.value = newColor;
        pJSDom[0].pJS.particles.line_linked.color = newColor;
        pJSDom[0].pJS.particles.shape.stroke.color = newBgColor;

        pJSDom[0].pJS.fn.particlesRefresh();
      }
    }
  }
};
</script>

<style>
/* style goes here */
</style>
