<template>
  <div>
    <Newsfeed :page-data="pageData" />
  </div>
</template>

<page-query>
  query allPostsByCategory ($page: Int, $slug: String!) {
    allPostsByCategory: allPost (
        filter: {
          published: {
            eq: true
          },
          category_slug: {
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

<static-query>
query pathInfo {
  categories: allCategory (sortBy: "title") {
    edges {
      node {
        id
        title
        slug
        path
      }
    }
  }
}
</static-query>

<script>
import seoMixin from "~/vue-utils/mixins/seo";
import routerMixin from "~/vue-utils/mixins/router";

import Newsfeed from "~/components/layouts/Newsfeed";

export default {
  name: "Category",

  components: {
    Newsfeed
  },

  mixins: [seoMixin, routerMixin],

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
      siteTitle: this.$static.categories.edges.find(
        ({ node }) => node.slug === this.$route.params.slug
      ).node.title
    });
  }
};
</script>
