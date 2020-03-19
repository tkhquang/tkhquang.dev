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
    // Force chomp
    "html",
    "body"
  ].concat(
    require("purgecss-whitelister")([
      // Force chomp
      "./src/assets/styles/*.scss"
    ])
  ),
  whitelistPatterns: [
    // Force chomp
    /^g-image*/,
    /^gridsome*/,
    /^language-*/,
    /^line-numbers*/
  ],
  whitelistPatternsChildren: [
    // Force chomp
    /^gridsome*/,
    /^command-line-prompt*/
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

  templates: {
    Posts: "/posts/:title"
  },

  transformers: {
    //Add markdown support to all file-system sources
    remark: {
      externalLinksTarget: "_blank",
      externalLinksRel: ["nofollow", "noopener", "noreferrer"],
      anchorClassName: "icon icon-link",
      plugins: [
        [
          "gridsome-plugin-remark-prismjs-all",
          {
            highlightClassName: "gridsome-highlight",
            codeTitleClassName: "gridsome-code-title",
            classPrefix: "language-",
            aliases: {},
            noInlineHighlight: false,
            showLineNumbers: true,
            languageExtensions: [],
            prompt: {
              user: `aleks`,
              host: `dev`,
              global: true
            }
          }
        ],
        [
          "@noxify/gridsome-plugin-remark-image-download",
          {
            targetPath: "./src/assets/uploads/temp"
          }
        ]
      ]
    }
  },

  plugins: [
    {
      // Create posts from markdown files
      use: "@gridsome/source-filesystem",
      options: {
        typeName: "Posts",
        path: "content/posts/*.md",
        route: "/:title",
        coverField: "post_cover",
        refs: {
          // Creates a GraphQL collection from 'tags' in front-matter and adds a reference.
          tags: {
            typeName: "Tags",
            create: true
          }
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
