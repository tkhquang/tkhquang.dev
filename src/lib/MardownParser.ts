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
import Image from "next/image";
import rehypeCustomNextImage from "@/lib/rehype-custom-next-image";
import remarkEmbded from "@/lib/remark-embed";
import {
  CategoriesCollection,
  PostsCollection,
} from "@/models/generated/markdown.types";

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

export default class MarkdownParser {
  private parser: ReturnType<typeof getParser>;

  constructor() {
    this.parser = getParser();
    console.info("MarkdownParser instance created");
  }

  async parseMarkdown(content: string) {
    const vfile = await this.parser.process(content);
    return vfile;
  }

  async getPostBySlug(fileName: string) {
    const slug = fileName.replace(/\.md$/, "");
    const fullPath = path.join(
      postsDirectory,
      `${decodeURIComponent(slug)}.md`
    );

    const { data, content } = matter(
      await fs.promises.readFile(fullPath, { encoding: "utf8" })
    );

    // const vfile = await this.parser.process(content);

    return {
      ...(data as PostsCollection),
      // html: vfile.result,
      // headings: vfile.data.toc as TocEntry[],
      slug,
      content,
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

  async getCategoryBySlug(fileName: string) {
    const slug = fileName.replace(/\.md$/, "");
    const fullPath = path.join(
      categoriesDirectory,
      `${decodeURIComponent(slug)}.md`
    );

    const { data, content } = matter(
      await fs.promises.readFile(fullPath, { encoding: "utf8" })
    );

    // const _vfile = await this.parser.process(content);

    return {
      ...(data as CategoriesCollection),
      slug,
    };
  }

  async getAllCategories() {
    const categories = await Promise.all(
      getCategoryFiles().map((fileName) => this.getCategoryBySlug(fileName))
    );
    return categories;
  }
}
