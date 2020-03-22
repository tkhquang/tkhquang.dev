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
        <g-image
          v-if="$page.post.cover_image"
          alt="Cover image"
          class="post-card__image"
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

    <div class="post-comments">
      <!-- Add comment widgets here -->
    </div>

    <Bio class="post-author" :show-title="true" />
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
    created_at (format: "DD MMMM YYYY")
    updated_at (format: "DD MMMM YYYY")
    timeToRead
    description
    content
    cover_image (width: 1280, height: 720, blur: 10, quality: 80)
    tags
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
