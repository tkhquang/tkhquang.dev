<template>
  <nav class="flex-center h-full">
    <Layout
      :data="categories"
      :label="activeCategory"
      :is-active="activeCategory !== 'Categories'"
      :active-slug="activeSlug"
    />
  </nav>
</template>

<script>
import Layout from "./navigation/Layout";

export default {
  components: {
    Layout
  },

  inject: {
    $categories: {
      type: Object,
      required: true
    }
  },

  computed: {
    categories() {
      const allCategories = {
        all: {
          id: "all",
          title: "All Posts",
          slug: "all",
          path: "/categories/"
        },
        ...this.$categories
      };
      return Object.values(allCategories).filter(
        (category) => category.slug !== "hidden"
      );
    },

    activeCategory() {
      if (!this.$route.params.slug) {
        if (/^\/(\d.+)?$/.test(this.$route.path)) {
          return "Categories";
        }
        if (/^\/posts\/.*/.test(this.$route.path)) {
          return this.$categories[this.$page.post.category].title;
        }
        return "All Posts";
      }

      return this.$categories[this.$route.params.slug].title;
    },

    activeSlug() {
      if (!this.$route.params.slug) {
        if (/^\/(\d.+)?$/.test(this.$route.path)) {
          return "none";
        }
        if (/^\/posts\/.*/.test(this.$route.path)) {
          return this.$categories[this.$page.post.category].slug;
        }
        return "all";
      }

      return this.$categories[this.$route.params.slug].slug;
    }
  }
};
</script>

<style lang="scss" scoped>
//
</style>
