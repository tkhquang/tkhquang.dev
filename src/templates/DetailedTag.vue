<template>
  <div
    class="relative max-w-xl mx-auto px-4 mt-12 sm:px-6 lg:px-8 lg:max-w-screen-xl flex flex-wrap"
  >
    <section class="news-feed w-full lg:w-3/4">
      <h1
        v-if="!loadedPosts.length"
        class="w-full flex-center text-2xl font-bold leading-7 sm:text-3xl sm:leading-9 mt-6"
      >
        Sorry, there's nothing here :(
      </h1>

      <template v-else>
        <h1
          class="text-2xl font-bold leading-7 sm:text-3xl sm:leading-9 lg:w-4/5 mx-auto"
        >
          Latest Posts
        </h1>
        <transition-group
          name="fade"
          tag="ul"
          class="news-feed__list flex-center flex-col"
        >
          <PostCard
            v-for="{ node } of loadedPosts"
            :key="node.id"
            :post="node"
          />
        </transition-group>

        <h1
          v-if="$page.allPostsByTag.belongsTo.pageInfo.isLast"
          class="w-full flex-center text-2xl font-bold leading-7 sm:text-3xl sm:leading-9 lg:w-4/5 mx-auto mt-6"
        >
          End of Results
        </h1>
      </template>

      <Pager
        :info="$page.allPostsByTag.belongsTo.pageInfo"
        class="pagination-wrapper"
      />
    </section>
    <SideBar />
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
          isLast
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
                path
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

import SideBar from "~/components/SideBar";
import PostCard from "~/components/PostCard.vue";

export default {
  components: {
    SideBar,
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
    return this.generateMetaInfo({ siteTitle: this.$page.allPostsByTag.title });
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
