import VueIcon from "vue-icon";
import VueProgressBar from "vue-progressbar";
import VueSimpleAccordion from "vue-simple-accordion";

// Import typefaces
import "typeface-montserrat";
import "typeface-merriweather";

// Import global components
import "~/vue-utils/GlobalComponents";

// Import main css
import "~/assets/styles/index.scss";

export default function (Vue, { router, head, isClient, appOptions }) {
  Vue.config.productionTip = false;

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
    Vue.use(
      require("vue-fusioncharts"),
      require("fusioncharts"),
      require("fusioncharts/fusioncharts.charts")
    );
  }

  Vue.use(VueSimpleAccordion, {});

  router.beforeEach((to, from, next) => {
    Vue.prototype.$Progress.start();

    next();
  });

  router.afterEach((to, from) => {
    Vue.prototype.$Progress.finish();

    Vue.prototype.$bus.$emit("route-leaving", false);

    if (to.hash) {
      setTimeout(() => {
        const anchor = document.createElement("a");
        anchor.href = to.hash;

        anchor.click();
      }, 501);
    }
  });

  router.onError((to, from, currentLocation) => {
    Vue.prototype.$Progress.finish();

    Vue.prototype.$bus.$emit("route-leaving", false);
  });
}
