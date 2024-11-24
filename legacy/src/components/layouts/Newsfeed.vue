<template>
  <div
    class="relative max-w-xl mx-auto px-4 my-12 sm:px-6 lg:px-8 lg:max-w-screen-xl flex flex-wrap"
  >
    <FeedList :page-data="pageData" />
    <BlogInfo class="w-full lg:w-1/4 mt-8 lg:mt-4" />
  </div>
</template>

<script>
import FeedList from "~/components/newsfeed/FeedList";
import BlogInfo from "~/components/widgets/BlogInfo";

export default {
  components: {
    FeedList,
    BlogInfo
  },

  props: {
    pageData: {
      type: Object,
      required: true
    }
  }
};
</script>
