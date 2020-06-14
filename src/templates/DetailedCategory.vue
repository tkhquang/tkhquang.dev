<template>
  <div
    class="relative max-w-xl mx-auto px-4 mt-12 sm:px-6 lg:px-8 lg:max-w-screen-xl flex flex-wrap"
  >
    <FeedList :page-data="$page.allPostsByCategory" :show-filter-bar="false" />
    <BlogInfo class="w-full lg:w-1/4 mt-8 lg:mt-4" />
  </div>
</template>

<page-query>
  query allPostsByCategory ($page: Int, $slug: String!) {
    allPostsByCategory: allPost
      (
        filter: {
          published: {
            eq: true
          },
          category: {
            eq: $slug
          }
        },
        sort: [
          {
            by: "created_at",
            order: DESC
          }
        ],
        perPage: 5,
        page: $page
      ) @paginate {
      totalCount
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
import seo from "~/vue-utils/mixins/seo.js";

import FeedList from "~/components/newsfeed/FeedList";
import BlogInfo from "~/components/widgets/BlogInfo";

export default {
  components: {
    FeedList,
    BlogInfo
  },
  inject: {
    $categories: {
      type: Object,
      required: true
    }
  },
  mixins: [seo],

  metaInfo() {
    return this.generateMetaInfo({
      siteTitle: this.$categories[this.$route.params.slug].title
    });
  }
};
</script>
