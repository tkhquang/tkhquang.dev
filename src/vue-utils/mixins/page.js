export default {
  computed: {
    isHomePage() {
      return /^\/(\d.+)?$/.test(this.$route.path);
    },
    isBlogPage() {
      return /^\/blog\/(\d.+)?$/.test(this.$route.path);
    },
    isPostPage() {
      return /^\/blog\/posts\/.*/.test(this.$route.path);
    },
    isCategoryPage() {
      return /^\/blog\/categories\/.*/.test(this.$route.path);
    },
    isTagPage() {
      return /^\/blog\/tags\/.*/.test(this.$route.path);
    }
  }
};
