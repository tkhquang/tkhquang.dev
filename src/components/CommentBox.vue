<template>
  <div class="commentbox" />
</template>

<script>
import cssVars from "~/utils/mixins/cssVars.js";
import commentBox from "commentbox.io";

export default {
  mixins: [cssVars],

  data() {
    return {
      removeCommentBox: null
    };
  },

  mounted() {
    this.initCommentBox();
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
