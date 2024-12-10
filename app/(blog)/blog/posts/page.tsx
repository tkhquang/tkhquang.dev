import { Metadata } from "next/types";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Posts",
};

export default async function PostsPage() {
  return <div>WIP</div>;
}
