<template>
  <div
    class="indicator relative block w-full h-5px z-20"
    aria-hidden="true"
    hidden
  >
    <div
      class="indicator__bar absolute top-0 left-0 h-5px primary"
      :style="`width: ${isInitalized ? yOffset : 0}%`"
    />
  </div>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  inject: {
    $getYOffset: {
      type: Number,
      required: true
    }
  },

  data() {
    return {
      isInitalized: false
    };
  },

  computed: {
    yOffset() {
      return this.$getYOffset();
    },
    ...mapGetters({
      isLoading: "page/isLoading"
    })
  },

  watch: {
    isLoading(newValue) {
      this.setIndicatorWidth(newValue);
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
