import Loader from "~/components/common/Loader";

export default {
  components: {
    Loader
  },

  data() {
    return {
      isLeaving: false
    };
  },

  beforeRouteLeave(to, from, next) {
    this.isLeaving = true;

    next();
  }
};
