<template>
  <div class="post-meta italic">
    <span>Posted on {{ post.created_at }}</span>
    <span v-if="post.modified_at"> (Updated: {{ post.modified_at }})</span>
  </div>
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

<style lang="scss">
.post-meta {
  font-size: 0.8em;
  opacity: 0.8;
}
</style>
