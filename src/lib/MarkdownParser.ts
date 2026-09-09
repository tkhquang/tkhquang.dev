import lamplightDark from "@/assets/shiki/lamplight-dark.json";
import lamplightLight from "@/assets/shiki/lamplight-light.json";
import CameraExplorable from "@/components/blog/camera-explorable/CameraExplorable";
import HexDiff from "@/components/blog/hex-diff/HexDiff";
import NoteMark from "@/components/blog/notes/NoteMark";
import MermaidPlate from "@/components/common/MermaidPlate";
import PreWithCopy from "@/components/common/PreWithCopy";
import ZoomableImage from "@/components/common/ZoomableImage";
import rehypeCopyCodeButton from "@/lib/rehype-copy-code-button";
import rehypeCustomNextImage from "@/lib/rehype-custom-next-image";
import rehypeHexDiff from "@/lib/rehype-hex-diff";
import {
  MERMAID_RENDER_OPTIONS,
  rehypeMermaidPrepare,
  rehypeMermaidRender,
  rehypeMermaidRestore,
} from "@/lib/rehype-mermaid-plates";
import rehypeNotes from "@/lib/rehype-notes";
import remarkEmbed from "@/lib/remark-embed";
import { PostsCollection } from "@/models/generated/markdown.types";
import { MarkdownCategory, MarkdownPost } from "@/models/markdown.types";
import { getProcessedImage } from "@/utils/image";
import {
  categoriesDirectory,
  getPostFiles,
  postsDirectory,
  readPostRecords,
  readPostSource,
  selectPublishedPosts,
} from "@/utils/posts";
import { slugifyTag } from "@/utils/slug";
import remarkFigureCaption from "@ljoss/rehype-figure-caption";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import rehypeExtractToc from "@stefanprobst/rehype-extract-toc";
import fs from "fs";
import matter from "gray-matter";
import path from "path";
import * as prod from "react/jsx-runtime";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeRaw from "rehype-raw";
import rehypeReact, { Options } from "rehype-react";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import "server-only";
import type { ThemeRegistrationRaw } from "shiki";
import { unified, Processor } from "unified";
import { VFile } from "vfile";

declare global {
  var markdownParser: MarkdownParser | undefined;
  var __MARKDOWN_PARSER_INITIALIZED__: boolean;
}

function getCategoryFiles() {
  return fs
    .readdirSync(categoriesDirectory, { encoding: "utf8" })
    .filter((files) => files.endsWith(".md"));
}

function getProcessor(): Processor {
  return (
    unified()
      .use(remarkParse, { fragment: true })
      .use(remarkEmbed, {
        enabledProviders: ["Youtube", "Spotify"],
      })
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeHexDiff)
      .use(remarkFigureCaption, { allowEmptyCaption: true })
      .use(remarkGfm)
      .use(rehypePrettyCode, {
        defaultLang: {
          block: "plaintext",
          inline: "plaintext",
        },
        keepBackground: true,
        /* The Lamplight printing: the house ink pair, every foreground
         checked past 4.5:1 against the panel it sits on */
        theme: {
          dark: lamplightDark as unknown as ThemeRegistrationRaw,
          light: lamplightLight as unknown as ThemeRegistrationRaw,
        },
        /* Fence comments like [!code highlight] and [!code ++] become
         proof marks at build time */
        transformers: [
          transformerNotationDiff(),
          transformerNotationHighlight(),
          transformerNotationWordHighlight(),
        ],
      })
      .use(rehypeExternalLinks, {
        properties: {
          class: "icon icon-link",
        },
        rel: ["nofollow", "noopener"],
        target: "_blank",
      })
      .use(rehypeCustomNextImage, {
        cache: true,
        publicFolder: "./public",
        targetPath: "./public/uploads/remote",
      })
      .use(rehypeRaw)
      /* Chart Plates: diagrams typeset at press time. The raw pre.mermaid
       blocks only exist as elements after rehypeRaw; prepare re-inks the
       Dracula classDefs into theme tokens, the in-repo renderer draws
       them through headless chromium, restore wraps the svgs back into
       their original pre so every shipped selector still applies. */
      .use(rehypeMermaidPrepare)
      .use(rehypeMermaidRender, MERMAID_RENDER_OPTIONS)
      .use(rehypeMermaidRestore)
      /* After the code printing, so a copied note keeps its chips, and
         after rehypeRaw, so raw HTML in a note is an element by the time
         it is copied. Before the heading steps, so the plate's head stays
         out of the table of contents. */
      .use(rehypeNotes)
      .use(rehypeSlug)
      .use(rehypeExtractToc)
      .use(rehypeAutolinkHeadings, {
        content: {
          type: "text",
          value: "#",
        },
      })
      .use(rehypeCopyCodeButton, {
        feedbackDuration: 3_000,
        visibility: "hover",
      })
      .use(rehypeReact, {
        components: {
          "camera-explorable": CameraExplorable,
          "hex-diff": HexDiff,
          "note-mark": NoteMark,
          "rehype-pretty-copy-button-pre": PreWithCopy,
          "next-image": ZoomableImage,
          "mermaid-plate": MermaidPlate,
        },
        Fragment: prod.Fragment,
        jsx: prod.jsx,
        jsxs: prod.jsxs,
      } as Options)
  );
}

