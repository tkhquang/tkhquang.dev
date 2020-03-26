<template slot-scope="categories">
  <ul class="tag-list inline-flex mt-4">
    <li v-for="tag in post.tags" :key="tag.id" class="tag-list__item">
      <g-link
        :to="tag.path"
        class="tag-list__item__link mr-3 text-sm text-theme-primary no-underline bg-theme-secondary p-2 rounded-sm"
      >
        # {{ tag.title }}
      </g-link>
    </li>
  </ul>
</template>

<script>
export default {
  props: {
    post: {
      type: Object,
      required: true
    }
  }
};
</script>
