import { ImageProps } from "@/components/common/NextImage";
import {
  CategoriesCollection,
  PostsCollection,
} from "@/models/generated/markdown.types";

export interface MarkdownPost extends PostsCollection {
  slug: string;
  content: string;
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
