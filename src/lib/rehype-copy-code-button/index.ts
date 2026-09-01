import { Element, Root } from "hast";
import { toString as hastToString } from "hast-util-to-string";
import { Transformer } from "unified";
import { visit } from "unist-util-visit";

interface Options {
  feedbackDuration?: number;
  visibility?: "hover" | "always";
  injectStyles?: string | false;
  passDataCode?: boolean;
}

const WHITESPACE_PATTERN = /\s*\n\s*/g;

export function trimWhitespace(input: string) {
  return input.replaceAll(WHITESPACE_PATTERN, "").trim();
}

export default function rehypeCopyCodeButton(
  options: Options
): Transformer<Root> {
  return function transformer(tree: Root): Root {
    const {
      feedbackDuration = 3_000,
      injectStyles,
      visibility = "always",
      passDataCode = false,
    } = options || {};

    let matchedFigure = false;

    visit(tree, "element", (node, _index, _parent) => {
      const element = node as Element;

      if (element.tagName !== "figure") return;
      if (
        !element.properties.hasOwnProperty("dataRehypePrettyCodeFigure") &&
        !element.properties.hasOwnProperty("data-rehype-pretty-code-figure")
      )
        return;

      const preNodeIndex = element.children.findIndex(
        (childNode) => (childNode as Element).tagName === "pre"
      );

      if (preNodeIndex === -1) return;

      const preNode = element.children[preNodeIndex] as Element;

      matchedFigure = true;

      preNode.properties = {
        ...preNode.properties,
        "data-duration": `${feedbackDuration}`,
        "data-visibility": `${visibility}`,
        ...(passDataCode
          ? {
              "data-code": hastToString(preNode),
            }
          : {}),
      };
      preNode.tagName = "rehype-pretty-copy-button-pre";

      // Hoist the language onto the figure so CSS can badge the frame.
      // "plaintext" is the defaultLang filler, not worth a badge.
      const language =
        preNode.properties["data-language"] ?? preNode.properties.dataLanguage;

      element.properties = {
        ...element.properties,
        "data-visibility": `${visibility}`,
        ...(language && language !== "plaintext"
          ? { "data-language": `${language}` }
          : {}),
      };
    });

    // One shared style element per tree, never one per figure. The site
    // itself passes no injectStyles and owns the CSS in its stylesheets.
    if (matchedFigure && injectStyles) {
      tree.children.push({
        children: [
          {
            type: "text",
            value: trimWhitespace(injectStyles),
          },
        ],
        properties: {},
        tagName: "style",
        type: "element",
      });
    }

    return tree;
  };
}
