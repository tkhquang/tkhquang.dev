export default {
  beforeRouteLeave(to, from, next) {
    this.$Progress.start();

    next();
  }
};
