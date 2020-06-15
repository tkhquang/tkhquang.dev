<template>
  <ul
    :class="{ 'nav__list--is-active': isActive }"
    class="nav__list flex-center h-full px-2"
  >
    <li
      class="nav__list-item relative h-full flex-center"
      :class="{ 'nav__list-item--is-open': isOpen }"
      @click="(isOpen = !isOpen), (active = !active)"
    >
      <template v-if="data.length > 1">
        <button
          type="button"
          :class="{ isOpen }"
          class="nav__list-item__label text-lg flex-center w-full h-full px-2 rounded-md transition-all duration-200 focus:outline-none font-bold hover:bg-theme-secondary hover:text-theme-on-secondary"
        >
          {{ label }}
          <svg class="ml-2" viewBox="0 0 451.847 451.847" width="12">
            <path
              d="M225.923,354.706c-8.098,0-16.195-3.092-22.369-9.263L9.27,151.157c-12.359-12.359-12.359-32.397,0-44.751
		c12.354-12.354,32.388-12.354,44.748,0l171.905,171.915l171.906-171.909c12.359-12.354,32.391-12.354,44.744,0
		c12.365,12.354,12.365,32.392,0,44.751L248.292,345.449C242.115,351.621,234.018,354.706,225.923,354.706z"
              fill="var(--on-surface)"
            />
          </svg>
        </button>
        <div
          :class="{ isOpen }"
          class="dropdown absolute surface flex-center w-full p-2 rounded-md shadow-md -translate-x-1/2 origin-top-left transform scale-0"
        >
          <ul class="inline-block w-full h-full">
            <li
              v-for="{ id, slug, title, path } in data"
              :key="id"
              class="whitespace-no-wrap flex-center flex-col"
            >
              <g-link :to="path" :title="`${title}`" class="inline-block py-2">
                {{ title }}
              </g-link>
            </li>
          </ul>
        </div>
      </template>
      <template v-else>
        <g-link :to="data[0].path">
          {{ data[0].title }}
        </g-link>
      </template>
    </li>
  </ul>
</template>

<script>
export default {
  props: {
    data: {
      type: Array,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    isActive: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      isOpen: false,
      active: false
    };
  }
};
</script>

<style lang="scss" scoped>
@import "~/assets/styles/_mixins";

$secondary-dark: get-color("secondary-dark");
$secondary-light: get-color("secondary-light");

.nav__list {
  height: 80%;

  &--is-active {
    .nav__list-item__label {
      color: var(--on-secondary);

      background-color: rgba($secondary-dark, 0.5);
      @include on-theme("light") {
        background-color: rgba($secondary-light, 0.5);
      }

      &:hover {
        background-color: var(--secondary);
      }
    }
  }
  &-item {
    &--is-open {
      .nav__list-item__label {
        color: var(--on-secondary);

        background-color: rgba($secondary-dark, 0.5);
        @include on-theme("light") {
          background-color: rgba($secondary-light, 0.5);
        }

        &:hover {
          background-color: var(--secondary);
        }
      }
    }
  }
}

.dropdown {
  top: 100%;
  position: absolute;
  width: 200px;
  left: 50%;
  // transform: translatex(-50%) rotatex(90deg) scale(0);
  // transform-origin: 0 0;
  margin-top: 0.2em;
  visibility: hidden;
  opacity: 0;
  transition: all 200ms linear;

  &.isOpen {
    transform: translatex(-50%);
    visibility: visible;
    opacity: 1;
  }
}
</style>
