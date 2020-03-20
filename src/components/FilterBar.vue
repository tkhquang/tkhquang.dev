<template slot-scope="categories">
  <nav class="py-8 flex-center w-2/3 mx-auto">
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
        v-for="c in allCategories"
        :key="c.node.id"
        class=""
        :value="c.node.path"
      >
        {{ c.node.title }}
      </option>
    </select>
  </nav>
</template>

<script>
export default {
  data() {
    return {
      selected: this.$route.path
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
      const allCategories = [
        {
          node: {
            id: null,
            path: "/",
            slug: "all-post",
            title: "All Posts"
          }
        }
      ];
      return [...allCategories, ...this.categories.edges];
    }
  },
  methods: {
    onChange() {
      if (this.selected === "") {
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
