/* What a slip prints for a link that leaves the site: an annotation read
   from the destination once, at build, and kept in the repository so the
   next build reads the file instead of the network. Markup fields carry
   sanitized HTML and nothing else; every other field is plain text. */

interface AnnotationBase {
  url: string;
}

/* The copy archive.org holds, when one could be had */
export interface WaybackArchive {
  url: string;
  timestamp: string;
}

/* Any page: what its own head says about it, and the page's own words
   kept so the card can stand in for the page rather than point at it */
export interface PageAnnotation extends AnnotationBase {
  kind: "page";
  site: string;
  title: string;
  description?: string;
  image?: string;
  extractHtml?: string;
}

export interface WikipediaAnnotation extends AnnotationBase {
  kind: "wikipedia";
  title: string;
  description?: string;
  /* The lead, as Wikipedia's own previews print it */
  extractHtml: string;
  thumbnail?: { src: string; width: number; height: number };
}

export interface YoutubeAnnotation extends AnnotationBase {
  kind: "youtube";
  id: string;
  title: string;
  author: string;
}

export interface GithubRepoAnnotation extends AnnotationBase {
  kind: "github-repo";
  owner: string;
  repo: string;
  description?: string;
  language?: string;
  stars: number;
  readmeHtml?: string;
}

export interface GithubIssueAnnotation extends AnnotationBase {
  kind: "github-issue";
  owner: string;
  repo: string;
  number: number;
  title: string;
  state: "open" | "closed" | "merged";
  isPull: boolean;
  author: string;
  createdAt: string;
  comments: number;
  bodyHtml?: string;
}

export interface GithubCommentAnnotation extends AnnotationBase {
  kind: "github-comment";
  owner: string;
  repo: string;
  number: number;
  title: string;
  author: string;
  createdAt: string;
  bodyHtml: string;
}

export interface GithubCommitAnnotation extends AnnotationBase {
  kind: "github-commit";
  owner: string;
  repo: string;
  sha: string;
  title: string;
  message: string;
  author: string;
  date: string;
  additions: number;
  deletions: number;
  files: string[];
}

/* A file at a commit: the lines the link points at, printed, or the
   whole rendered document when the file is markdown */
export interface GithubBlobAnnotation extends AnnotationBase {
  kind: "github-blob";
  owner: string;
  repo: string;
  ref: string;
  path: string;
  startLine: number;
  endLine: number;
  totalLines: number;
  codeHtml?: string;
  bodyHtml?: string;
}

export interface GithubTreeAnnotation extends AnnotationBase {
  kind: "github-tree";
  owner: string;
  repo: string;
  ref: string;
  path: string;
  description?: string;
  entries: { name: string; type: "dir" | "file" | "other" }[];
}

export type Annotation =
  | PageAnnotation
  | WikipediaAnnotation
  | YoutubeAnnotation
  | GithubRepoAnnotation
  | GithubIssueAnnotation
  | GithubCommentAnnotation
  | GithubCommitAnnotation
  | GithubBlobAnnotation
  | GithubTreeAnnotation;

/* One file per link in the cache directory: the annotation, or the
   reason the destination gave none, with the time either was learned,
   and the copies kept of the destination with the time they were last
   attempted */
export interface AnnotationRecord {
  url: string;
  fetchedAt: string;
  /* Which reading of a destination this record holds. The cache lives
     outside the repository and outlives any one build, so a record
     read back by a later build may have been written by an older way
     of reading; a record whose number is not the current one is read
     again rather than trusted. */
  readingVersion?: number;
  annotation?: Annotation;
  failure?: string;
  archive?: WaybackArchive;
  copiesTriedAt?: string;
}
