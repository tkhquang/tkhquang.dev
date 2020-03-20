<template>
  <div class="post-card__container mx-auto grid grid-cols-2 gap-12">
    <PostCard
      v-for="(edge, index) in posts.edges"
      :key="edge.node.id"
      :post="edge.node"
      :class="getPostCardClass(index)"
    />
  </div>
</template>

<script>
import PostCard from "~/components/PostCard.vue";

export default {
  components: {
    PostCard
  },
  props: {
    posts: {
      type: Object,
      required: true
    }
  },
  methods: {
    getPostCardClass(index) {
      if (!index) {
        return "col-span-2";
      }
      return "col-span-2"; // md:col-span-1
    }
  }
};
</script>

<style lang="scss">
.post-card {
  &__container {
    max-width: var(--content-width);
  }
}
</style>
