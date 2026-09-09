import SocialLinks from "@/components/common/SocialLinks";
import SpotifyNowPlaying from "@/components/spotify/NowPlaying";
import { GrowingUnderline } from "@/components/ui/growing-underline";
import clsx from "clsx";
import Link from "next/link";
import React, { Suspense } from "react";

const BlogFooter = ({
  children,
  className,
  ...props
}: React.ComponentProps<"footer">) => {
  return (
    <footer
      {...props}
      className={clsx(
        "footer shadow-box-md mt-auto w-full py-4 text-center",
        "header__background-transparent--blog text-theme-on-surface backdrop-blur-xs",
        "sticky bottom-0 z-(--z-fg)",
        className
      )}
    >
      <div className="container grid grid-cols-[minmax(0,1fr)_auto] items-center justify-between gap-2">
        <Suspense>
          <SpotifyNowPlaying
            className={clsx([
              "text-sm",
              "[--song-color:var(--color-theme-on-surface)]",
              "[--artist-color:var(--color-theme-on-surface)]",
            ])}
            songEffect="underline"
            showCover
          />
        </Suspense>
        <div className="flex shrink-0 items-center gap-3">
          <Link href="/blog/colophon" className="kicker group/colophon">
            <GrowingUnderline className="group-hover/colophon:bg-size-[100%_50%] group-focus-visible/colophon:bg-size-[100%_50%]">
              Colophon
            </GrowingUnderline>
          </Link>
          <SocialLinks
            className="flex-center shrink-0 gap-1 text-2xl"
            entities={["Github"]}
          />
        </div>
      </div>
    </footer>
  );
};

export default BlogFooter;
