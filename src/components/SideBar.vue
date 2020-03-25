<template>
  <aside class="w-full lg:w-1/4 mt-8 lg:mt-4 relative">
    <Author :show-title="true" />
    <section class="widget-tags"></section>
  </aside>
</template>

<script>
import Author from "~/components/Author";
export default {
  components: {
    Author
  }
};
</script>

<style lang="scss">
.side-bar {
  // Placholder
}
</style>
