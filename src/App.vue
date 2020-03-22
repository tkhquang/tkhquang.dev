// This will let you keep your header, footer on all pages and add page
transitions.

<template>
  <MainLayout>
    <transition name="fade">
      <router-view />
    </transition>
  </MainLayout>
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

import MainLayout from "~/layouts/Main.vue";

export default {
  components: {
    MainLayout
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

<style lang="scss">
.fade-enter-active,
.fade-leave-active {
  transition-property: opacity;
  transition-duration: 0.5s;
}

.fade-enter-active {
  transition-delay: 0.5s;
}

.fade-enter,
.fade-leave-active {
  opacity: 0;
}
</style>
