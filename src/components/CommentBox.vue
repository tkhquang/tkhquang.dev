<template>
  <div ref="commentBox" class="commentbox" />
</template>

<script>
import commentBox from "commentbox.io";
import { isEmpty } from "lodash";

export default {
  props: {
    cssVars: {
      type: Object,
      required: true
    }
  },

  data() {
    return {
      removeCommentBox: null
    };
  },

  mounted() {
    this.initCommentBox();
  },

  beforeDestroy() {
    if (this.removeCommentBox) {
      this.removeCommentBox();
    }
  },

  methods: {
    initCommentBox() {
      if (isEmpty(this.cssVars)) {
        return;
      }

      this.removeCommentBox = commentBox(
        `${process.env.GRIDSOME_COMMENTBOX_PROJECT_ID}`,
        {
          backgroundColor: this.cssVars["surface"],
          textColor: this.cssVars["on-background"],
          subtextColor: this.cssVars["on-surface"]
        }
      );

      try {
        this.$nextTick(() => {
          this.$refs.commentBox
            .getElementsByTagName("iframe")[0]
            .setAttribute("id", "comment-box");
        });
      } catch (error) {
        console.log(error);
      }
    }
  }
};
</script>
