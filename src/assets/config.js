// const baseUrl = `${process.env.URL || process.env.GRIDSOME_URL}`;
/*
  As using netlify proxing
  Had to include the path prefix
*/
const baseUrl = `${process.env.URL}/blog` || `${process.env.GRIDSOME_URL}`;

const config = {
  generateMetaInfo(
    // Force chomp using comment
    title = "Ljóss",
    desc = "Ljóss - The portal to a nobody's inner world",
    image = `${baseUrl}/images/default.png`,
    url = `${baseUrl}`
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
        { property: "og:url", content: url },
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
};

export default config;
