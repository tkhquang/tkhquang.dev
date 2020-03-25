<template slot-scope="categories">
  <div class="article-tags">
    <g-link
      v-for="tag in post.tags"
      :key="tag.id"
      class="article-tags__link"
      :to="tag.path"
    >
      <span>#</span> {{ tag.title }}
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
  }
};
</script>

<style lang="scss">
.article-tags {
  margin: 1em 0 0;

  &__link {
    margin-right: 0.7em;
    font-size: 0.8em;
    color: currentColor;
    text-decoration: none;
    background-color: var(--background);
    padding: 0.5em;
    border-radius: 5px;
  }
}
</style>
