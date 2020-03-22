<template>
  <div>
    <Bio :show-title="true" />

    <Pager :info="$page.allPosts.pageInfo" class="paging-wrapper" />

    <transition-group name="fade" tag="div" class="flex-center flex-col">
      <PostCard v-for="{ node } of loadedPosts" :key="node.id" :post="node" />
    </transition-group>

    <Pager :info="$page.allPosts.pageInfo" class="paging-wrapper" />

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
  </div>
</template>

<page-query>
  query allPost ($page: Int) {
    allPosts: allPost(filter: { published: { eq: true } }sortBy: "date", order: DESC, perPage: 5, page: $page) @paginate {
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

export default {
  components: {
    Bio,
    PostCard,
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
