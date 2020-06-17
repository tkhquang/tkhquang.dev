/* eslint-disable no-unused-vars */
import NProgress from "nprogress";

export default {
  beforeRouteLeave(to, from, next) {
    this.$store.dispatch("page/LOADING_START");

    NProgress.start();

    next();
  }
};
