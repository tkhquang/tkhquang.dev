<template>
  <div ref="commentBox" class="commentbox" />
</template>

<script>
import commentBox from "commentbox.io";
import { helpers } from "~/utils/";

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
      if (helpers.isEmpty(this.cssVars)) {
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
          const iframe = this.$refs.commentBox.getElementsByTagName(
            "iframe"
          )[0];

          iframe.setAttribute("title", "Comments");
        });
      } catch (error) {
        console.log(error);
      }
    }
  }
};
</script>
