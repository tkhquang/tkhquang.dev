export default {
  data() {
    return {
      isLoading: true
    };
  },

  computed: {
    isLoadingBarShow() {
      try {
        return this.$Progress.$vm.RADON_LOADING_BAR.options.show;
      } catch (error) {
        console.log(error);

        return false;
      }
    }
  },

  watch: {
    isLoadingBarShow(newValue) {
      this.isLoading = newValue;
    }
  },

  mounted() {
    this.isLoading = this.isLoadingBarShow;
  }
};
