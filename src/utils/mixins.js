import siteMeta from "~/assets/constants/site-meta";

export default {
  computed: {
    baseUrl() {
      // return `${process.env.URL || process.env.GRIDSOME_URL}`;
      /*
        As using netlify proxing
        Had to include the path prefix
      */

      // Production
      if (process.env.SITE_URL) {
        return `${process.env.SITE_URL}${this.$url("/")}`;
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
      title = siteMeta.title,
      desc = siteMeta.siteName,
      image = `${this.baseUrl}${siteMeta.image}`,
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
          { name: "twitter:site", content: siteMeta.twitter },
          { name: "twitter:creator", content: siteMeta.twitter },
          {
            name: "twitter:image",
            content: image
          }
        ]
      };
    }
  }
};
