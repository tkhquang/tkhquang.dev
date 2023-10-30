<template>
  <div class="author flex-center flex-col text-center">
    <g-image
      :alt="metadata.siteOwner.name"
      :src="imageUrl"
      class="author__image rounded-full mb-4 shadow-lg"
      width="150"
      height="150"
      fit="cover"
      blur="10"
    />

    <h1 class="author__site-title text-2xl font-bold mb-4">
      {{ metadata.siteOwner.name }}
    </h1>

    <div
      class="author__intro v-html italic text-left opacity-75"
      v-html="metadata.siteOwner.description"
    />
  </div>
</template>

<script>
export default {
  inject: {
    $getMetadata: {
      type: Object,
      required: true
    }
  },

  computed: {
    metadata() {
      return this.$getMetadata();
    },

    imageUrl() {
      return require(`!!assets-loader?width=150&height=150&fit=cover&blur=10!~/../static/uploads/images/author.jpg`);
    }
  }
};
</script>

<style lang="scss" scoped>
.author /deep/ .v-html {
  p {
    display: inline;
    background-color: var(--surface);
  }
}
</style>
