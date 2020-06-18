export default {
  beforeRouteLeave(to, from, next) {
    if (!this.$Progress.$vm.RADON_LOADING_BAR.percent) {
      this.$Progress.start();
    } else {
      this.$Progress.set(this.$Progress.$vm.RADON_LOADING_BAR.percent || 0);
    }

    next();
  }
};
