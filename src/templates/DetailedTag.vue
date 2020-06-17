<template>
  <div>
    <Newsfeed :page-data="$page.allPostsByTag.belongsTo" />
  </div>
</template>

<page-query>
  # To be changed since taxonomy belongsTo node cannot filter spreaded node
  # For the moment, this cannot filtered out `published: false` posts yet
  query allPostsByTag ($page: Int, $path: String!) {
    allPostsByTag: tag(path: $path) {
      id
      title
      belongsTo
        (
          sort: [
            {
              by: "created_at",
              order: DESC
            }
          ],
          perPage: 5,
          page: $page
        ) @paginate  {
        totalCount
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
import seo from "~/vue-utils/mixins/seo.js";

import Newsfeed from "~/components/layouts/Newsfeed";

export default {
  name: "Tag",

  components: {
    Newsfeed
  },

  mixins: [seo],

  created() {
    this.$store.dispatch("page/NAME", this.$options.name);
  },

  metaInfo() {
    return this.generateMetaInfo({ siteTitle: this.$page.allPostsByTag.title });
  }
};
</script>
