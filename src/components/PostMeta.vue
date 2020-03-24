<template>
  <div
    class="article-meta text-red-700 uppercase font-semibold text-md tracking-wider opacity-75"
  >
    <span>
      <time :datetime="post.created_at">{{ dates.created_at }}</time>
    </span>
    <span v-if="dates.updated_at">
      (Updated: <time :datetime="post.updated_at">{{ dates.updated_at }}</time
      >)</span
    >
  </div>
</template>

<script>
import dayjs from "dayjs";

export default {
  props: {
    post: {
      type: Object,
      required: true
    }
  },
  computed: {
    dates() {
      const formatDate = rawDate => {
        if (!dayjs(rawDate).isValid()) {
          return null;
        }
        return dayjs(rawDate).format("MMMM DD, YYYY");
      };
      return {
        created_at: formatDate(this.post.created_at),
        updated_at: formatDate(this.post.updated_at)
      };
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
