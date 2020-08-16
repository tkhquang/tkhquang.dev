<template>
  <div
    class="relative max-w-xl px-4 sm:px-6 lg:px-8 lg:max-w-screen-xl flex-center flex-wrap mx-auto my-8"
  >
    <section class="categories w-full lg:w-3/4 self-start">
      <div class="lg:w-4/5 mx-auto">
        <HorizontalLine class="mb-3 h-2px" />

        <h1
          class="text-center text-2xl font-bold leading-7 sm:text-3xl sm:leading-9"
        >
          Categories ({{ categories.length }})
        </h1>

        <HorizontalLine class="mt-3 h-2px" />

        <VsaList
          class="w-full my-10"
          :init-active="false"
          :auto-collapse="false"
        >
          <VsaItem v-for="category in categories" :key="category.id">
            <VsaHeading>
              {{ category.title }} ({{
                filterByCategories(category.slug).length
              }})
            </VsaHeading>

            <VsaIcon>
              <span class="open">V</span>
              <span class="close">X</span>
            </VsaIcon>

            <VsaContent>
              <ul class="post__list">
                <li
                  v-for="post in filterByCategories(category.slug)"
                  :key="post.id"
                  class="post__item mb-2 grid gap-4 p-2 hover:bg-theme-secondary hover:text-theme-on-secondary transition duration-500 rounded truncate"
                >
                  <time class="font-mono" :datetime="post.created_at">
                    <span class="hidden md:inline">
                      {{ formatDate(post.created_at).time }}
                    </span>
                    <span>
                      {{ formatDate(post.created_at).date }}
                    </span>
                  </time>
                  <g-link
                    class="link truncate"
                    :to="post.path"
                    :title="post.description"
                  >
                    <span>
                      {{ post.title }}
                    </span>
                  </g-link>
                </li>
              </ul>
            </VsaContent>
          </VsaItem>
        </VsaList>
      </div>
    </section>
    <BlogInfo class="w-full lg:w-1/4 self-start" />
  </div>
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
  allPosts: allPost (
      filter: {
        published: {
          eq: true
        }
      },
      sort: [
        {
          by: "created_at",
          order: DESC
        }
      ],
    ) {
    totalCount
    edges {
      node {
        id
        title
        created_at
        updated_at
        description
        category_slug
        cover_image (width: 1280, height: 720, blur: 10, quality: 80, fit: cover)
        path
        tags {
          id
          title
          path
        }
      }
    }
  }
}
</static-query>

<script>
import dayjs from "dayjs";

import seoMixin from "~/vue-utils/mixins/seo";
import routerMixin from "~/vue-utils/mixins/router";

import BlogInfo from "~/components/widgets/BlogInfo";

export default {
  components: {
    BlogInfo
  },

  mixins: [seoMixin, routerMixin],

  computed: {
    categories() {
      return this.$static.categories.edges.map(({ node }) => {
        return { ...node };
      });
    },

    posts() {
      return this.$static.allPosts.edges.map(({ node }) => {
        return { ...node };
      });
    }
  },

  methods: {
    filterByCategories(slug) {
      return this.posts.filter((post) => post.category_slug === slug);
    },

    formatDate(rawDate) {
      if (!dayjs(rawDate).isValid()) {
        return null;
      }

      return {
        time: dayjs(rawDate).format("HH:mm"),
        date: dayjs(rawDate).format("DD/MM/YYYY")
      };
    }
  },

  metaInfo() {
    return this.generateMetaInfo({ siteTitle: "All Categories" });
  }
};
</script>

<style lang="scss" scoped>
.post__item {
  grid-template-columns: 1fr 2fr;
}

.vsa-list {
  --vsa-bg-color: var(--surface);
  --vsa-highlight-color: var(--primary);
  --vsa-text-color: var(--on-surface);
  --vsa-border-color: var(--secondary);
}

.vsa-item {
  &--is-active {
    .vsa-item__trigger__icon {
      .open {
        display: none;
      }

      .close {
        display: block;
      }
    }
  }
  &__trigger__icon {
    .open {
      display: block;
    }

    .close {
      display: none;
    }
  }
}
</style>
