<template>
  <button
    type="button"
    class="fixed right-0 bottom-0 w-10 h-10 cursor-pointer z-10 m-10 hover:opacity-75 focus:outline-none"
    title="Scroll To Top"
    @click="scrollToTop"
  >
    <v-icon name="arrow-up-circle" class="w-10 h-10"></v-icon>
  </button>
</template>

<script>
export default {
  props: {
    isScrolled: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    scrollToTop() {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  }
};
</script>
