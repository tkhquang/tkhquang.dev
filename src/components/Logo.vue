<template slot-scope="settings">
  <g-link class="logo" to="/">
    <span class="logo__text"> &larr; {{ settings.siteName }} </span>
  </g-link>
</template>

<script>
export default {
  inject: {
    settings: {
      type: Object,
      required: true
    }
  }
};
</script>

<style lang="scss">
.logo {
  text-decoration: none;
  color: var(--body-color) !important;
  font-size: 0.9em;

  &__image {
    vertical-align: middle;
    border-radius: 99px;
    height: 40px;
    width: 40px;
    margin-right: 0.5em;
  }
}
</style>
