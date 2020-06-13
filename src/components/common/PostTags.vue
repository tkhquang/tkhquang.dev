<template>
  <ul class="tag-list inline-flex">
    <li v-for="tag in post.tags" :key="tag.id" class="tag-list__item flex">
      <g-link
        :to="tag.path"
        class="tag-list__item__link mr-3 text-sm no-underline px-2 py-1 rounded-sm secondary hover:shadow-inner"
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
