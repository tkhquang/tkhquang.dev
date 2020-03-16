// This is where project configuration and plugin options are located.
// Learn more: https://gridsome.org/docs/config

// Changes here requires a server restart.
// To restart press CTRL + C in terminal and run `gridsome develop`

const siteMeta = require("./src/assets/constants/site-meta");

const TailwindExtractor = content => {
  return content.match(/[\w-/:]+(?<!:)/g) || [];
};

module.exports = {
  siteName: siteMeta.siteName,
  siteDescription: siteMeta.description,
  /*
    As using netlify proxing
    Had to move this to a sub folder
  */
  outputDir: "dist/blog",
  pathPrefix: "/blog",
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
    },
    {
      use: "gridsome-plugin-tailwindcss"
    },
    {
      use: "gridsome-plugin-purgecss",
      options: {
        content: [
          "./src/**/*.vue",
          "./src/**/*.js",
          "./src/**/*.jsx",
          "./src/**/*.md"
        ],
        extractor: TailwindExtractor,
        extensions: ["vue", "js", "jsx", "md"]
      }
    }
  ],
  chainWebpack: config => {
    config.module
      .rule("postcss-loader")
      .test(/.css$/)
      .use(["tailwindcss", "autoprefixer"])
      .loader("postcss-loader");
  }
};
