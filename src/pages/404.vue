<template>
  <div class="not-found flex-1 flex-center">
    <h1 class="text-2xl font-bold leading-7 sm:text-3xl sm:leading-9">
      404 - Not Found
    </h1>
  </div>
</template>

<script>
import routerMixin from "~/vue-utils/mixins/router";

export default {
  name: "NotFound",

  mixins: [routerMixin]
};
</script>

<style lang="scss" scoped>
// Placholder
</style>
