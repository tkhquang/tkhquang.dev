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

  metaInfo() {
    return this.generateMetaInfo(this.$static.metadata);
  },

  mounted() {
    this.$Progress.finish();
  },

  created() {
    this.$Progress.start();

    this.$router.beforeEach((to, from, next) => {
      //  Does the page we want to go to have a meta.progress object?
      if (to.meta.progress !== undefined) {
        let meta = to.meta.progress;

        this.$Progress.parseMeta(meta);
      }

      this.$Progress.start();

      next();
    });

    this.$router.afterEach((to, from) => {
      this.$Progress.finish();
    });
  }
};
</script>
