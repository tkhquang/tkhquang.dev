<template>
  <div>
    <Newsfeed :page-data="pageData" />
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
            path
          }
        }
      }
    }
    allPosts: allPost
      (
        filter: {
          published: {
            eq: true
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
            path
          }
        }
      }
    }
  }
</page-query>

<script>
import seo from "~/vue-utils/mixins/seo.js";

import Newsfeed from "~/components/layouts/Newsfeed";

export default {
  name: "Category",

  components: {
    Newsfeed
  },

  inject: {
    $categories: {
      type: Object,
      required: true
    }
  },

  mixins: [seo],

  computed: {
    pageData() {
      if (this.$context.slug) {
        return this.$page.allPosts;
      }
      return this.$page.allPostsByCategory;
    }
  },

  metaInfo() {
    if (this.$context.slug) {
      return this.generateMetaInfo({
        siteTitle: "All Posts"
      });
    }
    return this.generateMetaInfo({
      siteTitle: this.$categories[this.$route.params.slug].title
    });
  }
};
</script>
