<template>
  <div
    class="relative max-w-xl mx-auto px-4 mt-12 sm:px-6 lg:px-8 lg:max-w-screen-xl flex flex-wrap"
  >
    <section class="news-feed w-full lg:w-3/4">
      <FilterBar />
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
          v-if="$page.allPostsByCategory.pageInfo.isLast"
          class="w-full flex-center text-2xl font-bold leading-7 sm:text-3xl sm:leading-9 lg:w-4/5 mx-auto mt-6"
        >
          End of Results
        </h1>
      </template>

      <Pager
        :info="$page.allPostsByCategory.pageInfo"
        class="pagination-wrapper"
      />
    </section>
    <SideBar />
  </div>
</template>

<page-query>
  query allPostsByCategory ($page: Int, $slug: String!) {
    allPostsByCategory: allPost(filter: { published: { eq: true }, category: { eq: $slug }}, sortBy: "date", order: DESC, perPage: 5, page: $page) @paginate {
      pageInfo {
        totalPages
        currentPage,
        isLast
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

import seo from "~/utils/mixins/seo.js";

import SideBar from "~/components/SideBar";
import PostCard from "~/components/PostCard.vue";
import FilterBar from "~/components/FilterBar.vue";

export default {
  components: {
    SideBar,
    PostCard,
    FilterBar,
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
      this.loadedPosts.push(...this.$page.allPostsByCategory.edges);
      this.currentPage = this.$page.allPostsByCategory.pageInfo.currentPage;
    }
  }
};
</script>
