<template>
  <nav class="path-info font-bold italic text-theme-primary">
    <g-link class="path-info__link" to="/">
      Home
    </g-link>
    ->
    <g-link class="path-info__link" :to="category.path">
      {{ category.title }}
    </g-link>
  </nav>
</template>

<script>
export default {
  props: {
    slug: {
      type: String,
      required: true
    }
  },
  inject: {
    $categories: {
      type: Object,
      required: true
    }
  },
  computed: {
    category() {
      return this.$categories[this.slug];
    }
  }
};
</script>

<style lang="scss" scoped>
//
</style>
