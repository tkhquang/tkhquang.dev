<template>
  <ul class="nav__list flex-center h-full">
    <li
      :class="{
        'nav__list-item--is-active': isActive,
        'nav__list-item--is-open': isOpen
      }"
      class="nav__list-item relative h-full flex-center"
      @click="isOpen = !isOpen"
    >
      <template v-if="data.length">
        <button
          type="button"
          :title="label"
          class="nav__list-item__button text-lg flex-center w-full h-full px-4 rounded-md transition-all duration-200 focus:outline-none font-bold hover:bg-theme-secondary hover:text-theme-on-secondary"
        >
          <span class="truncate">
            {{ label }}
          </span>
          <span class="ml-2 w-4 h-4 block">
            <svg viewBox="0 0 451.847 451.847" width="16">
              <path
                d="M225.923,354.706c-8.098,0-16.195-3.092-22.369-9.263L9.27,151.157c-12.359-12.359-12.359-32.397,0-44.751
		c12.354-12.354,32.388-12.354,44.748,0l171.905,171.915l171.906-171.909c12.359-12.354,32.391-12.354,44.744,0
		c12.365,12.354,12.365,32.392,0,44.751L248.292,345.449C242.115,351.621,234.018,354.706,225.923,354.706z"
                fill="var(--on-surface)"
              />
            </svg>
          </span>
        </button>
        <div
          class="nav__list-item__dropdown absolute z-50 h-0 flex-center w-full p-2 invisible opacity-0 transition-all duration-200 rounded-md shadow-md text-lg"
        >
          <ul class="inline-block w-full h-full list-border">
            <li
              v-for="{ id, slug, title, path } in data"
              :key="id"
              class="whitespace-no-wrap flex-center flex-col"
            >
              <g-link
                :to="path"
                :title="`${title}`"
                :class="{ 'font-bold': activeSlug === slug }"
                class="flex-center h-full w-full py-2"
              >
                {{ title }}
              </g-link>
            </li>
          </ul>
        </div>
        <div
          class="nav__list-item__backdrop fixed z-40 block inset-0 bg-transparent cursor-default hidden"
          aria-hidden="true"
          hidden
        />
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
    },
    activeSlug: {
      type: String,
      default: ""
    }
  },

  data() {
    return {
      isOpen: false
    };
  }
};
</script>

<style lang="scss" scoped>
@import "~/assets/styles/_mixins";

$secondary-dark: get-color("secondary-dark");
$secondary-light: get-color("secondary-light");

$surface-dark: get-color("surface-dark");
$surface-light: get-color("surface-light");

.nav__list {
  height: 80%;

  &-item {
    $item: &;

    max-width: none;

    &--is-active {
      max-width: 150px;
    }

    &__button {
      #{$item}--is-open & {
        background-color: rgba($secondary-dark, 0.5);
        @include on-theme("light") {
          background-color: rgba($secondary-light, 0.5);
        }
      }

      #{$item}--is-active & {
        background-color: rgba($secondary-dark, 0.5);
        @include on-theme("light") {
          background-color: rgba($secondary-light, 0.5);
        }
      }
    }

    &__dropdown {
      top: 100%;
      width: 200px;

      background-color: rgba($surface-dark, 0.8);
      @include on-theme("light") {
        background-color: rgba($surface-light, 0.8);
      }

      #{$item}--is-open & {
        height: auto;
        margin-top: 0.25rem;
        visibility: visible;
        opacity: 1;
      }
    }

    &__backdrop {
      #{$item}--is-open & {
        display: block;
      }
    }
  }
}
</style>
