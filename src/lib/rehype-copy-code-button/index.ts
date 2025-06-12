import { Element, Root } from "hast";
import { toString as hastToString } from "hast-util-to-string";
import { Transformer } from "unified";
import { visit } from "unist-util-visit";

const DEFAULT_STYLES = /* css */ `
    [data-rehype-pretty-code-figure] pre {
      position: relative;
    }

    [data-rehype-pretty-code-figure][data-visibility="hover"] button[data-rehype-pretty-copy-button] {
      transition: opacity 300ms ease-in-out;
      opacity: 0;
    }

    [data-rehype-pretty-code-figure][data-visibility="hover"]:hover button[data-rehype-pretty-copy-button] {
      opacity: 1;
    }

    button[data-rehype-pretty-copy-button] {
      position: absolute;
      top: 0.5em;
      right: 0.5em;
      width: 24px;
      height: 24px;
    }

    .rehype-pretty-copy-button-icon {
      width: 24px;
      height: 24px;
      background-position: center;
      background-repeat: no-repeat;
      background-size: contain;
    }
`;

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

      const preNode = element.children[preNodeIndex] as Element;

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

      element.properties = {
        ...element.properties,
        "data-visibility": `${visibility}`,
      };

      if (injectStyles !== false) {
        tree.children.push({
          children: [
            {
              type: "text",
              value: trimWhitespace(injectStyles || DEFAULT_STYLES),
            },
          ],
          properties: {},
          tagName: "style",
          type: "element",
        });
      }
    });
    return tree;
  };
}
