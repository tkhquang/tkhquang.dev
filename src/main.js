import VueIcon from "vue-icon";
import VueProgressBar from "vue-progressbar";

// Import typefaces
import "typeface-montserrat";
import "typeface-merriweather";

// Import global components
import "~/vue-utils/GlobalComponents";

// Import main css
import "~/assets/styles/index.scss";

export default function (Vue, { router, head, isClient, appOptions }) {
  Vue.use(VueIcon, {
    name: "v-icon",
    props: {
      baseClass: {
        type: String,
        default: "v-icon"
      },
      classPrefix: {
        type: String,
        default: "v-icon-"
      }
    }
  });

  Vue.use(VueProgressBar, {
    color: "var(--primary)",
    failedColor: "var(--error)",
    thickness: "2px",
    transition: {
      speed: "0.1s",
      opacity: "0.6s",
      termination: 300
    },
    autoRevert: true,
    location: "top",
    inverse: false,
    autoFinish: false
  });

  if (isClient) {
    router.beforeEach((to, from, next) => {
      if (!Vue.prototype.$Progress.$vm.RADON_LOADING_BAR.percent) {
        Vue.prototype.$Progress.start();
      } else {
        Vue.prototype.$Progress.set(
          Vue.prototype.$Progress.$vm.RADON_LOADING_BAR.percent || 0
        );
      }

      next();
    });

    router.afterEach((to, from) => {
      Vue.prototype.$Progress.finish();
    });
  }
}
