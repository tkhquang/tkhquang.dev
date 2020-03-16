<template>
  <Layout>
    <div class="post-title">
      <h1 class="post-title__text">
        {{ $page.post.title }}
      </h1>

      <PostMeta :post="$page.post" />
    </div>

    <div class="post content-box">
      <div class="post__header">
        <g-image
          v-if="$page.post.metadata.hero.imgix_url"
          alt="Cover image"
          :src="$page.post.metadata.hero.imgix_url"
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

    <Bio class="post-author" :settings="this.$page.settings.edges[0].node" />
  </Layout>
</template>

<script>
import PostMeta from "~/components/PostMeta";
import PostTags from "~/components/PostTags";
import Bio from "~/components/Bio.vue";

export default {
  components: {
    Bio,
    PostMeta,
    PostTags
  },
  metaInfo() {
    return {
      title: this.$page.post.title,
      meta: [
        {
          name: "description",
          content: this.$page.post.metadata.description
        }
      ]
    };
  }
};
</script>

<page-query>
  query postQuery($path: String!) {
    post: cosmicjsPosts(path: $path) {
      id
      title
      content
      prevPath
      nextPath
      nextTitle
      prevTitle
      created_at(format: "DD MMMM YYYY")
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
      }
    }
    settings: allCosmicjsSettings {
      edges {
        node {
          metadata {
            site_title,
            site_heading,
            homepage_hero {
              imgix_url
            },
            author_bio,
            author_name,
            author_avatar {
              imgix_url
            },
          }
        }
      }
    }
  }
</page-query>

<style lang="scss">
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
