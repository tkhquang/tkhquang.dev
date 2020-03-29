<template>
  <DefaultLayout>
    <transition name="fade">
      <router-view />
    </transition>
  </DefaultLayout>
</template>

<static-query>
query index {
  metadata {
    siteTitle
    siteHeading
    siteName
    siteDescription
    siteTwitter
    siteUrl
    pathPrefix
    siteOwner {
      name
      description
    }
  }
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
import seo from "~/utils/mixins/seo.js";

import DefaultLayout from "~/layouts/Default";

export default {
  components: {
    DefaultLayout
  },
  mixins: [seo],
  provide() {
    let tagsBySlug = {};
    this.$static.categories.edges.forEach(
      ({ node: { id, title, slug, path } }) => {
        tagsBySlug[slug] = {
          id,
          slug,
          title,
          path
        };
      }
    );

    return {
      settings: this.$static.metadata,
      categories: tagsBySlug
    };
  },

  metaInfo() {
    return this.generateMetaInfo(this.$static.metadata);
  }
};
</script>
