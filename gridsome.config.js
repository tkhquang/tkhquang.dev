// This is where project configuration and plugin options are located.
// Learn more: https://gridsome.org/docs/config

// Changes here requires a server restart.
// To restart press CTRL + C in terminal and run `gridsome develop`

const purgecss = require("@fullhuman/postcss-purgecss")({
  content: [
    "./src/**/*.vue",
    "./src/**/*.js",
    "./src/**/*.jsx",
    "./src/**/*.html",
    "./src/**/*.pug",
    "./src/**/*.md"
  ],
  whitelist: [
    "body",
    "html",
    "img",
    "a",
    "g-image",
    "g-image--lazy",
    "g-image--loaded"
  ],
  defaultExtractor: content => {
    return content.match(/[\w-/:]+(?<!:)/g) || [];
  }
});

module.exports = {
  /*
    As using netlify proxing
    Had to move this to a sub folder
  */
  outputDir: "dist/blog",
  pathPrefix: "/blog",
  icon: "src/favicon.png",

  // Add global metadata to the GraphQL schema.
  siteName: "Ljóss - The Portal To A Nobody's Inner World",
  siteDescription: "Ljóss - The portal to a nobody's inner world.",
  titleTemplate: `%s | Ljóss - The Portal To A Nobody's Inner World`,
  siteUrl:
    process.env.NODE_ENV === "production"
      ? `${process.env.GRIDSOME_SITE_URL}/blog`
      : process.env.GRIDSOME_SITE_URL,
  metadata: {
    siteTitle: "Ljóss",
    siteHeading: "The Portal To A Nobody's Inner World",
    siteName: "Ljóss - The Portal To A Nobody's Inner World",
    siteDescription: "Ljóss - The portal to a nobody's inner world.",
    siteOwner: {
      name: "Aleks",
      description: `I don't ride horses, I ride unicorns.`
    },
    siteTwitter: "@holy_quangtk"
  },

  plugins: [
    {
      use: require("./lib/gridsome-cosmicjs-source"),
      options: {
        bucketSlug: process.env.COSMIC_BUCKET,
        objectTypes: [
          // Force chomp using comment
          `posts`,
          `settings`,
          `tags`
        ],
        apiAccess: {
          read_key: process.env.COSMIC_READ_KEY
        }
      }
    },
    {
      use: "@gridsome/plugin-google-analytics",
      options: {
        id: process.env.GA_TRACKING_ID
      }
    }
  ],
  css: {
    loaderOptions: {
      postcss: {
        // options here will be passed to postcss-loader
        plugins: [
          require("postcss-import"),
          require("tailwindcss")("./tailwind.config.js"),
          require("autoprefixer"),
          ...(process.env.NODE_ENV === "production" ? [purgecss] : [])
        ]
      },
      scss: {
        // options here will be passed to sass-loader
      }
    }
  },
  host: "127.0.0.1",
  port: 8080
};
