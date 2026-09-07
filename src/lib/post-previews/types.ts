export interface CrossReferenceTarget {
  slug: string;
  sectionId?: string;
}

/* What a cross-reference card prints above the transcluded markup,
   resolved at build from the target post's front matter. The date
   travels as the printed label, set at build like every other date on
   the site, so a reader west of UTC never sees the day before the one
   the post's own page prints. */
export interface PostPreview {
  slug: string;
  href: string;
  title: string;
  categorySlug: string;
  categoryTitle: string;
  date: string;
  series?: string;
  seriesPart?: number;
  seriesTotal?: number;
  minutes: number;
  lede: string;
  /* The heading a section link points at */
  section?: { id: string; title: string };
}
