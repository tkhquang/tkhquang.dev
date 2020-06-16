/* eslint-disable no-unused-vars */
import VueIcon from "vue-icon";
import NProgress from "nprogress";

import store from "~/store";

// Import global components
import "~/vue-utils/GlobalComponents";

// Import main css
import "~/assets/styles/index.scss";

// Import typefaces
import "typeface-montserrat";
import "typeface-merriweather";

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

  if (isClient) {
    NProgress.configure({ showSpinner: false });

    router.beforeEach((to, from, next) => {
      store.dispatch("page/LOADING_START");

      NProgress.start();

      next();
    });

    router.afterEach((to, from) => {
      store.dispatch("page/LOADING_END");

      NProgress.done();
    });
  }

  appOptions.store = store;
}
