import SocialLinks from "@/components/common/SocialLinks";
import SpotifyNowPlaying from "@/components/spotify/NowPlaying";
import clsx from "clsx";
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
        "footer sticky bottom-0 mt-auto w-full py-3 text-center shadow-box-md md:py-4",
        "header--blog__background-transparent text-theme-on-surface",
        className
      )}
    >
      <div className="container grid grid-cols-[minmax(0,1fr)_auto] items-center justify-between gap-2">
        <Suspense>
          <SpotifyNowPlaying
            className={clsx([
              "text-sm",
              "[--song-color:theme(colors.theme.on-surface)]",
              "[--artist-color:theme(colors.theme.on-surface)]",
            ])}
            songEffect="underline"
            showCover
          />
        </Suspense>
        <SocialLinks
          className="flex-center flex-gap-4 shrink-0 text-2xl"
          entities={["Github"]}
        />
      </div>
    </footer>
  );
};

export default BlogFooter;
