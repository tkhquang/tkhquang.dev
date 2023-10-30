const visit = require("unist-util-visit");
const path = require("path");

const { getRemoteImage } = require("./helpers");

module.exports = function attacher(options = {}) {
  const transformer = this.data("transformer");

  return async function transform(tree, file) {
    const images = [];

    visit(tree, "image", (node) => images.push(node));

    for (const node of images) {
      let filePath = node.url;

      const data = node.data || {};
      const props = data.hProperties || {};
      const classNames = props.class || [];

      let imageHTML = null;
      let noscriptHTML = null;

      try {
        if (!/[a-zA-Z0-9]*:\/\/[^\s]*/.test(node.url)) {
          filePath = transformer.resolveNodeFilePath(
            file.data.node,
            path.resolve(`${options.publicFolder}${node.url}`)
          );
        } else {
          filePath = await getRemoteImage(node.url, options);
          filePath = transformer.resolveNodeFilePath(file.data.node, filePath);
        }

        const asset = await transformer.assets.add(filePath, {
          alt: props.alt || node.alt,
          width: props.width,
          height: props.height,
          classNames,
          ...options
        });

        imageHTML = asset.imageHTML;
        noscriptHTML = asset.noscriptHTML;
      } catch (err) {
        console.log(err);
        node.url;
      }

      if (imageHTML) {
        node.type = "html";
        node.value = imageHTML + noscriptHTML;
      }
    }
  };
};
