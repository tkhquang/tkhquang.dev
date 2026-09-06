import type { Root } from "hast";
import type { Transformer } from "unified";
import { visit } from "unist-util-visit";

export default function rehypeHexDiff(): Transformer<Root> {
  return (tree) => {
    visit(tree, "element", (node) => {
      if (node.tagName !== "pre" || node.children.length !== 1) return;
      const code = node.children[0];
      if (
        code.type !== "element" ||
        code.tagName !== "code" ||
        !Array.isArray(code.properties.className) ||
        !code.properties.className.includes("language-hex-diff")
      )
        return;

      // Lift the fence before syntax highlighting. Its body stays plain text
      // until the server adapter validates it, so YAML cannot become HTML.
      node.tagName = "hex-diff";
      node.properties = {
        source: code.children
          .map((child) => (child.type === "text" ? child.value : ""))
          .join(""),
      };
      node.children = [];
    });
  };
}
