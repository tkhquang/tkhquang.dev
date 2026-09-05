export interface PostsCollection {
  title: string;
  short_title?: string;
  created_at: Date;
  updated_at?: Date;
  published: boolean;
  category_slug: string;
  tags: string[];
  cover_image?: string;
  series?: string;
  series_part?: number;
  description: string;
  body: string;
}

export interface CategoriesCollection {
  title: string;
  slug: string;
}