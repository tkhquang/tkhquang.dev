<template>
  <nav
    v-if="isPostPage && isCategoryPage && isTagPage"
    class="path-info font-bold italic text-theme-primary"
  >
    <HorizontalLine class="my-3" />
    <g-link class="path-info__link" to="/blog">
      Home
    </g-link>
    ->
    <g-link class="path-info__link" :to="pathData.base.path">
      {{ pathData.base.title }}
    </g-link>
    ->
    <g-link class="path-info__link" :to="pathData.path">
      {{ pathData.title }}
    </g-link>
    <HorizontalLine class="my-3" />
  </nav>
</template>

<static-query>
query pathInfo {
  categories: allCategory (sortBy: "title") {
    edges {
      node {
        id
        title
        slug
        path
      }
    }
  }
  tags: allTag (sortBy: "title") {
    edges {
      node {
        id
        title
        path
      }
    }
  }
}
</static-query>

<script>
import pageMixin from "~/vue-utils/mixins/page";

export default {
  mixins: [pageMixin],

  props: {
    categorySlug: {
      type: String,
      required: false,
      default: undefined
    }
  },

  computed: {
    pathData() {
      return this.category || this.tag;
    },

    allCategories() {
      return this.$static.categories.edges.map(({ node }) => {
        return {
          ...node,
          base: {
            path: "/blog/categories/",
            title: "Categories"
          }
        };
      });
    },

    category() {
      if (!this.isCategoryPage && !this.isPostPage) {
        return null;
      }

      return this.allCategories.find((category) => {
        return category.path.includes(
          this.categorySlug || this.$route.params.slug
        );
      });
    },

    allTags() {
      return this.$static.tags.edges.map(({ node }) => {
        return {
          ...node,
          base: {
            path: "/blog/tags/",
            title: "Tags"
          }
        };
      });
    },

    tag() {
      if (!this.isTagPage) {
        return null;
      }

      return this.allTags.find((tag) => {
        return tag.path.includes(this.$route.params.title);
      });
    }
  }
};
</script>

<style lang="scss" scoped>
//
</style>
