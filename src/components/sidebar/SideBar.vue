<template>
  <section class="sidebar w-full lg:w-1/4 mt-8 lg:mt-4 relative">
    <div class="shadow-md p-8 surface rounded">
      <Author :show-title="true" />
    </div>
  </section>
</template>

<script>
import Author from "~/components/common/Author";

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
