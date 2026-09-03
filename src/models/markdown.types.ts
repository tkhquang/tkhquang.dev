import { ImageProps } from "@/components/common/NextImage";
import {
  CategoriesCollection,
  PostsCollection,
} from "@/models/generated/markdown.types";

export interface MarkdownPost extends PostsCollection {
  slug: string;
  content: string;
  /* Resolved from the category file so display never re-derives it from
     the slug; absent when the category file is missing */
  category_title?: string;
  /* How many published parts the post's series has; annotated by
     getAllPosts, so posts fetched singly do not carry it */
  series_total?: number;
  coverData: ImageProps;
  coverDataExtra: {
    width: number | undefined;
    height: number | undefined;
  };
}

export interface MarkdownCategory extends CategoriesCollection {
  slug: string;
  content: string;
}
