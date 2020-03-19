<template>
  <div>
    <div class="post-title">
      <h1 class="post-title__text max-w-screen-md mx-auto">
        {{ $page.post.title }}
      </h1>

      <PostMeta :post="$page.post" />
    </div>

    <div class="post content-box">
      <div class="post__header">
        <g-image alt="Cover image" :src="coverImage" />
      </div>
      <div class="post__content" v-html="pageContent" />
      <div class="post__footer">
        <PostTags :post="$page.post" />
      </div>
    </div>

    <div class="post-comments">
      <!-- Add comment widgets here -->
    </div>

    <Bio class="post-author" />
  </div>
</template>

<script>
import mixins from "~/utils/mixins";

import PostMeta from "~/components/PostMeta";
import PostTags from "~/components/PostTags";
import Bio from "~/components/Bio.vue";

export default {
  components: {
    Bio,
    PostMeta,
    PostTags
  },
  mixins: [mixins],
  metaInfo() {
    const {
      title: siteTitle,
      metadata: {
        description: siteDescription,
        hero: { imgix_url: metaImageUrl }
      },
      path
    } = this.$page.post;
    return this.generateMetaInfo({
      siteTitle,
      siteDescription,
      metaImageUrl,
      path
    });
  },
  computed: {
    pageContent() {
      return (
        this.$page.post.metadata.markdown_content || this.$page.post.content
      );
    },
    coverImage() {
      /*
        Max width of container class is 1280px
        so here we make sure that
        it matches the width of the query image
      */

      const baseUrl = this.$page.post.metadata.hero.imgix_url;
      return `${baseUrl}?w=1280&h=720&q=80&fit=crop`;
    }
  }
};
</script>

<page-query>
  query postQuery($path: String!) {
    post: cosmicjsPosts(path: $path) {
      id
      title
      content
      path
      prevPath
      nextPath
      nextTitle
      prevTitle
      created_at(format: "DD MMMM YYYY")
      modified_at(format: "DD MMMM YYYY")
      metadata {
        tags {
          _id
          title
          metadata {
            path
          }
        }
        hero {
          imgix_url
        }
        description
        markdown_content
      }
    }
  }
</page-query>

<style lang="scss">
.v-lazy-image {
  filter: blur(10px);
  transition: filter 0.7s;
}
.v-lazy-image-loaded {
  filter: blur(0);
}
.post-title {
  padding: calc(var(--space) / 2) 0 calc(var(--space) / 2);
  text-align: center;
}

.post {
  &__header {
    width: calc(100% + var(--space) * 2);
    margin-left: calc(var(--space) * -1);
    margin-top: calc(var(--space) * -1);
    margin-bottom: calc(var(--space) / 2);
    overflow: hidden;
    border-radius: var(--radius) var(--radius) 0 0;

    img {
      width: 100%;
    }

    &:empty {
      display: none;
    }
  }

  &__content {
    h2:first-child {
      margin-top: 0;
    }

    p:first-of-type {
      font-size: 1.2em;
      color: var(--title-color);
    }

    img {
      width: calc(100% + var(--space) * 2);
      margin-left: calc(var(--space) * -1);
      display: block;
      max-width: none;
    }
  }
}

.post-comments {
  padding: calc(var(--space) / 2);

  &:empty {
    display: none;
  }
}

.post-author {
  margin-top: calc(var(--space) / 2);
}
</style>
