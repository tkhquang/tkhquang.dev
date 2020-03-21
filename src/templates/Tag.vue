<template>
  <div>
    <Bio :show-title="true" />

    <FilterBar />

    <Pager :info="$page.allPostsByTag.pageInfo" class="paging-wrapper" />

    <transition-group name="fade" tag="div" class="flex-center flex-col">
      <PostCard v-for="{ node } of loadedPosts" :key="node.id" :post="node" />
    </transition-group>

    <Pager :info="$page.allPostsByTag.pageInfo" class="paging-wrapper" />
  </div>
</template>

<page-query>
  query allPostsByTag ($page: Int, $slug: String!) {
    allPostsByTag: allPost(filter: { published: { eq: true }, tags: { contains: [$slug] }}, sortBy: "date", order: DESC, perPage: 5, page: $page) @paginate {
      pageInfo {
        totalPages
        currentPage
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
import PostCard from "~/components/PostCard.vue";
import FilterBar from "~/components/FilterBar.vue";

export default {
  components: {
    Bio,
    PostCard,
    FilterBar,
    Pager
  },
  mixins: [mixins],
  data() {
    return {
      loadedPosts: [],
      currentPage: 1
    };
  },
  watch: {
    $route() {
      this.updatePageContent();
    }
  },
  created() {
    this.updatePageContent();
  },
  metaInfo() {
    return this.generateMetaInfo({ siteTitle: "Home" });
  },
  methods: {
    updatePageContent() {
      this.loadedPosts = [];
      this.loadedPosts.push(...this.$page.allPostsByTag.edges);
      this.currentPage = this.$page.allPostsByTag.pageInfo.currentPage;
    }
  }
};
</script>
