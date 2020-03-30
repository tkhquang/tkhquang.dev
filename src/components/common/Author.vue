<template slot-scope="settings">
  <div class="author flex-center flex-col text-center">
    <g-image
      :alt="settings.siteOwner.name"
      :src="imageUrl"
      class="author__image rounded-full mb-4 shadow-lg"
      width="150"
      height="150"
      fit="cover"
      blur="10"
    />

    <h1 class="author__site-title text-2xl font-bold mb-4">
      {{ settings.siteOwner.name }}
    </h1>

    <div
      class="author__intro v-html text-left opacity-75"
      v-html="settings.siteOwner.description"
    />
  </div>
</template>

<script>
export default {
  inject: {
    settings: {
      type: Object,
      required: true
    }
  },
  computed: {
    imageUrl() {
      return require(`!!assets-loader?width=150&height=150&fit=cover&blur=10!~/assets/uploads/images/author.jpg`);
    }
  }
};
</script>
