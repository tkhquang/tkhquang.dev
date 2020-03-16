<template>
  <div class="post-card content-box" :class="{ 'post-card--has-poster': true }">
    <div class="post-card__header">
      <g-image alt="Cover image" :src="getCoverImage" />
    </div>
    <div class="post-card__content">
      <h2 class="post-card__title truncate" v-html="post.title" />
      <p class="post-card__description" v-html="post.metadata.description" />

      <PostMeta class="post-card__meta" :post="post" />

      <PostTags class="post-card__tags" :post="post" />

      <g-link class="post-card__link" :to="post.path">
        Link
      </g-link>
    </div>
  </div>
</template>

<script>
import PostMeta from "~/components/PostMeta";
import PostTags from "~/components/PostTags";

export default {
  components: {
    PostMeta,
    PostTags
  },
  props: {
    post: {
      type: Object,
      required: true
    }
  },
  computed: {
    getCoverImage() {
      /*
        Max width of container class is 1280px
        so here we make sure that
        it matches the width of the query image
      */

      const baseUrl = this.post.metadata.hero.imgix_url;
      return `${baseUrl}?w=1280&h=720&q=80&fit=crop`;
    }
  }
};
</script>

<style lang="scss">
.post-card {
  /* Override default variables */
  --content-width: 100%;
  --space: 2rem;

  &:first-of-type {
    --space: 3rem;
    &__description {
      display: -webkit-box;
      -webkit-line-clamp: 5;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }
  position: relative;

  &__header {
    margin-left: calc(var(--space) * -1);
    margin-right: calc(var(--space) * -1);
    margin-bottom: calc(var(--space) / 2);
    margin-top: calc(var(--space) * -1);
    overflow: hidden;
    border-radius: var(--radius) var(--radius) 0 0;

    &:empty {
      display: none;
    }
  }

  &__image {
    min-height: 100%;
  }

  &__title {
    margin-top: 1.5rem;
  }

  &:hover {
    transform: translateY(-5px);
    box-shadow: 1px 10px 30px 0 rgba(0, 0, 0, 0.1);
  }

  &__description {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__tags {
    z-index: 1;
    position: relative;
  }

  &__link {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    overflow: hidden;
    text-indent: -9999px;
    z-index: 0;
  }
}
</style>
