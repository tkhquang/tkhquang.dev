import type { MarkdownPost } from "@/models/markdown.types";
import type { Root } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { stringify as stringifyYaml } from "yaml";

/** The fields an export carries; nothing else about a post reaches the file. */
export type ExportablePost = Pick<
  MarkdownPost,
  | "category_slug"
  | "category_title"
  | "content"
  | "cover_image"
  | "created_at"
  | "description"
  | "series"
  | "series_part"
  | "series_total"
  | "slug"
  | "tags"
  | "title"
  | "updated_at"
>;

/** The identity the file is attributed to; the site keeps one in `Site.AUTHOR`. */
export interface ExportAuthor {
  alias: string;
  handle: string;
  name: string;
}

/* One rewrite, as an offset range so edits collect in document order and
   apply afterwards */
interface Edit {
  start: number;
  end: number;
  value: string;
}

/* Diagrams are authored as a raw pre.mermaid and drawn at build time. In text
   the diagram is its source again, so it goes back into a fence. */
const MERMAID_BLOCK = /^<pre class="mermaid[^"]*">([\s\S]*)<\/pre>$/;
/* The strip rehype-mermaid-plates applies before drawing: no icon font is
   loaded, so these tokens are in no diagram the reader has seen */
const MERMAID_ICON = /fa:fa-[a-z0-9-]+ ?/g;
/* Both spellings, neither loosely: a self-closing tag would otherwise reach a
   reader as raw markup, and an opening tag alone is a plate whose body a
   blank line split off, which this must not consume. */
const CAMERA_BLOCK =
  /^<camera-explorable[^>]*?(?:\/>|>[\s\S]*<\/camera-explorable>)$/;
/* Presentation only: a style element carries no reading matter */
const STYLE_BLOCK = /^<style[^>]*>[\s\S]*<\/style>$/;
/* Root-relative targets in raw HTML; the lookahead leaves a protocol-relative
   URL alone */
const ROOT_RELATIVE_ATTRIBUTE = /(href|src)="\/(?!\/)/g;

const sourceParser = unified().use(remarkParse).use(remarkGfm);

function isoDate(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}

function isRootRelative(url: string) {
  return url.startsWith("/") && !url.startsWith("//");
}

/* mdast resolves the author's escapes, so a caption carrying a bracket has to
   be escaped again or the image it names stops being an image */
function escapeLabel(text: string) {
  return text.replace(/([\\[\]])/g, "\\$1");
}

/* A target with whitespace only survives inside angle brackets, and a title
   only with its quotes escaped. Both arrive from mdast unwrapped. */
function destination(url: string, title?: string | null) {
  const target = /\s/.test(url) ? `<${url.replace(/([<>\\])/g, "\\$1")}>` : url;
  return title ? `${target} "${title.replace(/(["\\])/g, "\\$1")}"` : target;
}

/* Long enough to survive its own contents: a diagram quoting three backticks
   would close the block early and spill the article into it */
