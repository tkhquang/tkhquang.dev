<template>
  <div>
    <Newsfeed :page-data="$page.allPosts" />
  </div>
</template>

<page-query>
  query allPost ($page: Int) {
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
        currentPage
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

<script>
import seoMixin from "~/vue-utils/mixins/seo";
import routerMixin from "~/vue-utils/mixins/router";

import Newsfeed from "~/components/layouts/Newsfeed";

export default {
  name: "Home",

  components: {
    Newsfeed
  },

  mixins: [seoMixin, routerMixin],

  metaInfo() {
    return this.generateMetaInfo({ siteTitle: "Home" });
  }
};
</script>
