<template>
  <div
    class="indicator relative block w-full h-5px z-20"
    aria-hidden="true"
    hidden
  >
    <div
      class="indicator__bar absolute top-0 left-0 h-5px primary"
      :style="`width: ${!isLoading ? yOffset : 0}%`"
    />
  </div>
</template>

<script>
import loadMixin from "~/vue-utils/mixins/load";

export default {
  inject: {
    $getYOffset: {
      type: Number,
      required: true
    }
  },

  mixins: [loadMixin],

  computed: {
    yOffset() {
      return this.$getYOffset();
    }
  },

  mounted() {
    this.setIndicatorWidth(this.isLoading);
  },

  methods: {
    setIndicatorWidth(isLoading) {
      if (isLoading) {
        return;
      }

      // Wait for the page transitions to end
      setTimeout(() => {
        this.isInitalized = true;
      }, 510);
    }
  }
};
</script>
