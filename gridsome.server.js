// Server API makes it possible to hook into various parts of Gridsome
// on server-side and add custom data to the GraphQL data layer.
// Learn more: https://gridsome.org/docs/server-api

// Changes here requires a server restart.
// To restart press CTRL + C in terminal and run `gridsome develop`

const MarkdownIt = require("markdown-it");
const prism = require("markdown-it-prism");

module.exports = function(api) {
  api.loadSource(store => {
    // Use the Data store API here: https://gridsome.org/docs/data-store-api
    store.addMetadata("key", "value");

    /*
      For render markdown on server
      instead of the browser
    */
    store.addSchemaResolvers({
      CosmicjsPosts: {
        metadata: {
          resolve: node => {
            const md = new MarkdownIt();
            // Remember old renderer, if overridden, or proxy to default renderer
            var defaultRender =
              md.renderer.rules.link_open ||
              function(tokens, idx, options, env, self) {
                return self.renderToken(tokens, idx, options);
              };

            md.renderer.rules.link_open = function(
              tokens,
              idx,
              options,
              env,
              self
            ) {
              // If you are sure other plugins can't add `target` - drop check below
              var aIndex = tokens[idx].attrIndex("target");

              if (aIndex < 0) {
                tokens[idx].attrPush(["target", "_blank"]); // add new attribute
              } else {
                tokens[idx].attrs[aIndex][1] = "_blank"; // replace value of existing attr
              }

              // pass token to default renderer.
              return defaultRender(tokens, idx, options, env, self);
            };
            var defaultImageRenderer = md.renderer.rules.image;
            md.renderer.rules.image = function(
              tokens,
              idx,
              options,
              env,
              self
            ) {
              var token = tokens[idx];
              token.attrSet("class", "mage-lazy");
              return defaultImageRenderer(tokens, idx, options, env, self);
            };

            md.use(prism);

            return {
              ...node.metadata,
              ...(node.metadata.markdown_content && {
                markdown_content: md.render(node.metadata.markdown_content)
              })
            };
          }
        }
      }
    });
  });
};
