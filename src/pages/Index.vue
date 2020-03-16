<template>
  <Layout :show-logo="false">
    <Bio :show-title="false" />
    <PostCardGrid :posts="$page.posts" />
  </Layout>
</template>

<page-query>
  query IndexQuery {
    posts: allCosmicjsPosts (sortBy: "date", order: DESC, limit: 4) {
      edges {
        node {
          metadata {
            description
            hero {
              imgix_url
            }
            tags {
              _id
              title
              metadata {
                path
              }
            }
          }
          id
          slug
          path
          title
          created_at(format: "DD MMMM, YYYY")
        }
      }
    }
  }
</page-query>

<script>
import mixins from "~/utils/mixins";

import Bio from "~/components/Bio";
import PostCardGrid from "~/components/PostCardGrid.vue";

export default {
  components: {
    Bio,
    PostCardGrid
  },
  mixins: [mixins],
  metaInfo() {
    return this.generateMetaInfo(
      // Force chomp using comment
      "Home",
      "Ljóss - The portal to a nobody's inner world"
    );
  }
};
</script>
