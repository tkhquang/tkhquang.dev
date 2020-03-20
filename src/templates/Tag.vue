<template>
  <div>
    <Bio :show-title="true" />
    <FilterBar />
    <PostCardGrid :posts="$page.allPostsByTag" />
    <Pager :info="$page.allPostsByTag.pageInfo" class="hidden" />
  </div>
</template>

<page-query>
  query allPostsByTag ($page: Int, $slug: String!) {
    allPostsByTag: allPost(filter: { published: { eq: true }, tags: { contains: [$slug] }}, sortBy: "date", order: DESC, limit: 1, perPage: 1, page: $page) @paginate {
      pageInfo {
        totalPages
        currentPage,
        perPage,
        totalItems
      }
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
          tags # [slug]
        }
      }
    }
  }
</page-query>

<script>
import { Pager } from "gridsome";

import mixins from "~/utils/mixins";

import Bio from "~/components/Bio";
import PostCardGrid from "~/components/PostCardGrid.vue";
import FilterBar from "~/components/FilterBar.vue";

export default {
  components: {
    Bio,
    PostCardGrid,
    FilterBar,
    Pager
  },
  mixins: [mixins],
  metaInfo() {
    return this.generateMetaInfo({ siteTitle: "Home" });
  }
};
</script>
