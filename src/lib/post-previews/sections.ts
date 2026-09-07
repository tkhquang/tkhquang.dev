import GithubSlugger from "github-slugger";
import type { Heading, Nodes } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

export interface Section {
  id: string;
  title: string;
}

const parser = unified().use(remarkParse).use(remarkGfm);

/* A heading's words, the way rehype-slug reads them off the rendered
   heading: every text and code run, in order */
const textOf = (node: Nodes): string => {
  if ("value" in node && typeof node.value === "string") return node.value;
  if ("children" in node) return node.children.map(textOf).join("");
  return "";
};

/**
 * The headings of a post as the page prints them: ids slugged the way
 * rehype-slug slugs them, one slugger per document in document order,
 * so a repeated heading gets the same numbered suffix here as on the
 * page.
 */
export function listSections(markdown: string): Section[] {
  const slugger = new GithubSlugger();
  const sections: Section[] = [];
  visit(parser.parse(markdown), "heading", (node: Heading) => {
    const title = textOf(node);
    sections.push({ id: slugger.slug(title), title });
  });
  return sections;
}

/**
 * The sections of a post as a reader counts them: the headings at the
 * shallowest depth the post uses, each subsection folded into its
 * section, so a card can say how much of the entry it leaves out. A
 * post without headings has none, and its opening is the whole of it.
 */
export function countSections(markdown: string): number {
  const depths: number[] = [];
  visit(parser.parse(markdown), "heading", (node: Heading) => {
    depths.push(node.depth);
  });
  const top = Math.min(...depths);
  return depths.filter((depth) => depth === top).length;
}

/* The heading a section link points at, or null when the post has no
   such heading, in which case the link is left to navigate on its own */
export function findSection(markdown: string, id: string): Section | null {
  return listSections(markdown).find((section) => section.id === id) ?? null;
}
