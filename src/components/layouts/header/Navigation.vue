<template>
  <nav class="flex-center h-full hidden md:flex">
    <Layout
      :data="categories.data"
      :label="categories.label"
      :is-active="categories.label !== 'Categories'"
      :active-slug="categories.activeSlug"
    />
  </nav>
</template>

<static-query>
query Navigation {
  categories: allCategory (
      sortBy: "title",
      filter: {
        slug: {
          ne: "hidden"
        }
      }
    ) {
    edges {
      node {
        id
        title
        slug
        path
      }
    }
  }
}
</static-query>

<script>
import Layout from "./navigation/Layout";

export default {
  components: {
    Layout
  },

  computed: {
    categories() {
      const allCategories = [
        {
          id: "all",
          title: "All Posts",
          slug: "all",
          path: "/categories/"
        },
        ...this.$static.categories.edges.map(({ node }) => {
          return { ...node };
        })
      ];

      const activeCategory = (() => {
        if (!this.$route.params.slug) {
          if (/^\/(\d.+)?$/.test(this.$route.path)) {
            return "Categories";
          }
          if (/^\/posts\/.*/.test(this.$route.path)) {
            return allCategories.find(
              (category) => category.slug === this.$page.post.category_slug
            ).title;
          }
          return "All Posts";
        }

        return allCategories.find(
          (category) => category.slug === this.$route.params.slug
        ).title;
      })();

      const activeSlug = (() => {
        if (!this.$route.params.slug) {
          if (/^\/(\d.+)?$/.test(this.$route.path)) {
            return "none";
          }
          if (/^\/posts\/.*/.test(this.$route.path)) {
            return allCategories.find(
              (category) => category.slug === this.$page.post.category_slug
            ).slug;
          }
          return "all";
        }

        return allCategories.find(
          (category) => category.slug === this.$route.params.slug
        ).slug;
      })();

      return {
        data: allCategories,
        label: activeCategory,
        activeSlug: activeSlug
      };
    }
  }
};
</script>

<style lang="scss" scoped>
//
</style>
