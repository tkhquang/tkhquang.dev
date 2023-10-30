<template>
  <div class="modal relative z-fg">
    <button
      class="relative flex-center z-fg w-10 h-10 cursor-pointer m-10 hover:opacity-75 focus:outline-none"
      @click="toggle"
    >
      <slot name="trigger" />
    </button>

    <transition :name="transition">
      <slot v-if="open" name="data" />
    </transition>
    <transition name="alpha-fade">
      <div
        v-if="open"
        class="modal__backdrop fixed inset-0 z-bg cursor-pointer"
        :class="alphaClass"
        :style="{ backgroundColor: `rgba(0, 0, 0, ${alpha})` }"
        @click="toggle(false)"
      />
    </transition>
  </div>
</template>

<script>
export default {
  props: {
    alpha: {
      type: [Number, String],
      default: 0.3
    },
    transition: {
      type: String,
      default: "fade"
    },
    alphaClass: {
      type: String,
      default: ""
    }
  },

  data() {
    return {
      open: false
    };
  },

  created() {
    this.$parent.$on("toggle-modal", (force) => {
      this.toggle(force);
    });
  },

  beforeDestroy() {
    this.$parent.$off("toggle-modal");
  },

  methods: {
    toggle(force = null) {
      const newState = typeof force === "boolean" ? force : !this.open;

      this.open = newState;
    }
  }
};
</script>

<style lang="scss">
.slide-ltr-enter-active,
.slide-ltr-leave-active {
  transition: all 0.5s ease-in-out;
}

.slide-ltr-enter,
.slide-ltr-leave-to {
  transform: translateX(-100%);
}

.slide-ltr-enter-to {
  transform: translateX(0%);
}

.alpha-fade-enter-active,
.alpha-fade-leave-active {
  transition: opacity 0.5s linear;
}

.alpha-fade-enter,
.alpha-fade-leave-to {
  opacity: 0;
}

.alpha-fade-enter-to {
  opacity: 1;
}
</style>
