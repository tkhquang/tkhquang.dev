<template>
  <DefaultLayout>
    <transition name="fade">
      <router-view />
    </transition>
    <vue-progress-bar></vue-progress-bar>
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
import seoMixin from "~/vue-utils/mixins/seo";

import DefaultLayout from "~/layouts/Default";

export default {
  components: {
    DefaultLayout
  },

  mixins: [seoMixin],

  data() {
    return {
      metadata: {}
    };
  },

  provide() {
    return {
      $getMetadata: () => this.$static.metadata
    };
  },

  mounted() {
    this.$Progress.finish();
  },

  created() {
    if (process.isClient) {
      if (!this.$Progress.$vm.RADON_LOADING_BAR.percent) {
        this.$Progress.start();
      } else {
        this.$Progress.set(this.$Progress.$vm.RADON_LOADING_BAR.percent || 0);
      }
    }
  },

  metaInfo() {
    return this.generateMetaInfo(this.$static.metadata);
  }
};
</script>
