import Loader from "~/components/common/Loader";

export default {
  components: {
    Loader
  },

  beforeRouteLeave(to, from, next) {
    this.$bus.$emit("route-leaving", true);

    next();
  }
};
