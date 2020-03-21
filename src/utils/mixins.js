export default {
  methods: {
    stripSlashes(url) {
      return url.replace(/(https?:\/\/)|(\/)+/g, "$1$2");
    },
    generateMetaInfo(opts) {
      const {
        siteTitle,
        // siteName,
        siteDescription,
        siteTwitter,
        // siteOwner,
        // prefixPath,
        metaImageUrl = this.stripSlashes(
          `${process.env.GRIDSOME_SITE_URL}/images/default.jpg`
        ),
        path = ""
      } = opts;

      let metaInfo = {
        meta: []
      };

      if (siteTitle) {
        metaInfo = {
          ...metaInfo,
          title: siteTitle,
          meta: [
            ...metaInfo.meta,
            {
              key: "og:title",
              property: "og:title",
              content: siteTitle
            },
            {
              key: "twitter:title",
              name: "twitter:title",
              content: siteTitle
            }
          ]
        };
      }

      if (siteDescription) {
        metaInfo.meta = [
          ...metaInfo.meta,
          {
            key: "description",
            name: "description",
            content: siteDescription
          },
          {
            key: "og:description",
            property: "og:description",
            content: siteDescription
          },
          {
            key: "twitter:description",
            name: "twitter:description",
            content: siteDescription
          }
        ];
      }

      if (metaImageUrl) {
        metaInfo.meta = [
          ...metaInfo.meta,
          {
            key: "og:image",
            property: "og:image",
            content: metaImageUrl
          },
          {
            key: "twitter:image",
            name: "twitter:image",
            content: metaImageUrl
          }
        ];
      }

      if (siteTwitter) {
        metaInfo.meta = [
          ...metaInfo.meta,
          {
            key: "twitter:site",
            name: "twitter:site",
            content: siteTwitter
          },
          {
            key: "twitter:creator",
            name: "twitter:creator",
            content: siteTwitter
          }
        ];
      }

      metaInfo.meta = [
        ...metaInfo.meta,
        {
          key: "og:url",
          property: "og:url",
          content: this.stripSlashes(`${process.env.GRIDSOME_SITE_URL}${path}`)
        }
      ];

      return metaInfo;
    }
  }
};
