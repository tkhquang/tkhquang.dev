<template>
  <section class="blog-info relative z-10">
    <div
      class="blog-info__content shadow-md p-8 text-on-surface rounded sticky"
    >
      <div>
        <Author />
        <HorizontalLine class="my-5" />
        <Subscribe />
      </div>
      <CircuitBoard class="absolute inset-0 shadow-md surface z-bg rounded" />
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
    top: calc(var(--header-height) + 2rem);
  }
}
</style>
