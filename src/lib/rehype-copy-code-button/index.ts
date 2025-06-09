import { Element, Root } from "hast";
import { toString as hastToString } from "hast-util-to-string";
import { Transformer } from "unified";
import { visit } from "unist-util-visit";

interface CopyButtonOptions {
  feedbackDuration?: number;
  copyIcon?: string;
  successIcon?: string;
  visibility?: "hover" | "always";
}

/**
 * matches and removes leading and trailing whitespace and newlines
 */
const whitespaceRegEx = /\s*\n\s*/g;

export const trimWhitespace = (input: string) =>
  input.replaceAll(whitespaceRegEx, "").trim();

export default function rehypeCopyCodeButton(
  options: CopyButtonOptions = {}
): Transformer<Root> {
  return function transformer(tree: Root): Root {
    visit(tree, "element", (node, index, parent) => {
      const element = node as Element;

      // Ensure the node is a <figure> tag and has <code>
      if (element.tagName !== "figure") return;
      if (!element.properties.hasOwnProperty("dataRehypePrettyCodeFigure"))
        return;

      const preNodeIndex = element.children.findIndex(
        (childNode) => (childNode as Element).tagName === "pre"
      );

      const preNode = element.children[preNodeIndex] as Element;
      const codeNode = preNode.children.find(
        (childNode) => (childNode as Element).tagName === "code"
      ) as Element;

      element.children.splice(preNodeIndex, 0, {
        children: [
          {
            children: [
              {
                children: [],
                properties: { class: "ready" },
                tagName: "span",
                type: "element",
              },
              {
                children: [],
                properties: { class: "success" },
                tagName: "span",
                type: "element",
              },
            ],
            properties: {
              "aria-label": "Copy code",
              class: "rehype-pretty-copy",
              "data-duration": `${options.feedbackDuration}`,
              "data-name": "rehype-pretty-copy-button",
              "data-value": hastToString(preNode),
              title: "Copy code",
              type: "button",
            },
            tagName: "copy-button",
            type: "element",
          },
        ],
        properties: {
          class: "rehype-pretty-copy-container",
        },
        tagName: "div",
        type: "element",
      });
      tree.children.push({
        children: [
          {
            type: "text",
            value: copyButtonStyle({
              copyIcon: options.copyIcon,
              successIcon: options.successIcon,
              visibility: options.visibility,
            }),
          },
        ],
        properties: {},
        tagName: "style",
        type: "element",
      });
    });
    return tree;
  };
}

function copyButtonStyle({
  copyIcon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cpath fill='%23adadad' d='M16.187 9.5H12.25a1.75 1.75 0 0 0-1.75 1.75v28.5c0 .967.784 1.75 1.75 1.75h23.5a1.75 1.75 0 0 0 1.75-1.75v-28.5a1.75 1.75 0 0 0-1.75-1.75h-3.937a4.25 4.25 0 0 1-4.063 3h-7.5a4.25 4.25 0 0 1-4.063-3M31.813 7h3.937A4.25 4.25 0 0 1 40 11.25v28.5A4.25 4.25 0 0 1 35.75 44h-23.5A4.25 4.25 0 0 1 8 39.75v-28.5A4.25 4.25 0 0 1 12.25 7h3.937a4.25 4.25 0 0 1 4.063-3h7.5a4.25 4.25 0 0 1 4.063 3M18.5 8.25c0 .966.784 1.75 1.75 1.75h7.5a1.75 1.75 0 1 0 0-3.5h-7.5a1.75 1.75 0 0 0-1.75 1.75'/%3E%3C/svg%3E",
  successIcon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%2366ff85' d='M9 16.17L5.53 12.7a.996.996 0 1 0-1.41 1.41l4.18 4.18c.39.39 1.02.39 1.41 0L20.29 7.71a.996.996 0 1 0-1.41-1.41z'/%3E%3C/svg%3E",
  visibility = "hover",
}: {
  copyIcon?: string;
  successIcon?: string;
  visibility?: "hover" | "always";
} = {}) {
  let copyButtonStyle = /* css */ `
    :root {
      --copy-icon: url("${copyIcon}");
      --success-icon: url("${successIcon}");
    }

    [data-rehype-pretty-code-figure] {
      position: relative;
    }

    button[data='<span>'] {
      width: 0;
      height: 0;
      display: none;
      visibility: hidden;
    }

    div.rehype-pretty-copy-container {
      position: sticky;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      justify-content: end;
      height: 0;
      overflow: visible;
    }

    [data-rehype-pretty-code-figure] button.rehype-pretty-copy {
      transform: translateY(50%);
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      margin-top: 2px;
      margin-right: 8px;
      border-radius: 25%;
      & span {
        width: 100%;
        aspect-ratio: 1 / 1;
      }
      & .ready {
        background-image: var(--copy-icon);
      }
      & .success {
        display: none; background-image: var(--success-icon);
      }
    }

    &.rehype-pretty-copied {
      & .success {
        display: block;
      } & .ready {
        display: none;
      }
    }

    [data-rehype-pretty-code-figure] button.rehype-pretty-copy.rehype-pretty-copied {
      opacity: 1;
      & .ready { display: none; }
      & .success { display: block; }
    }
`;
  if (visibility === "hover") {
    copyButtonStyle += /* css */ `
        [data-rehype-pretty-code-figure] button.rehype-pretty-copy { opacity: 0; }
        figure[data-rehype-pretty-code-figure]:hover > div.rehype-pretty-copy-container > button.rehype-pretty-copy {
          opacity: 1;
        }
      `;
  }
  return trimWhitespace(copyButtonStyle);
}
