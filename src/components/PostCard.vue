<template>
  <div class="post-card content-box">
    <div class="post-card__header">
      <g-image
        v-if="post.cover_image"
        alt="Cover image"
        class="post-card__image"
        :src="
          require(`!!assets-loader?width=1280&height=720&fit=cover&blur=10!~/assets${post.cover_image}`)
        "
        width="1280"
        height="720"
        quality="80"
        fit="cover"
        blur="10"
      />
    </div>
    <div class="post-card__content">
      <h3 class="post-card__title" v-html="post.title" />
      <p class="post-card__description" v-html="post.description" />

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
  }
};
</script>

<style lang="scss">
.post-card {
  /* Override default variables */
  // --content-width: 100%;
  // --space: 2rem;

  // &.content-box {
  //   // The hightlighted Post (first post)
  //   &:first-of-type {
  //     --content-width: 100%;
  //     --space: 3rem;
  //     & .post-card {
  //       &__description {
  //         display: -webkit-box;
  //         -webkit-line-clamp: 5;
  //         -webkit-box-orient: vertical;
  //         overflow: hidden;
  //       }
  //     }
  //   }

  //   // Other posts
  //   &:not(:first-of-type) {
  //     & .post-card {
  //       &__title {
  //         @apply truncate;
  //       }
  //       &__description {
  //         display: -webkit-box;
  //         -webkit-line-clamp: 2;
  //         -webkit-box-orient: vertical;
  //         overflow: hidden;
  //       }
  //     }
  //   }
  // }

  &.content-box {
    margin: calc(var(--space) / 2) auto;
    & .post-card {
      &__description {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
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

  &__tags {
    z-index: 1;
    position: relative;
    display: inline-block;
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
