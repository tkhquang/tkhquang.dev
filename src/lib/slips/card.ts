import type {
  Annotation,
  PageSnapshot,
  WaybackArchive,
} from "@/lib/annotations/types";
import type { PostPreview } from "@/lib/post-previews/types";

/* An annotation as a card prints it: its date already set on the
   server, by the same clock that sets every other date on the site, and
   the copies kept of the destination */
export type AnnotationCard = Annotation & {
  when?: string;
  snapshot?: PageSnapshot;
  archive?: WaybackArchive;
};

/* What a cross-reference slip prints, fetched by key when the slip
   opens: another post's entry with the section it links into, or the
   whole of its opening, as finished article markup; or the annotation
   of a destination off the site */
export type SlipCard =
  | {
      kind: "post";
      preview: PostPreview;
      html: string;
      scope: "section" | "opening";
    }
  | { kind: "annotation"; annotation: AnnotationCard };
