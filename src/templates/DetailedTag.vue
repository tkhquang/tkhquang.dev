<template>
  <div>
    <Bio :show-title="true" />

    <Pager
      :info="$page.allPostsByTag.belongsTo.pageInfo"
      class="paging-wrapper"
    />

    <transition-group name="fade" tag="div" class="flex-center flex-col">
      <PostCard v-for="{ node } of loadedPosts" :key="node.id" :post="node" />
    </transition-group>

    <Pager
      :info="$page.allPostsByTag.belongsTo.pageInfo"
      class="paging-wrapper"
    />
  </div>
</template>

// To be changed since taxonomy belongsTo node cannot filter spreaded node
<page-query>
  query allPostsByTag ($page: Int, $path: String!) {
    allPostsByTag: tag(path: $path) {
      id
      title
      belongsTo (sortBy: "date", order: DESC, perPage: 5, page: $page) @paginate  {
        pageInfo {
          totalPages
          currentPage
        }
        edges {
          node {
            ... on Post {
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
    }
  }
</page-query>

<script>
import { Pager } from "gridsome";

import seo from "~/utils/mixins/seo.js";

import Bio from "~/components/Bio";
import PostCard from "~/components/PostCard.vue";

export default {
  components: {
    Bio,
    PostCard,
    Pager
  },
  mixins: [seo],
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
      this.loadedPosts.push(...this.$page.allPostsByTag.belongsTo.edges);
      this.currentPage = this.$page.allPostsByTag.belongsTo.pageInfo.currentPage;
    }
  }
};
</script>
