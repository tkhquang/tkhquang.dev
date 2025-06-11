import Image from "@/components/common/NextImage";
import Link from "next/link";

function NotFoundPage() {
  return (
    <div className="typography container mt-header-height flex flex-1 flex-col">
      <div className="my-4 flex flex-1 flex-col md:my-8">
        <h1 className="">Oops! We have looked everywhere...</h1>
        <p className="">
          But we couldn&apos;t find what you are looking for.
          <br />
          Don&apos;t worry, our{" "}
          <Link href="/blog/categories">post archive</Link> is full of hidden
          gems. Maybe your missing post is just playing hide-and-seek!
        </p>
        <div className="relative flex min-h-[200px] flex-1 flex-col items-center justify-center">
          <Image src="/assets/resources/images/404-jim.gif" alt="404" fill />
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
