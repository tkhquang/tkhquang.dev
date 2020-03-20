<template slot-scope="categories">
  <div class="post-tags">
    <g-link
      v-for="slug in post.tags"
      :key="slug"
      class="post-tags__link"
      :to="getTagPath(slug)"
    >
      <span>#</span> {{ getTagTitle(slug) }}
    </g-link>
  </div>
</template>

<script>
export default {
  props: {
    post: {
      type: Object,
      required: true
    }
  },
  inject: {
    categories: {
      type: Object,
      required: true
    }
  },
  methods: {
    getTagTitle(slug) {
      const tag = this.categories.edges.find(item => {
        return item.node.slug === slug;
      });
      if (tag) {
        return tag.node.title;
      }
      return slug;
    },
    getTagPath(slug) {
      const tag = this.categories.edges.find(item => {
        return item.node.slug === slug;
      });
      if (tag) {
        return tag.node.path;
      }
      return slug;
    }
  }
};
</script>

<style lang="scss">
.post-tags {
  margin: 1em 0 0;

  &__link {
    margin-right: 0.7em;
    font-size: 0.8em;
    color: currentColor;
    text-decoration: none;
    background-color: var(--bg-color);
    padding: 0.5em;
    border-radius: var(--radius);
  }
}
</style>
