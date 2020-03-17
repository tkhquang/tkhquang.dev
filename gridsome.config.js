// This is where project configuration and plugin options are located.
// Learn more: https://gridsome.org/docs/config

// Changes here requires a server restart.
// To restart press CTRL + C in terminal and run `gridsome develop`

const siteMeta = require("./src/assets/constants/site-meta");

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
  siteName: siteMeta.siteName,
  siteDescription: siteMeta.description,
  /*
    As using netlify proxing
    Had to move this to a sub folder
  */
  outputDir: "dist/blog",
  pathPrefix: "/blog",

  // Add global metadata to the GraphQL schema.
  metadata: {},

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
