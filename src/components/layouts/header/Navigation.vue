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
      sortBy: "title"
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
import { mapGetters } from "vuex";

import Layout from "./navigation/Layout";

export default {
  components: {
    Layout
  },

  computed: {
    ...mapGetters({
      isCurrent: "page/isCurrent"
    }),

    categories_all() {
      return [
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
    },

    categories_label() {
      if (this.isCurrent("Home")) {
        return "Categories";
      }

      if (this.isCurrent("Post")) {
        if (this.$page.post) {
          return this.categories_all.find(
            (category) => category.slug === this.$page.post.category_slug
          ).title;
        }
      }

      if (this.isCurrent("Category")) {
        if (this.$route.params.slug) {
          return this.categories_all.find(
            (category) => category.slug === this.$route.params.slug
          ).title;
        }
      }

      return "All Posts";
    },

    categories_active_slug() {
      if (this.isCurrent("Home")) {
        return "";
      }

      if (this.isCurrent("Post")) {
        if (this.$page.post) {
          return this.categories_all.find(
            (category) => category.slug === this.$page.post.category_slug
          ).slug;
        }
      }

      if (this.isCurrent("Category")) {
        if (this.$route.params.slug) {
          return this.categories_all.find(
            (category) => category.slug === this.$route.params.slug
          ).slug;
        }
      }

      return "all";
    },

    categories() {
      return {
        data: this.categories_all,
        label: this.categories_label,
        activeSlug: this.categories_active_slug
      };
    }
  }
};
</script>

<style lang="scss" scoped>
//
</style>
