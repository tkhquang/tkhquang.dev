<template>
  <article class="article border-b py-8 lg:w-4/5 w-full">
    <PostMeta class="article__meta" :post="post" />

    <h2
      class="article__title text-3xl leading-8 font-bold tracking-tight sm:text-4xl sm:leading-10 my-4"
    >
      <g-link class="article__link" :to="post.path">
        <span v-html="post.title"></span>
      </g-link>
    </h2>

    <g-link class="article__link" :to="post.path">
      <figure>
        <g-image
          v-if="post.cover_image"
          alt="Cover image"
          class="article__image shadow-lg mb-4 rounded mt-2"
          :src="
            require(`!!assets-loader?width=1280&height=720&fit=cover&blur=10!~/assets${post.cover_image}`)
          "
          width="1280"
          height="720"
          quality="80"
          fit="cover"
          blur="10"
        />
      </figure>
    </g-link>

    <p
      class="article__description mt-3 text-lg leading-7"
      v-html="post.description"
    />

    <PostTags class="article__tags" :post="post" />
  </article>
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
.article {
  &__description {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
</style>
