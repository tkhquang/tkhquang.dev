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
query {
  metadata {
    siteUrl
    pathPrefix
  }
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
import mixins from "~/utils/mixins";

import MainLayout from "~/layouts/Main.vue";

export default {
  components: {
    MainLayout
  },
  mixins: [mixins],
  provide() {
    return {
      settings: this.$static.settings.edges[0].node
    };
  },
  metaInfo() {
    // const settings = this.$static.settings.edges[0].node;
    return this.generateMetaInfo(undefined);
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
