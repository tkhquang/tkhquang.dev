<template>
  <div
    class="indicator fixed top-0 left-0 h-5px z-50 primary mt-header-height"
    :style="`width: ${width}%`"
  />
</template>

<script>
export default {
  props: {
    width: {
      type: Number,
      default: 0
    }
  }
};
</script>
