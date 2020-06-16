<template>
  <div class="commentbox" />
</template>

<script>
import { mapGetters } from "vuex";
import commentBox from "commentbox.io";

export default {
  data() {
    return {
      removeCommentBox: null
    };
  },

  computed: {
    ...mapGetters({
      cssVars: "page/cssVars"
    })
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
