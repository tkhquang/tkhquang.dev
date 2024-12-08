import { visit } from "unist-util-visit";
import { Element, Root } from "hast";
import { Transformer } from "unified";

const DEFAULT_IMAGE_TAG_NAMES = ["img"];

interface Options {
  tagNames?: string[];
}

export default function rehypeUnwrapImage(
  options: Options = {}
): Transformer<Root> {
  const { tagNames = DEFAULT_IMAGE_TAG_NAMES } = options;

  return function transformer(tree: Root): Root {
    visit(tree, "element", (node, index, parent) => {
      // Ensure the current node is an Element
      if (!parent || typeof index === "undefined" || node.type !== "element") {
        return;
      }

      const element = node as Element;

      // Ensure the node is a <p> tag and has exactly one child
      if (element.tagName !== "p" || element.children.length !== 1) {
        return;
      }

      const child = element.children[0];

      // Check if the single child is an <img> element or a custom tag name
      if (child.type === "element" && tagNames.includes(child.tagName)) {
        // Replace the <p> node with its child node
        parent.children.splice(index, 1, child);
      }
    });

    return tree;
  };
}
