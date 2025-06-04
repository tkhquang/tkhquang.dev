import type { ShikiTransformer } from "shiki";
import type { Element, ElementContent } from "hast";

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

/**
 * A transformer that adds a copy button to code blocks.
 * @param {Object} options - Options for the copy button behavior and appearance.
 * @param {number} options.feedbackDuration - The duration in milliseconds to show the success icon after copying.
 * @param {string} options.copyIcon - Either data URL svg or inline svg for the copy icon.
 * @param {string} options.successIcon - Either data URL svg or inline svg for the success icon.
 * @returns A Shiki transformer.
 *
 * find icons at https://icones.js.org - copy the "Data URL" and paste it as the value of `copyIcon` and/or `successIcon`.
 *
 * @example
 * ```ts
 * import { codeToHtml } from 'shiki'
 * import { transformerCopyButton } from '@rehype-pretty/copy-button'
 *
 * const html = await codeToHtml(`console.log('hello, world')`, {
 *   lang: 'ts',
 *   theme: 'houston',
 *   transformers: [
 *     transformerCopyButton({
 *       visibility: 'always',
 *       feedbackDuration: 2_000,
 *     }),
 *   ],
 * })
 * ```
 */
export function transformerCopyButton(
  options: CopyButtonOptions = {
    feedbackDuration: 3_000,
    visibility: "hover",
  }
): ShikiTransformer {
  return {
    name: "@rehype-pretty/transformers/copy-button",
    postprocess(html, _options) {
      return html;
    },
    pre(preNode) {
      const node = preNode.children.find(
        (childNode) => (childNode as Element).tagName === "code"
      ) as Element | undefined;

      if (node) {
        node.children.push({
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
            "data-value": this.source,
            title: "Copy code",
            type: "button",
          },
          tagName: "copy-button",
          type: "element",
        });
        node.children.push({
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
      }
    },
    preprocess(code, _options) {
      return code;
    },
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

    pre button.rehype-pretty-copy {
      right: 1px;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      margin-top: 2px;
      margin-right: 8px;
      position: absolute;
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

    pre button.rehype-pretty-copy.rehype-pretty-copied {
      opacity: 1;
      & .ready { display: none; }
      & .success { display: block; }
    }
`;
  if (visibility === "hover") {
    copyButtonStyle += /* css */ `
        pre button.rehype-pretty-copy { opacity: 0; }
        figure[data-rehype-pretty-code-figure]:hover > pre > code button.rehype-pretty-copy {
          opacity: 1;
        }
      `;
  }
  return trimWhitespace(copyButtonStyle);
}
