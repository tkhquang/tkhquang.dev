<template slot-scope="settings">
  <div class="author w-full flex-center flex-col mx-auto text-center">
    <g-image
      :alt="settings.siteOwner.name"
      :src="
        require(`!!assets-loader?width=180&height=180&fit=cover&blur=10!~/assets/uploads/images/author.jpg`)
      "
      class="author__image rounded-full mb-4"
      width="180"
      height="180"
      fit="cover"
      blur="10"
    />

    <h1 v-if="showTitle" class="author__site-title text-2xl">
      {{ settings.siteOwner.name }}
    </h1>

    <div
      class="author__intro flex-center opacity-75"
      v-html="settings.siteOwner.description"
    />
  </div>
</template>

<script>
export default {
  props: {
    showTitle: {
      type: Boolean,
      default: false
    }
  },
  inject: {
    settings: {
      type: Object,
      required: true
    }
  }
};
</script>

<style lang="scss">
.author {
  max-width: 500px;
  padding: calc(var(--space) / 2) 0;

  &__image {
    width: 90px;
    height: 90px;
  }

  &__links {
    /* -mt-2 */
    a {
      /* mx-2 my-0 */
    }
  }
}
</style>
