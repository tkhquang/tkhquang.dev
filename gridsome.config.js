// This is where project configuration and plugin options are located.
// Learn more: https://gridsome.org/docs/config

// Changes here requires a server restart.
// To restart press CTRL + C in terminal and run `gridsome develop`

module.exports = {
  /*
    As using netlify proxing
    Had to move this to a sub folder
  */
  outputDir: "dist/blog",
  pathPrefix: "/blog",
  icon: "src/favicon.png",

  // Add global metadata to the GraphQL schema.
  ...require("./static/resources/json/site-meta.json"),
  siteUrl:
    process.env.NODE_ENV === "production"
      ? `${process.env.GRIDSOME_SITE_URL}/blog`
      : process.env.GRIDSOME_SITE_URL,
  metadata: require("./static/resources/json/meta.json"),

  templates: {
    Post: [
      {
        path: "/posts/:title",
        component: "./src/templates/DetailedPost.vue"
      }
    ],
    Category: [
      {
        path: "/categories/:slug",
        component: "./src/templates/DetailedCategory.vue"
      }
    ],
    Tag: [
      {
        path: "/tags/:title",
        component: "./src/templates/DetailedTag.vue"
      }
    ]
  },

  transformers: {
    //Add markdown support to all file-system sources
    remark: {
      externalLinksTarget: "_blank",
      externalLinksRel: ["nofollow", "noopener", "noreferrer"],
      anchorClassName: "icon icon-link",
      processImages: true,
      imageBlurRatio: 10,
      imageQuality: 75,
      lazyLoadImages: true,
      imageSource: "./src/assets/uploads/images",
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
          "@noxify/gridsome-plugin-remark-embed",
          {
            enabledProviders: ["Youtube", "Gist"]
          }
        ],
        [
          "gridsome-remark-figure-caption",
          {
            figureClassName: "md-figure-block",
            imageClassName: "md-figure-image",
            captionClassName: "md-figure-caption"
          }
        ],
        [
          require("./lib/gridsome-custom-plugin"),
          {
            targetPath: "./src/assets/uploads/remote",
            publicFolder: "./src/assets/uploads/images",
            cache: true
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
        typeName: "Post",
        path: "content/posts/*.md",
        coverField: "post_cover",
        refs: {
          tags: {
            typeName: "Tag",
            create: true
          }
        }
      }
    },
    {
      // Create tags from markdown files
      use: "@gridsome/source-filesystem",
      options: {
        typeName: "Category",
        path: "content/categories/*.md"
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
          require("autoprefixer")
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
