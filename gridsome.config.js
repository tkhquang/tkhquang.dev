// This is where project configuration and plugin options are located.
// Learn more: https://gridsome.org/docs/config

// Changes here requires a server restart.
// To restart press CTRL + C in terminal and run `gridsome develop`
const fs = require("fs");

module.exports = {
  /*
    As using netlify proxing
    Had to move this to a sub folder
  */
  outputDir: "dist",
  pathPrefix: "",
  icon: "src/favicon.png",
  // Add global metadata to the GraphQL schema.
  ...JSON.parse(
    fs.readFileSync("./src/assets/resources/json/site-meta.json", "utf-8")
  ),
  siteUrl:
    process.env.NODE_ENV === "production"
      ? `${process.env.GRIDSOME_SITE_URL}/blog`
      : process.env.GRIDSOME_SITE_URL,
  metadata: JSON.parse(
    fs.readFileSync("./src/assets/resources/json/meta.json", "utf-8")
  ),
  templates: {
    Post: [
      {
        path: "/blog/posts/:title",
        component: "./src/templates/DetailedPost.vue"
      }
    ],
    Category: [
      {
        path: "/blog/categories/:slug",
        component: "./src/templates/DetailedCategory.vue"
      }
    ],
    Tag: [
      {
        path: "/blog/tags/:title",
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
      autolinkHeadings: {
        content: {
          type: "text",
          value: "#"
        }
      },
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
            enabledProviders: ["Youtube", "Gist", "CodeSandbox"]
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
            targetPath: "./static/uploads/remote",
            publicFolder: "./static/uploads/images",
            cache: true
          }
        ]
      ]
    }
  },

  plugins: [
    {
      use: "gridsome-plugin-gtm",
      options: {
        id: process.env.GA_TRACKING_ID,
        enabled: true,
        debug: false
      }
    },
    {
      use: "@gridsome/plugin-sitemap",
      options: {
        cacheTime: 600000,
        config: {
          "/blog/posts/*": {
            changefreq: "weekly",
            priority: 0.5
          }
        }
      }
    },
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
      use: "@gridsome/source-graphql",
      options: {
        url: "https://api.github.com/graphql",
        fieldName: "github",
        typeName: "Github",

        headers: {
          Authorization: `bearer ${process.env.GITHUB_TOKEN}`
        }
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
