import type { PostsCollection } from "@/models/generated/markdown.types";
import fs from "fs";
import matter from "gray-matter";
import path from "path";
import "server-only";

export const postsDirectory = path.join(process.cwd(), "content", "posts");
export const categoriesDirectory = path.join(
  process.cwd(),
  "content",
  "categories"
);

export function getPostFiles() {
  return fs
    .readdirSync(postsDirectory, { encoding: "utf8" })
    .filter((files) => files.endsWith(".md"));
}

/**
 * A post as its file holds it: frontmatter, body, and the shelf title its
 * category slug resolves to.
 *
 * This is everything a reader can search for and nothing that needs the image
 * pipeline, which is what lets the search index be written by a plain Node
 * script before the Next build starts. `MarkdownPost` is this record plus the
 * processed cover, so the roster rules below are the only ones either side
 * applies and neither can drift from the other.
 */
export interface PostRecord extends PostsCollection {
  slug: string;
  content: string;
  category_title?: string;
  series_total?: number;
}

/** The shelf title of every category file, by slug. */
async function readCategoryTitles(): Promise<Map<string, string | undefined>> {
  const files = fs
    .readdirSync(categoriesDirectory, { encoding: "utf8" })
    .filter((name) => name.endsWith(".md"));

  const titles = await Promise.all(
    files.map(async (fileName) => {
      const { data } = matter(
        await fs.promises.readFile(path.join(categoriesDirectory, fileName), {
          encoding: "utf8",
        })
      );

      return [fileName.replace(/\.md$/, ""), data.title as string] as const;
    })
  );

  return new Map(titles);
}

/** Reads one post file. The slug is its name, as every route derives it. */
export async function readPostSource(fileName: string): Promise<{
  data: PostsCollection;
  content: string;
  slug: string;
}> {
  const slug = fileName.replace(/\.md$/, "");
  const fullPath = path.join(postsDirectory, `${decodeURIComponent(slug)}.md`);

  try {
    const { content, data } = matter(
      await fs.promises.readFile(fullPath, { encoding: "utf8" })
    ) as unknown as { data: PostsCollection; content: string };

    return { content, data, slug };
  } catch (error) {
    console.warn(`Missing post file: ${fullPath}`);
    throw error;
  }
}

/**
 * Every post file on disk, in directory order and unfiltered. A file that
 * cannot be read is reported and left out, so one broken entry cannot take
 * the archive down with it.
 */
export async function readPostRecords(): Promise<PostRecord[]> {
  const titles = await readCategoryTitles();

  const records = await Promise.all(
    getPostFiles().map(async (fileName) => {
      try {
        const { content, data, slug } = await readPostSource(fileName);

        /* A post can name a shelf before its file exists; consumers fall
           back to the title-cased slug */
        return {
          ...data,
          category_title: titles.get(data.category_slug),
          content,
          slug,
        };
      } catch (error) {
        console.warn(`Failed to load post: ${fileName}`, error);
        return null;
      }
    })
  );

  return records.filter((record) => record !== null);
}

/**
 * The published roster in display order: newest first, with every member of a
 * series told how many published parts it has, so cards can print
 * "Instalment II of III" without refetching.
 */
export function selectPublishedPosts<Post extends PostRecord>(
  records: Post[],
  { shouldShowHiddenPosts = false } = {}
): Post[] {
  const published = records
    .filter((post) => post.published || shouldShowHiddenPosts)
    .sort((post1, post2) => (post1.created_at > post2.created_at ? -1 : 1));

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
