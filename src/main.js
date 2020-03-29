import feather from "vue-icon";

// Import main css
import "~/assets/styles/index.scss";

// Import typefaces
import "typeface-montserrat";
import "typeface-merriweather";

// eslint-disable-next-line no-unused-vars
export default function(Vue, { router, head, isClient }) {
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
