<template>
  <section class="side-bar w-full lg:w-1/4 mt-8 lg:mt-4 relative">
    <div class="shadow-md p-8 surface rounded">
      <Author />
      <hr class="my-5" />
      <Subscribe />
    </div>
  </section>
</template>

<script>
import Author from "~/components/common/Author";
import Subscribe from "~/components/common/Subscribe";

export default {
  components: {
    Author,
    Subscribe
  }
};
</script>

<style lang="scss">
.side-bar {
  // Placeholder
}
</style>
