<template>
  <div class="commentbox" />
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
    this.removeCommentBox();
  },

  methods: {
    initCommentBox() {
      if (isEmpty(this.cssVars)) {
        return;
      }

      try {
        this.removeCommentBox = commentBox(
          `${process.env.GRIDSOME_COMMENTBOX_PROJECT_ID}`,
          {
            backgroundColor: this.cssVars["surface"],
            textColor: this.cssVars["on-background"],
            subtextColor: this.cssVars["on-surface"]
          }
        );
      } catch (error) {
        if (process.isClient) {
          console.log(error);
        }
      }
    }
  }
};
</script>
