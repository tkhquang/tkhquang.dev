<template>
  <div class="container mx-auto px-8">
    <div class="post-title">
      <h1 class="post-title__text max-w-screen-md mx-auto">
        {{ $page.post.title }}
      </h1>

      <PostMeta :post="$page.post" />
    </div>

    <div class="post">
      <div class="post__header">
        <g-image
          v-if="$page.post.cover_image"
          alt="Cover image"
          class="article__image"
          :src="
            require(`!!assets-loader?width=1280&height=720&fit=cover&blur=10!~/assets${$page.post.cover_image}`)
          "
          width="1280"
          height="720"
          quality="80"
          fit="cover"
          blur="10"
        />
      </div>
      <div class="post__content" v-html="$page.post.content" />
      <div class="post__footer">
        <PostTags :post="$page.post" />
      </div>
    </div>

    <Author class="post-author" :show-title="true" />

    <div class="post-comments">
      <div class="commentbox" />
    </div>
  </div>
</template>

<script>
import commentBox from "commentbox.io";

import seo from "~/utils/mixins/seo.js";

import PostMeta from "~/components/PostMeta";
import PostTags from "~/components/PostTags";
import Author from "~/components/Author.vue";

export default {
  components: {
    Author,
    PostMeta,
    PostTags
  },
  mixins: [seo],
  mounted() {
    this.removeCommentBox = commentBox(
      `${process.env.GRIDSOME_COMMENTBOX_PROJECT_ID}`,
      {
        textColor: "white",
        subtextColor: "#dddddd"
      }
    );
  },
  beforeDestroy() {
    this.removeCommentBox();
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

<style lang="scss">
@import "~/assets/styles/_typography";
</style>
