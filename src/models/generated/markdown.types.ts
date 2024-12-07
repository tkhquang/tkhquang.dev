export interface PostsCollection {
  title: string;
  created_at: Date;
  updated_at?: Date;
  published: boolean;
  category_slug: string;
  tags: string[];
  cover_image?: string;
  description: string;
  body: string;
}

export interface CategoriesCollection {
  title: string;
  slug: string;
}