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
        path
      }
    }
  }
}
</static-query>

<script>
import seo from "~/vue-utils/mixins/seo.js";

import DefaultLayout from "~/layouts/Default";

export default {
  components: {
    DefaultLayout
  },
  mixins: [seo],

  created() {
    this.$store.dispatch("page/METADATA", this.$static.metadata);
  },

  metaInfo() {
    return this.generateMetaInfo(this.$static.metadata);
  }
};
</script>
