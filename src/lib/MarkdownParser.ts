import lamplightDark from "@/assets/shiki/lamplight-dark.json";
import lamplightLight from "@/assets/shiki/lamplight-light.json";
import MermaidPlate from "@/components/common/MermaidPlate";
import PreWithCopy from "@/components/common/PreWithCopy";
import ZoomableImage from "@/components/common/ZoomableImage";
import rehypeCopyCodeButton from "@/lib/rehype-copy-code-button";
import rehypeCustomNextImage from "@/lib/rehype-custom-next-image";
import {
  MERMAID_RENDER_OPTIONS,
  rehypeMermaidPrepare,
  rehypeMermaidRender,
  rehypeMermaidRestore,
} from "@/lib/rehype-mermaid-plates";
import remarkEmbed from "@/lib/remark-embed";
import { PostsCollection } from "@/models/generated/markdown.types";
import { MarkdownCategory, MarkdownPost } from "@/models/markdown.types";
import { getProcessedImage } from "@/utils/image";
import { getPostFiles, postsDirectory } from "@/utils/posts";
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
import { unified, Processor } from "unified";
import { VFile } from "vfile";

declare global {
  var markdownParser: MarkdownParser | undefined;
  var __MARKDOWN_PARSER_INITIALIZED__: boolean;
}

const categoriesDirectory = path.join(process.cwd(), "content", "categories");

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
          dark: lamplightDark as unknown as import("shiki").ThemeRegistration,
          light: lamplightLight as unknown as import("shiki").ThemeRegistration,
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
    global.__MARKDOWN_PARSER_INITIALIZED__
  ) {
    return global.markdownParser!;
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

  async getPostBySlug(fileName: string): Promise<MarkdownPost> {
    const slug = fileName.replace(/\.md$/, "");
    const fullPath = path.join(
      postsDirectory,
      `${decodeURIComponent(slug)}.md`
    );
    try {
      const { content, data } = matter(
        await fs.promises.readFile(fullPath, { encoding: "utf8" })
      ) as unknown as { data: PostsCollection; content: string };

      const [coverData, coverDataExtra] = await (async () => {
        if (!data.cover_image) {
          return [
            {
              src: "",
              blurDataURL: undefined,
              alt: "",
            },
            {
              width: undefined,
              height: undefined,
            },
          ];
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

        return [
          {
            src: output,
            blurDataURL: placeholder,
            alt: data.title,
            width,
            height,
          },
          {
            width,
            height,
          },
        ];
      })();

      return {
        ...data,
        category_title: await this.getCategoryTitle(data.category_slug),
        content,
        slug,
        coverData,
        coverDataExtra: coverDataExtra,
      };
    } catch (error) {
      console.warn(`Missing post file: ${fullPath}`);
      throw error;
    }
  }

  async getAllPosts({ shouldShowHiddenPosts = false } = {}): Promise<
    MarkdownPost[]
  > {
    const slugs = getPostFiles();

    const posts = await Promise.all(
      slugs.map(async (slug) => {
        try {
          return await this.getPostBySlug(slug);
        } catch (error) {
          console.warn(`Failed to load post: ${slug}`, error);
          return null;
        }
      })
    );

    const published = (
      posts.filter((post) => {
        if (!post) return false;
        return post.published || shouldShowHiddenPosts;
      }) as MarkdownPost[]
    ).sort((post1, post2) => (post1.created_at > post2.created_at ? -1 : 1));

    /* Serial bookkeeping: every member learns its series' published size,
       so cards can print "Instalment II of III" without refetching */
    const seriesSizes = new Map<string, number>();
    for (const post of published) {
      if (post.series) {
        seriesSizes.set(post.series, (seriesSizes.get(post.series) ?? 0) + 1);
      }
    }
    for (const post of published) {
      if (post.series) {
        post.series_total = seriesSizes.get(post.series);
      }
    }

    return published;
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
