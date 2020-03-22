<template>
  <div class="post-meta italic">
    <span>Posted on {{ dates.created_at }}</span>
    <span v-if="dates.updated_at"> (Updated: {{ dates.updated_at }})</span>
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
        return dayjs(rawDate).format("DD MMMM YYYY");
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
