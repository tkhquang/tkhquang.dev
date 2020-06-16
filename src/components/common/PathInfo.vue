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

<static-query>
query pathInfo {
  categories: allCategory (sortBy: "title") {
    edges {
      node {
        id
        title
        slug
        path
      }
    }
  }
}
</static-query>

<script>
export default {
  props: {
    slug: {
      type: String,
      required: true
    }
  },
  computed: {
    category() {
      const { node } = this.$static.categories.edges.find(
        ({ node }) => node.slug === this.slug
      );

      return { ...node };
    }
  }
};
</script>

<style lang="scss" scoped>
//
</style>
