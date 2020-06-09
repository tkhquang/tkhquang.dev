<template>
  <div class="commentbox" />
</template>

<script>
import commentBox from "commentbox.io";

export default {
  inject: {
    $getCssVars: {
      type: Object,
      required: true
    }
  },

  data() {
    return {
      removeCommentBox: null
    };
  },

  computed: {
    cssVars() {
      return this.$getCssVars();
    }
  },

  mounted() {
    this.$nextTick(() => {
      this.initCommentBox();
    });
  },

  beforeDestroy() {
    this.removeCommentBox();
  },

  methods: {
    initCommentBox() {
      this.removeCommentBox = commentBox(
        `${process.env.GRIDSOME_COMMENTBOX_PROJECT_ID}`,
        {
          backgroundColor: this.cssVars["surface"],
          textColor: this.cssVars["on-background"],
          subtextColor: this.cssVars["on-surface"]
        }
      );
    }
  }
};
</script>
