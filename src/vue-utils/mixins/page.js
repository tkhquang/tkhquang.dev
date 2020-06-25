export default {
  computed: {
    isHomePage() {
      return /^\/(\d.+)?$/.test(this.$route.path);
    },
    isPostPage() {
      return /^\/posts\/.*/.test(this.$route.path);
    },
    isCategoryPage() {
      return /^\/categories\/.*/.test(this.$route.path);
    },
    isTagPage() {
      return /^\/tags\/.*/.test(this.$route.path);
    }
  }
};
