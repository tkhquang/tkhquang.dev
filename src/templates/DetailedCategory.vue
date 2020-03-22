<template>
  <div>
    <Bio :show-title="true" />

    <FilterBar />

    <Pager :info="$page.allPostsByCategory.pageInfo" class="paging-wrapper" />

    <transition-group name="fade" tag="div" class="flex-center flex-col">
      <PostCard v-for="{ node } of loadedPosts" :key="node.id" :post="node" />
    </transition-group>

    <Pager :info="$page.allPostsByCategory.pageInfo" class="paging-wrapper" />
  </div>
</template>

<page-query>
  query allPostsByCategory ($page: Int, $slug: String!) {
    allPostsByCategory: allPost(filter: { published: { eq: true }, category: { eq: $slug }}, sortBy: "date", order: DESC, perPage: 5, page: $page) @paginate {
      pageInfo {
        totalPages
        currentPage
      }
      edges {
        node {
          id
          title
          created_at
          updated_at
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
      this.loadedPosts.push(...this.$page.allPostsByCategory.edges);
      this.currentPage = this.$page.allPostsByCategory.pageInfo.currentPage;
    }
  }
};
</script>
