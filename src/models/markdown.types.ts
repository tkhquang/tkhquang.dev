import { ImageProps } from "@/components/common/NextImage";
import {
  CategoriesCollection,
  PostsCollection,
} from "@/models/generated/markdown.types";
import { JSX } from "react";

export interface MarkdownPost extends PostsCollection {
  slug: string;
  content: string;
  coverData: ImageProps;
}

export interface MarkdownCategory extends CategoriesCollection {
  slug: string;
  content: string;
}
