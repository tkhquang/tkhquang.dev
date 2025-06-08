"use server";

import remarkFigureCaption from "@ljoss/rehype-figure-caption";
import { compareDesc, parseISO } from "date-fns";
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
import slugify from "slugify";
import { unified } from "unified";
import CopyButton from "@/components/common/CopyButton";
import Image, { ImageProps } from "@/components/common/NextImage";
import rehypeCopyCodeButton from "@/lib/rehype-copy-code-button";
import rehypeCustomNextImage from "@/lib/rehype-custom-next-image";
import rehypeUnwrapImage from "@/lib/rehype-unwrap-image";
import remarkEmbded from "@/lib/remark-embed";
import { PostsCollection } from "@/models/generated/markdown.types";
import { MarkdownCategory, MarkdownPost } from "@/models/markdown.types";
import rehypeExtractToc from "@stefanprobst/rehype-extract-toc";

declare global {
  var markdownParser: MarkdownParser | undefined;
  var __MARKDOWN_PARSER_INITIALIZED__: boolean;
}

const postsDirectory = path.join(process.cwd(), "content", "posts");
const categoriesDirectory = path.join(process.cwd(), "content", "categories");

function getPostFiles() {
  return fs.readdirSync(postsDirectory, { encoding: "utf8" });
}

function getCategoryFiles() {
  return fs.readdirSync(categoriesDirectory, { encoding: "utf8" });
}

function getParser() {
  return unified()
    .use(remarkParse, { fragment: true })
    .use(remarkEmbded, {
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
      keepBackground: false,
      theme: {
        dark: "solarized-dark",
        light: "solarized-light",
      },
      transformers: [],
    })
    .use(rehypeExternalLinks, {
      properties: {
        class: "icon icon-link",
      },
      rel: ["nofollow", "noopener", "noreferrer"],
      target: "_blank",
    })
    .use(rehypeCustomNextImage, {
      cache: true,
      publicFolder: "./public",
      targetPath: "./public/uploads/remote",
    })
    .use(rehypeRaw)
    .use(rehypeStringify)
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
        "copy-button": CopyButton,
        "next-image": Image,
      },
      Fragment: prod.Fragment,
      jsx: prod.jsx,
      jsxs: prod.jsxs,
    } as Options);
}

function getImageParser() {
  return unified()
    .use(remarkParse, { fragment: true })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeCustomNextImage, {
      cache: true,
      publicFolder: "./public",
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

class MarkdownParser {
  private parser: ReturnType<typeof getParser>;
  private imageParser: ReturnType<typeof getImageParser>;

  constructor() {
    this.parser = getParser();
    this.imageParser = getImageParser();
    console.info("MarkdownParser instance created");
  }

  async parseMarkdown(content: string) {
    const vfile = await this.parser.process(content);
    return vfile;
  }

  async getPostBySlug(fileName: string): Promise<MarkdownPost> {
    const slug = fileName.replace(/\.md$/, "");
    const fullPath = path.join(
      postsDirectory,
      `${decodeURIComponent(slug)}.md`
    );

    const { content, data } = matter(
      await fs.promises.readFile(fullPath, { encoding: "utf8" })
    ) as unknown as { data: PostsCollection; content: string };

    const coverVfile = data.cover_image
      ? await this.imageParser.process(
          `![Cover Image](${(data as PostsCollection).cover_image})`
        )
      : null;

    const renderCoverImage = (props: Partial<ImageProps>) => {
      if (!coverVfile) {
        return null;
      }

      return unified()
        .use(remarkParse, { fragment: true })
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeRaw)
        .use(rehypeStringify)
        .use(rehypeUnwrapImage, {
          tagNames: ["next-image", "img"],
        })
        .use(rehypeReact, {
          components: {
            "next-image": (baseProps: any) => {
              return (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image
                  {...baseProps}
                  blurDataURL={baseProps.blurdataurl}
                  {...props}
                />
              );
            },
          },
          Fragment: prod.Fragment,
          jsx: prod.jsx,
          jsxs: prod.jsxs,
        } as Options)
        .processSync(coverVfile.value).result;
    };

    return {
      ...data,
      content,
      renderCoverImage,
      slug,
    };
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

    return (
      posts.filter((post) => {
        if (!post) return false;
        return post.published || shouldShowHiddenPosts;
      }) as MarkdownPost[]
    ).sort((post1, post2) => (post1.created_at > post2.created_at ? -1 : 1));
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

        const { content, data } = matter(
          await fs.promises.readFile(fullPath, { encoding: "utf8" })
        ) as unknown as { data: PostsCollection; content: string };

        return data.tags;
      })
    );

    return [...new Set(results.flat())]
      .filter((tag) => tag !== "hidden" || shouldShowHiddenTags)
      .map((tag) => {
        return {
          slug: slugify(tag),
          title: tag,
        };
      });
  }
}
