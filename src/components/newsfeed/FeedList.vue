<template>
  <section class="news-feed w-full lg:w-3/4">
    <FilterBar v-if="showFilterBar" />
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
        <PostCard v-for="{ node } of loadedPosts" :key="node.id" :post="node" />
      </transition-group>

      <h1
        v-if="pageInfo.isLast"
        class="w-full flex-center text-2xl font-bold leading-7 sm:text-3xl sm:leading-9 lg:w-4/5 mx-auto mt-6"
      >
        End of Results
      </h1>
    </template>

    <Pager :info="pageInfo" class="pagination-wrapper" />
  </section>
</template>

<script>
import { Pager } from "gridsome";

import PostCard from "./PostCard";
import FilterBar from "./FilterBar";

export default {
  components: {
    PostCard,
    Pager,
    FilterBar
  },

  props: {
    pageData: {
      type: Object,
      required: true
    },
    showFilterBar: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    loadedPosts() {
      return this.pageData.edges;
    },
    pageInfo() {
      return this.pageData.pageInfo;
    }
  }
};
</script>
