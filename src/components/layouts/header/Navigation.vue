<template>
  <nav class="flex-center h-full flex">
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
import pageMixin from "~/vue-utils/mixins/page";

import Layout from "./navigation/Layout";

export default {
  components: {
    Layout
  },

  mixins: [pageMixin],

  computed: {
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
      if (this.isHomePage || this.isTagPage) {
        return "Categories";
      }

      if (this.isPostPage) {
        if (this.$page.post) {
          return this.categories_all.find(
            (category) => category.slug === this.$page.post.category_slug
          ).title;
        }
      }

      if (this.isCategoryPage) {
        if (this.$route.params.slug) {
          return this.categories_all.find(
            (category) => category.slug === this.$route.params.slug
          ).title;
        }
      }

      return "All Posts";
    },

    categories_active_slug() {
      if (this.isHomePage || this.isTagPage) {
        return "";
      }

      if (this.isPostPage) {
        if (this.$page.post) {
          return this.categories_all.find(
            (category) => category.slug === this.$page.post.category_slug
          ).slug;
        }
      }

      if (this.isCategoryPage) {
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
