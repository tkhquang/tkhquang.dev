<template>
  <section class="blog-info relative z-10">
    <div
      class="blog-info__content shadow-md p-8 text-on-surface rounded relative"
    >
      <div class="">
        <Author />
        <HorizontalLine class="my-5" />
        <Subscribe />
      </div>
      <CircuitBoard class="absolute inset-0 surface z-bg" />
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
.blog-info {
  &__content {
    box-shadow: inset 0px 0px 10px 10px var(--surface);
  }
}
</style>
