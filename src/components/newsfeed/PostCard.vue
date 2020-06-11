<template>
  <li class="news-feed__list-item pt-8 lg:w-4/5 w-full">
    <PostMeta class="news-feed__list-item__meta" :post="post" />

    <h2
      class="news-feed__list-item__title heading text-3xl sm:text-4xl sm:leading-10 my-4 hover:opacity-75"
    >
      <g-link class="news-feed__list-item__link" :to="post.path">
        {{ post.title }}
      </g-link>
    </h2>

    <figure v-if="post.cover_image">
      <g-link class="news-feed__list-item__link" :to="post.path">
        <g-image
          alt="Cover image"
          class="news-feed__list-item__image shadow-lg mb-4 rounded mt-2"
          :src="coverImage"
          width="1280"
          height="720"
          quality="80"
          fit="cover"
          blur="10"
        />
      </g-link>
      <figcaption></figcaption>
    </figure>

    <p
      class="news-feed__list-item__description v-html mt-3 text-lg leading-7"
      v-html="post.description"
    />

    <PostTags class="news-feed__list-item__tags" :post="post" />
    <hr class="mt-8" />
  </li>
</template>

<script>
import PostMeta from "~/components/common/PostMeta";
import PostTags from "~/components/common/PostTags";

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
    coverImage() {
      if (!this.post.cover_image) {
        return "";
      }
      return require(`!!assets-loader?width=1280&height=720&fit=cover&blur=10!~/assets${this.post.cover_image}`);
    }
  }
};
</script>

<style lang="scss" scoped>
.news-feed__list-item {
  &__description {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
</style>
