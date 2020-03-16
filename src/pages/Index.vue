<template>
  <Layout :show-logo="false" :settings="$static.settings.edges[0].node">
    <Bio :settings="$static.settings.edges[0].node" :show-title="false" />
    <PostCardGrid :posts="$page.posts" />
  </Layout>
</template>

<page-query>
  query IndexQuery {
    posts: allCosmicjsPosts (sortBy: "date", order: DESC, limit: 4) {
      edges {
        node {
          metadata {
            description
            hero {
              imgix_url
            }
            tags {
              _id
              title
              metadata {
                path
              }
            }
          }
          id
          slug
          path
          title
          created_at(format: "DD MMMM, YYYY")
        }
      }
    }
  }
</page-query>

<static-query>
query {
  settings: allCosmicjsSettings {
    edges {
      node {
        metadata {
          site_title,
          site_heading,
          homepage_hero {
            imgix_url
          },
          author_bio,
          author_name,
          author_avatar{
            imgix_url
          },
        }
      }
    }
  }
}
</static-query>

<script>
import config from "@/assets/config";

import Bio from "../components/Bio";
import PostCardGrid from "~/components/PostCardGrid.vue";

export default {
  components: {
    Bio,
    PostCardGrid
  },
  metaInfo() {
    return config.generateMetaInfo("Home");
  }
};
</script>
