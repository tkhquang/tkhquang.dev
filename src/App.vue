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
      settings: this.$static.metadata
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
