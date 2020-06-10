<template>
  <section class="side-bar w-full lg:w-1/4 mt-8 lg:mt-4 relative">
    <div
      class="side-bar__content shadow-md p-8 text-on-surface rounded relative z-10"
    >
      <Author />
      <hr class="my-5" />
      <Subscribe />
      <CircuitBoard class="side-bar__background absolute inset-0 surface" />
    </div>
  </section>
</template>

<script>
import Author from "~/components/common/Author";
import Subscribe from "~/components/common/Subscribe";
import CircuitBoard from "~/components/common/CircuitBoard";

export default {
  components: {
    Author,
    Subscribe,
    CircuitBoard
  }
};
</script>

<style lang="scss">
.side-bar {
  &__background {
    z-index: -1;
    box-shadow: inset 0px 0px 10px 10px var(--surface);
  }
}
</style>
