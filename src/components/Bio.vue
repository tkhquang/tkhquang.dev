<template>
  <div class="author w-full flex-center flex-col mx-auto text-center">
    <g-image
      :alt="settings.metadata.author_name"
      :src="settings.metadata.author_avatar.imgix_url"
      class="author__image rounded-full mb-4"
      width="180"
      height="180"
      blur="5"
    />

    <h1 v-if="showTitle" class="author__site-title text-2xl">
      {{ settings.metadata.site_heading }}
    </h1>

    <div
      class="author__intro flex-center opacity-75"
      v-html="settings.metadata.author_bio"
    />
  </div>
</template>

<script>
export default {
  props: {
    settings: {
      type: Object,
      required: true
    },
    showTitle: {
      type: Boolean,
      default: false
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
