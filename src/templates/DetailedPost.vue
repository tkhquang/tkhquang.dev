<template>
  <article class="article container mx-auto lg:w-4/5 w-full max-w-screen-md">
    <h1 class="article__title heading lg:text-5xl text-3xl w-full my-12">
      {{ $page.post.title }}
    </h1>
    <PostMeta class="article__meta mb-4" :post="$page.post" />
    <figure>
      <g-image
        v-if="$page.post.cover_image"
        alt="Cover image"
        class="article__image my-4"
        :src="
          require(`!!assets-loader?width=1280&height=720&fit=cover&blur=10!~/assets${$page.post.cover_image}`)
        "
        width="1280"
        height="720"
        quality="80"
        fit="cover"
        blur="10"
      />
      <figcaption></figcaption>
    </figure>
    <div class="article__content v-html" v-html="$page.post.content" />
    <div class="article__footer mb-12">
      <PostTags :post="$page.post" />
    </div>

    <hr />

    <Author
      class="article-author my-12 px-6 md:px-8 lg:px-12 py-8 md:py-12 shadow-md surface rounded"
    />

    <div class="article-comments surface p-2 w-full md:px-6 lg:px-12 rounded">
      <CommentBox :key="commentBoxKey" />
    </div>
  </article>
</template>

<script>
import EventBus from "~/vue-utils/EventBus";
import seo from "~/vue-utils/mixins/seo.js";

import PostMeta from "~/components/common/PostMeta";
import PostTags from "~/components/common/PostTags";
import Author from "~/components/common/Author.vue";

import CommentBox from "~/components/CommentBox";

export default {
  components: {
    Author,
    PostMeta,
    PostTags,
    CommentBox
  },

  mixins: [seo],

  data() {
    return {
      commentBoxKey: 0
    };
  },
  mounted() {
    // Force CommentBox to update everytime theme is changed
    EventBus.$on("toggleTheme", () => {
      this.commentBoxKey += 1;
    });
  },

  metaInfo() {
    const {
      title: siteTitle,
      description: siteDescription,
      cover_image: metaImageUrl,
      path
    } = this.$page.post;
    return this.generateMetaInfo({
      siteTitle,
      siteDescription,
      metaImageUrl,
      path
    });
  }
};
</script>

<page-query>
query Post ($path: String!) {
  post: post (path: $path) {
    title
    path
    created_at
    updated_at
    timeToRead
    description
    content
    cover_image (width: 1280, height: 720, blur: 10, quality: 80)
    tags {
      id
      title
      path
    }
  }
}
</page-query>

<style lang="scss" scoped>
@import "~/assets/styles/_mixins";

.article /deep/ .v-html {
  @include typography;
}
</style>
