<template>
  <div class="not-found flex-1 flex-center">
    <h1 class="text-2xl font-bold leading-7 sm:text-3xl sm:leading-9">
      404 - Not Found
    </h1>
  </div>
</template>

<script>
export default {
  name: "404",

  created() {
    this.$store.dispatch("page/NAME", this.$options.name);
  }
};
</script>

<style lang="scss" scoped>
// Placholder
</style>
