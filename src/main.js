// import InfiniteLoading from "vue-infinite-loading";
import feather from "vue-icon";

// Import main css
import "~/assets/styles/index.scss";
// import "prismjs/themes/prism-tomorrow.css";
import "prismjs/plugins/command-line/prism-command-line.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.css";

// The Client API can be used here. Learn more: gridsome.org/docs/client-api
// eslint-disable-next-line no-unused-vars
export default function(Vue, { router, head, isClient }) {
  // Vue.use(InfiniteLoading);

  Vue.use(feather, {
    name: "v-icon",
    props: {
      baseClass: {
        type: String,
        default: "v-icon"
      },
      classPrefix: {
        type: String,
        default: "v-icon-"
      }
    }
  });
}
