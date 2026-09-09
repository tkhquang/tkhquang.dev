import type { MarkdownPost } from "@/models/markdown.types";
import { format } from "date-fns";
import type { Root } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

/* Parse the source so that Markdown syntax does not enter the index. */
const sourceParser = unified().use(remarkParse).use(remarkGfm);

/* Code contains searchable identifiers, including fenced examples. */
const TEXT_NODES = new Set(["text", "inlineCode", "code"]);

/* Line boundaries prevent phrase matches across separate blocks or cells. */
const BLOCK_NODES = new Set([
  "blockquote",
  "break",
  "code",
  "heading",
  "list",
  "listItem",
  "paragraph",
  "table",
  "tableCell",
  "tableRow",
  "thematicBreak",
]);

/* Raw tags that stand inside a sentence, so the text either side of one belongs
   to the same line. Everything else parts the line, a custom element and a
   diagram block included, because the reader sees a break there whether or not
   Markdown filed the tag inside a paragraph. `br` is absent on purpose: it is a
   line break. Reading the tag rather than the parent node is what makes the rule
   independent of the blank lines an author happened to leave around it. */
const INLINE_TAGS = new Set([
  "a",
  "abbr",
  "b",
  "bdi",
  "bdo",
  "cite",
  "code",
  "data",
  "del",
  "dfn",
  "em",
  "i",
  "ins",
  "kbd",
  "mark",
  "q",
  "s",
  "samp",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "time",
  "u",
  "var",
  "wbr",
]);

/** Reads the tag name from a raw node, opening or closing. */
function tagName(value: string): string {
  return /^<\/?\s*([a-z][a-z0-9-]*)/i.exec(value)?.[1].toLowerCase() ?? "";
}

/* Bare addresses include media embeds. Exclude them from snippets but keep
   descriptive link text. */
function isBareAddress(node: { url?: string; children?: unknown[] }): boolean {
  const children = (node.children ?? []) as { type: string; value?: string }[];

  return (
    children.length === 1 &&
    children[0].type === "text" &&
    children[0].value === node.url
  );
}

function readingText(markdown: string): string {
  const lines: string[] = [];
  let line = "";

  const breakLine = () => {
    const finished = line.trim();
    if (finished) {
      lines.push(finished);
    }
    line = "";
  };

  visit(sourceParser.parse(markdown) as Root, (node) => {
    if (node.type === "html") {
      /* The children are skipped either way: a raw block carries diagram syntax
         or a custom element, and neither contributes text a reader searches for. */
      if (!INLINE_TAGS.has(tagName(node.value))) {
        breakLine();
      }
      return "skip";
    }

    if (node.type === "link" && isBareAddress(node)) {
      return "skip";
    }

    if (BLOCK_NODES.has(node.type)) {
      breakLine();
    }

    if (TEXT_NODES.has(node.type) && "value" in node) {
      /* Soft wraps render as spaces. Code retains its visible line breaks. */
      line +=
        node.type === "text"
          ? node.value.replace(/\r?\n|\r/g, " ")
          : node.value;
    }

    return undefined;
  });

  breakLine();

  return lines.join("\n");
}

export interface LedgerEntry {
  slug: string;
  title: string;
  /** ISO instant for the result's time element. */
  date: string;
  /** Preformatted date so that results need no browser date library. */
  dateLabel: string;
  /** Searchable text, with line boundaries between blocks and fields. */
  body: string;
}

/** The caller supplies the published roster in display order. */
export function toLedgerEntries(posts: MarkdownPost[]): LedgerEntry[] {
  return posts.map((post) => ({
    /* The middle dot separates metadata when snippets fold lines into spaces.
       Subjects follow the body so that they do not interrupt its prose. */
    body: [
      [post.title, post.description].filter(Boolean).join(" ·\n"),
      readingText(post.content),
      [post.tags.join(", "), post.category_title].filter(Boolean).join(" ·\n"),
    ]
      .filter(Boolean)
      .join("\n"),
    date: post.created_at.toISOString(),
    dateLabel: format(post.created_at, "dd/MM/yyyy"),
    slug: post.slug,
    title: post.title,
  }));
}
