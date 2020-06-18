<template>
  <article class="article container mx-auto lg:w-4/5 w-full max-w-screen-md">
    <h1 class="article__title heading lg:text-5xl text-3xl w-full my-8">
      {{ $page.post.title }}
    </h1>

    <PostMeta class="article__meta my-3" :post="$page.post" />

    <HorizontalLine class="my-3" />

    <PathInfo class="article__path-info" :slug="$page.post.category_slug" />

    <HorizontalLine class="my-3" />

    <template v-if="$page.post.cover_image">
      <figure class="mb-6">
        <g-image
          alt="Cover image"
          class="article__image my-4"
          :src="coverImage"
          width="1280"
          height="720"
          quality="80"
          fit="cover"
          blur="10"
        />
        <figcaption></figcaption>
      </figure>

      <HorizontalLine class="mb-6" />
    </template>

    <div class="article__content v-html" v-html="$page.post.content" />

    <div class="flex article__footer my-6">
      <PostTags :post="$page.post" />
    </div>

    <HorizontalLine class="my-6" />

    <BlogInfo class="w-full" />

    <HorizontalLine class="my-6" />

    <div
      class="article-comments surface p-2 w-full md:px-6 lg:px-12 rounded shadow-md"
    >
      <CommentBox :key="commentBoxKey" :css-vars="cssVars" />
    </div>
  </article>
</template>

<script>
import { isEmpty } from "lodash";

import seoMixin from "~/vue-utils/mixins/seo";
import routerMixin from "~/vue-utils/mixins/router";

import PathInfo from "~/components/common/PathInfo";
import PostMeta from "~/components/common/PostMeta";
import PostTags from "~/components/common/PostTags";
import BlogInfo from "~/components/widgets/BlogInfo";

import CommentBox from "~/components/CommentBox";

export default {
  name: "Post",

  components: {
    PathInfo,
    BlogInfo,
    PostMeta,
    PostTags,
    CommentBox
  },

  mixins: [seoMixin, routerMixin],

  inject: {
    $getCssVars: {
      type: Object,
      require: true
    }
  },

  data() {
    return {
      commentBoxKey: 0
    };
  },

  computed: {
    cssVars() {
      return this.$getCssVars();
    },

    coverImage() {
      if (!this.$page.post.cover_image) {
        return "";
      }
      return require(`!!assets-loader?width=1280&height=720&fit=cover&blur=10!~/assets${this.$page.post.cover_image}`);
    }
  },

  watch: {
    cssVars: {
      handler(newCssVars) {
        if (isEmpty(newCssVars)) {
          return;
        }
        this.reloadCommentBox();
      },
      deep: true,
      immediate: true
    }
  },

  methods: {
    reloadCommentBox() {
      this.commentBoxKey += 1;
    }
  },

  metaInfo() {
    const {
      title: siteTitle,
      description: siteDescription,
      path
    } = this.$page.post;
    return this.generateMetaInfo({
      siteTitle,
      siteDescription,
      metaImageUrl: this.coverImage.src,
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
    category_slug
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
