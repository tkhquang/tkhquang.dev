import * as prod from "react/jsx-runtime";
import fs from "fs";
import matter from "gray-matter";
import path from "path";
import { unified } from "unified";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeExternalLinks from "rehype-external-links";
import rehypeExtractToc, { TocEntry } from "@stefanprobst/rehype-extract-toc";
import remarkFigureCaption from "@ljoss/rehype-figure-caption";
import rehypeReact, { Options } from "rehype-react";
import rehypeRaw from "rehype-raw";
import Image, { ImageProps } from "next/image";
import rehypeCustomNextImage from "@/lib/rehype-custom-next-image";
import remarkEmbded from "@/lib/remark-embed";
import { PostsCollection } from "@/models/generated/markdown.types";
import { MarkdownCategory, MarkdownPost } from "@/models/markdown.types";
import rehypeUnwrapImage from "@/lib/rehype-unwrap-image";

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
      theme: {
        dark: "solarized-dark",
        light: "solarized-light",
      },
      keepBackground: false,
      defaultLang: {
        block: "plaintext",
        inline: "plaintext",
      },
    })
    .use(rehypeExternalLinks, {
      rel: ["nofollow", "noopener", "noreferrer"],
      target: "_blank",
      properties: {
        class: "icon icon-link",
      },
    })
    .use(rehypeCustomNextImage, {
      targetPath: "./public/uploads/remote",
      publicFolder: "./public",
      cache: true,
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
    .use(rehypeReact, {
      Fragment: prod.Fragment,
      jsx: prod.jsx,
      jsxs: prod.jsxs,
      components: {
        "next-image": Image,
      },
    } as Options);
}

function getImageParser() {
  return unified()
    .use(remarkParse, { fragment: true })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeCustomNextImage, {
      targetPath: "./public/uploads/remote",
      publicFolder: "./public",
      cache: true,
    })
    .use(rehypeStringify);
}

export default class MarkdownParser {
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

    const { data, content } = matter(
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
          Fragment: prod.Fragment,
          jsx: prod.jsx,
          jsxs: prod.jsxs,
          components: {
            "next-image": (baseProps: any) => (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image
                {...baseProps}
                blurDataURL={baseProps.blurdataurl}
                {...props}
              />
            ),
          },
        } as Options)
        .processSync(coverVfile.value).result;
    };

    return {
      ...data,
      slug,
      content,
      renderCoverImage,
    };
  }

  async getAllPosts({ shouldShowHiddenPosts = false } = {}) {
    const posts = await Promise.all(
      getPostFiles().map((slug) => this.getPostBySlug(slug))
    );
    return posts
      .sort((post1, post2) => (post1.created_at > post2.created_at ? -1 : 1))
      .filter((post) => post.published || shouldShowHiddenPosts);
  }

  async getCategoryBySlug(fileName: string): Promise<MarkdownCategory> {
    const slug = fileName.replace(/\.md$/, "");
    const fullPath = path.join(
      categoriesDirectory,
      `${decodeURIComponent(slug)}.md`
    );

    const { data, content } = matter(
      await fs.promises.readFile(fullPath, { encoding: "utf8" })
    );

    return {
      ...data,
      slug,
      content,
    } as MarkdownCategory;
  }

  async getAllCategories() {
    const categories = await Promise.all(
      getCategoryFiles().map((fileName) => this.getCategoryBySlug(fileName))
    );
    return categories;
  }
}