function getImageProcessor(): Processor {
  return unified()
    .use(remarkParse, { fragment: true })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeCustomNextImage, {
      cache: true,
      targetPath: "./public/uploads/remote",
    })
    .use(rehypeStringify);
}

export async function getMarkdownParser(): Promise<MarkdownParser> {
  if (
    process.env.NODE_ENV === "development" &&
    global.__MARKDOWN_PARSER_INITIALIZED__ &&
    // A reloaded module must rebuild its component registry, not reuse the old one.
    global.markdownParser instanceof MarkdownParser
  ) {
    return global.markdownParser;
  }

  global.markdownParser = new MarkdownParser();
  if (process.env.NODE_ENV === "development") {
    global.__MARKDOWN_PARSER_INITIALIZED__ = true;
  }

  return global.markdownParser;
}

const FALLBACK_DIMENSITION = {
  WIDTH: 1280,
  HEIGHT: 720,
};

interface ProcessedVfile extends VFile {
  result: React.ReactNode;
}

class MarkdownParser {
  private parser: ReturnType<typeof getProcessor>;
  private imageParser: ReturnType<typeof getImageProcessor>;
  private categoryTitles = new Map<string, string | undefined>();

  constructor() {
    this.parser = getProcessor();
    this.imageParser = getImageProcessor();
    // console.info("MarkdownParser instance created");
  }

  private async getCategoryTitle(slug: string): Promise<string | undefined> {
    if (this.categoryTitles.has(slug)) {
      return this.categoryTitles.get(slug);
    }
    let title: string | undefined;
    try {
      title = (await this.getCategoryBySlug(slug)).title;
    } catch {
      /* A post can name a shelf before its file exists; consumers fall
         back to the title-cased slug */
    }
    this.categoryTitles.set(slug, title);
    return title;
  }

  async parseMarkdown(content: string): Promise<ProcessedVfile> {
    const vfile = await this.parser.process(content);
    return vfile as ProcessedVfile;
  }

  /** Processes the cover once, for the record shapes that carry one. */
  private async getCover(data: PostsCollection): Promise<{
    coverData: MarkdownPost["coverData"];
    coverDataExtra: MarkdownPost["coverDataExtra"];
  }> {
    if (!data.cover_image) {
      return {
        coverData: {
          src: "",
          blurDataURL: undefined,
          alt: "",
        },
        coverDataExtra: {
          width: undefined,
          height: undefined,
        },
      };
    }

    const {
      placeholder,
      output,
      width = FALLBACK_DIMENSITION.WIDTH,
      height = FALLBACK_DIMENSITION.HEIGHT,
    } = await getProcessedImage({
      cache: true,
      targetPath: "./public/uploads/remote",
      source: data.cover_image,
      shouldStore: true,
    });

    return {
      coverData: {
        src: output,
        blurDataURL: placeholder,
        alt: data.title,
        width,
        height,
      },
      coverDataExtra: {
        width,
        height,
      },
    };
  }

  async getPostBySlug(fileName: string): Promise<MarkdownPost> {
    const { content, data, slug } = await readPostSource(fileName);

    return {
      ...data,
      category_title: await this.getCategoryTitle(data.category_slug),
      content,
      slug,
      ...(await this.getCover(data)),
    };
  }

  /* The roster rules live in `@/utils/posts` because the search index is
     written outside Next, by a script that cannot load this module: it reaches
     for the component registry below. Reading the files there and processing
     covers here is what keeps one set of rules serving both. */
  async getAllPosts({ shouldShowHiddenPosts = false } = {}): Promise<
    MarkdownPost[]
  > {
    const records = await readPostRecords();

    const posts = await Promise.all(
      records.map(async (record) => {
        try {
          return { ...record, ...(await this.getCover(record)) };
        } catch (error) {
          console.warn(`Failed to load post: ${record.slug}`, error);
          return null;
        }
      })
    );

    return selectPublishedPosts(
      posts.filter((post) => post !== null),
      { shouldShowHiddenPosts }
    );
  }

  async getCategoryBySlug(fileName: string): Promise<MarkdownCategory> {
    const slug = fileName.replace(/\.md$/, "");
    const fullPath = path.join(
      categoriesDirectory,
      `${decodeURIComponent(slug)}.md`
    );

    const { content, data } = matter(
      await fs.promises.readFile(fullPath, { encoding: "utf8" })
    );

    return {
      ...data,
      content,
      slug,
    } as MarkdownCategory;
  }

  async getAllCategories() {
    const categories = await Promise.all(
      getCategoryFiles().map((fileName) => this.getCategoryBySlug(fileName))
    );
    return categories;
  }

  async getAllTags({ shouldShowHiddenTags = false } = {}): Promise<
    { title: string; slug: string }[]
  > {
    const results = await Promise.all(
      getPostFiles().map(async (fileName) => {
        const slug = fileName.replace(/\.md$/, "");
        const fullPath = path.join(
          postsDirectory,
          `${decodeURIComponent(slug)}.md`
        );

        const { content: _content, data } = matter(
          await fs.promises.readFile(fullPath, { encoding: "utf8" })
        ) as unknown as { data: PostsCollection; content: string };

        return data.tags;
      })
    );

    return [...new Set(results.flat())]
      .filter((tag) => tag !== "hidden" || shouldShowHiddenTags)
      .map((tag) => {
        return {
          slug: slugifyTag(tag),
          title: tag,
        };
      });
  }
}
