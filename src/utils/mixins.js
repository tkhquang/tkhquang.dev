export default {
  computed: {
    baseUrl() {
      // return `${process.env.URL || process.env.GRIDSOME_URL}`;
      /*
        As using netlify proxing
        Had to include the path prefix
      */

      // Production
      if (process.env.URL) {
        return `${process.env.URL}${this.$url("/")}`;
      }
      // Develop
      return `${process.env.GRIDSOME_URL}/`;
    }
  },
  methods: {
    stripSlashes(url) {
      return url.replace(/(https?:\/\/)|(\/)+/g, "$1$2");
    },
    generateMetaInfo(
      // Force chomp using comment
      title = "",
      desc = "",
      image = `${this.baseUrl}images/default.png`,
      path = ""
    ) {
      return {
        title: title,
        meta: [
          {
            key: "description",
            name: "description",
            content: desc
          },
          { property: "og:type", content: "website" },
          { property: "og:title", content: title },
          {
            property: "og:description",
            content: desc
          },
          {
            property: "og:url",
            content: this.stripSlashes(`${this.baseUrl}${path}`)
          },
          {
            property: "og:image",
            content: image
          },
          { name: "twitter:card", content: "summary_large_image" },
          { name: "twitter:title", content: title },
          {
            name: "twitter:description",
            content: desc
          },
          { name: "twitter:site", content: "@holy_quangtk" },
          { name: "twitter:creator", content: "@holy_quangtk" },
          {
            name: "twitter:image",
            content: image
          }
        ]
      };
    }
  }
};
