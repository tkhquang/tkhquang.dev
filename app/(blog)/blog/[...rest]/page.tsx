import { notFound } from "next/navigation";

/* Any /blog path no other route claims lands on the blog's own Plate 404
   (the (blog) not-found boundary) instead of falling through to the
   portfolio catch-all, and it answers with a real 404 status */
export default function BlogCatchAll() {
  notFound();
}
