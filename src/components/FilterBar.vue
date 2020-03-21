<template slot-scope="categories">
  <nav class="py-4 flex-center w-2/3 mx-auto">
    <label for="category" class="font-bold w-1/4 text-right mr-4">
      Filter:
    </label>
    <select
      id="category"
      v-model="selected"
      name="category"
      class="theme-color bg-blue-900 h-10 w-3/4"
      @change="onChange"
    >
      <option
        v-for="categories in Object.values(allCategories)"
        :key="categories.id"
        class=""
        :value="categories.path"
      >
        {{ categories.title }}
      </option>
    </select>
  </nav>
</template>

<script>
export default {
  data() {
    return {
      // To be improved in the future, Bruteforce for now
      selected: this.$route.path.replace(/\/\d+(\/|.*)$/, "/")
    };
  },
  inject: {
    categories: {
      type: Object,
      required: true
    }
  },
  computed: {
    allCategories() {
      return {
        all: {
          id: null,
          title: "All Posts",
          slug: "all",
          path: "/"
        },
        ...this.categories
      };
    }
  },
  methods: {
    onChange() {
      if (this.selected === "all") {
        this.$router.push({ path: "/" });
      } else {
        this.$router.push({
          path: this.selected
        });
      }
    }
  }
};
</script>

<style lang="scss">
// Styles
</style>
