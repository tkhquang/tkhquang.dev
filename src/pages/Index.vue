<template>
  <div>
    <Bio :show-title="false" />
    <PostCardGrid :posts="$page.posts" />
  </div>
</template>

<page-query>
  query {
    posts: allPosts(filter: { published: { eq: true }}, sortBy: "date", order: DESC, limit: 7) {
      edges {
        node {
          id
          title
          created_at (format: "D. MMMM YYYY")
          updated_at (format: "D. MMMM YYYY")
          timeToRead
          description
          cover_image (width: 1280, height: 720, blur: 10, quality: 80, fit: cover)
          path
          tags {
            id
            title
          }
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
    return this.generateMetaInfo({ siteTitle: "Home" });
  }
};
</script>