function fenceFor(content: string) {
  const runs = [...content.matchAll(/`+/g)].map((match) => match[0].length);
  return "`".repeat(Math.max(3, ...runs.map((run) => run + 1)));
}

/* The plate is the explanation on the page, so the file says what stands
   there and where it runs rather than narrating it */
function cameraNote(canonicalUrl: string) {
  return `> An interactive figure stands here: a camera on a spring arm, a subject, and one wall in the way. It needs a browser to run, so drive it on the page: <${canonicalUrl}>`;
}

function hexDiffNote(canonicalUrl: string) {
  return `> An annotated byte diff stands here. The block below is its source: the two byte sequences, the fields named, and what each one means. The page lays those fields over the bytes: <${canonicalUrl}>`;
}

/**
 * Collect the rewrites the source needs to stand on its own as a file: the
 * constructs whose meaning lives in the rendered page, and the links that
 * would point nowhere off the site. Walking the tree rather than the raw text
 * keeps a code block that quotes any of them from being rewritten too.
 */
function collectEdits(
  tree: Root,
  source: string,
  { baseUrl, canonicalUrl }: { baseUrl: string; canonicalUrl: string }
) {
  const edits: Edit[] = [];
  const absolute = (url: string) => `${baseUrl}${url}`;

  visit(tree, (node) => {
    const start = node.position?.start.offset;
    const end = node.position?.end.offset;
    if (start === undefined || end === undefined) return;
    /* mdast strips a container's prefix from every line of a nested block's
       value, so an edit built from that value drops the "> " or the indent
       from every line after the first, closing the container early. Rewrites
       that span lines are therefore taken at the margin only. */
    const atMargin = node.position?.start.column === 1;

    if (node.type === "html") {
      const mermaid = atMargin ? MERMAID_BLOCK.exec(node.value) : null;
      if (mermaid) {
        /* Load-bearing: half the diagrams open with mermaid's own
           --- config --- block, which only counts at the first character */
        const diagram = mermaid[1].replace(MERMAID_ICON, "").trim();
        const fence = fenceFor(diagram);
        edits.push({
          start,
          end,
          value: `${fence}mermaid\n${diagram}\n${fence}`,
        });
        return;
      }

      if (CAMERA_BLOCK.test(node.value)) {
        edits.push({ start, end, value: cameraNote(canonicalUrl) });
        return;
      }

      /* At the margin for a reason of its own: the drop takes the separator
         behind the block, which inside a container is what closes it */
      if (atMargin && STYLE_BLOCK.test(node.value)) {
        /* The separator goes with the block, since the paragraph before
           already carries one. Either terminator: a Windows checkout hands
           over CRLF sources. */
        let dropEnd = end;
        while (source[dropEnd] === "\n" || source[dropEnd] === "\r") {
          dropEnd += 1;
        }
        edits.push({ start, end: dropEnd, value: "" });
        return;
      }

      /* The raw slice rather than node.value, which is what lets this one run
         on a nested block: the source still carries the prefixes, and the
         attribute pattern cannot match one */
      const original = source.slice(start, end);
      const rehomed = original.replace(
        ROOT_RELATIVE_ATTRIBUTE,
        `$1="${baseUrl}/`
      );
      if (rehomed !== original) {
        edits.push({ start, end, value: rehomed });
      }
      return;
    }

    /* The fence already carries the diff's own caption and notes, so it is
       kept whole and only introduced */
    if (node.type === "code" && node.lang === "hex-diff" && atMargin) {
      edits.push({
        start,
        end,
        value: `${hexDiffNote(canonicalUrl)}\n\n${source.slice(start, end)}`,
      });
      return;
    }

    if (node.type === "image" && isRootRelative(node.url)) {
      edits.push({
        start,
        end,
        value: `![${escapeLabel(node.alt ?? "")}](${destination(absolute(node.url), node.title)})`,
      });
      return;
    }

    if (node.type === "link" && isRootRelative(node.url)) {
      /* Only the destination, never the whole link: an image inside the label
         carries an edit of its own, and replacing the link wholesale would
         splice at offsets that edit had already moved */
      const labelEnd = node.children.length
        ? node.children.at(-1)?.position?.end.offset
        : start + 1;
      if (labelEnd === undefined) return;

      edits.push({
        start: labelEnd,
        end,
        value: `](${destination(absolute(node.url), node.title)})`,
      });
      return;
    }

    if (node.type === "definition" && isRootRelative(node.url)) {
      edits.push({
        start,
        end,
        value: `[${node.label ?? node.identifier}]: ${destination(absolute(node.url), node.title)}`,
      });
    }
  });

  return edits;
}

/* Applied back to front, so an earlier rewrite cannot shift the offsets a
   later one was measured against */
function applyEdits(source: string, edits: Edit[]) {
  return [...edits]
    .sort((left, right) => right.start - left.start)
    .reduce(
      (text, edit) =>
        text.slice(0, edit.start) + edit.value + text.slice(edit.end),
      source
    );
}

/* An absent update date is dropped rather than printed empty: on most posts
   updated_at is "", and a reader should not have to tell the two apart. */
function frontmatter(
  post: ExportablePost,
  author: ExportAuthor,
  { baseUrl, canonicalUrl }: { baseUrl: string; canonicalUrl: string }
) {
  return stringifyYaml({
    title: post.title,
    description: post.description,
    author: `${author.alias} (${author.name}, online as ${author.handle})`,
    published: isoDate(post.created_at),
    ...(post.updated_at ? { updated: isoDate(post.updated_at) } : {}),
    category: post.category_title ?? post.category_slug,
    ...(post.tags?.length ? { tags: post.tags } : {}),
    ...(post.series ? { series: post.series } : {}),
    ...(post.series_part ? { series_part: post.series_part } : {}),
    ...(post.series_total ? { series_total: post.series_total } : {}),
    /* Frontmatter only, never the body: the page hangs the cover above the
       title, so a consumer should know it exists without finding a figure
       the author never wrote into the text */
    ...(post.cover_image
      ? {
          cover: isRootRelative(post.cover_image)
            ? `${baseUrl}${post.cover_image}`
            : post.cover_image,
        }
      : {}),
    canonical: canonicalUrl,
  }).trim();
}

/**
 * The article as a Markdown file, from the same source as the page. Links
 * leave absolute, since a copy of this text has no site to resolve against.
 */
export function renderPostMarkdown(
  post: ExportablePost,
  { author, baseUrl }: { author: ExportAuthor; baseUrl: string }
) {
  const canonicalUrl = `${baseUrl}/blog/posts/${post.slug}`;
  const tree = sourceParser.parse(post.content);
  const body = applyEdits(
    post.content,
    collectEdits(tree, post.content, { baseUrl, canonicalUrl })
  ).trim();

  return `---
${frontmatter(post, author, { baseUrl, canonicalUrl })}
---

# ${post.title}

I generate this file from the same source as the page at <${canonicalUrl}>, so it carries the prose, the code, the tables, and the diagrams as Mermaid source. What has to run in a browser is named where it stands, with the page's address beside it. Cite the canonical URL with the title and the dates above; the rest of the citation guidance is in <${baseUrl}/llms.txt>.

---

${body}
`;
}
