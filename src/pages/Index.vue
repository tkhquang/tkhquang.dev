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
          v-if="$page.allPosts.pageInfo.isLast"
          class="w-full flex-center text-2xl font-bold leading-7 sm:text-3xl sm:leading-9 lg:w-4/5 mx-auto mt-6"
        >
          End of Results
        </h1>
      </template>

      <Pager :info="$page.allPosts.pageInfo" class="pagination-wrapper" />

      <!-- <ClientOnly>
          <infinite-loading spinner="spiral" @infinite="infiniteHandler">
            <div slot="no-more">
              You've scrolled through all the posts ;)
            </div>
            <div slot="no-results">
              Sorry, no posts yet :(
            </div>
          </infinite-loading>
        </ClientOnly> -->
    </section>
    <SideBar />
  </div>
</template>

<page-query>
  query allPost ($page: Int) {
    allPosts: allPost(filter: { published: { eq: true } }sortBy: "date", order: DESC, perPage: 5, page: $page) @paginate {
      pageInfo {
        totalPages
        currentPage
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
            path
          }
        }
      }
    }
  }
</page-query>

<script>
import { Pager } from "gridsome";

import seo from "~/utils/mixins/seo.js";

import PostCard from "~/components/PostCard.vue";
import SideBar from "~/components/SideBar.vue";

export default {
  components: {
    PostCard,
    SideBar,
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
      this.loadedPosts.push(...this.$page.allPosts.edges);
      this.currentPage = this.$page.allPosts.pageInfo.currentPage;
    }
    // async infiniteHandler($state) {
    //   if (this.currentPage + 1 > this.$page.allPosts.pageInfo.totalPages) {
    //     $state.complete();
    //   } else {
    //     const { data } = await this.$fetch(`/${this.currentPage + 1}`);

    //     if (data.allPosts.edges.length) {
    //       this.currentPage = data.allPosts.pageInfo.currentPage;
    //       this.loadedPosts.push(...data.allPosts.edges);
    //       $state.loaded();
    //     } else {
    //       $state.complete();
    //     }
    //   }
    // }
  }
};
</script>
