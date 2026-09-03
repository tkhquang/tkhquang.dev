import HorizontalLine from "@/components/common/HorizontalLine";
import SocialLinks from "@/components/common/SocialLinks";
import SpotifyNowPlaying from "@/components/spotify/NowPlaying";
import { Blog } from "@/constants/meta";
import { getMarkdownParser } from "@/lib/MarkdownParser";
import { toRoman } from "@/utils/roman";
import { getVolume } from "@/utils/volume";
import clsx from "clsx";
import Link from "next/link";
import React, { Fragment, Suspense } from "react";

/* Printed end matter above the bar: colophon, volume statement, the four
   doors (the phones' only shell navigation), and the subscribe wires. The
   sticky bar below keeps the REAL Spotify widget and the GitHub icon
   exactly as shipped. */
const BlogFooter = async ({
  children,
  className,
  ...props
}: React.ComponentProps<"footer">) => {
  const markdownParser = await getMarkdownParser();
  const posts = await markdownParser.getAllPosts();
  const volume = getVolume(posts);
  const currentYear = new Date().getFullYear();
  const sinceYear = posts.reduce(
    (year, post) => Math.min(year, post.created_at.getFullYear()),
    currentYear
  );

  return (
    <>
      {/* End matter flows above the bar; the footer element below stays
          byte-identical to the shipped one, so its sticky behavior is
          untouched */}
      <div className="blog-colophon mt-auto">
        <div className="blog-colophon__inner">
          <HorizontalLine />
          <p className="kicker blog-colophon__head">Colophon</p>
          <p className="blog-colophon__specimen">
            Set in <span className="blog-colophon__face-display">Fraunces</span>
            , <span className="blog-colophon__face-serif">Merriweather</span>,{" "}
            <span className="blog-colophon__face-sans">Montserrat</span> and{" "}
            <span className="blog-colophon__face-mono">
              Source&nbsp;Code&nbsp;Pro
            </span>
            .
          </p>
          <p className="kicker blog-colophon__volume">
            Ljóss · Vol. {toRoman(volume)} · {toRoman(sinceYear)} to{" "}
            {toRoman(currentYear)}
          </p>
          <HorizontalLine className="blog-colophon__short" />
          <nav
            className="blog-colophon__doors"
            aria-label="Blog sections, footer"
          >
            {Blog.NAV_LINKS.map((link, index) => (
              <Fragment key={link.href}>
                {index > 0 && (
                  <span className="blog-colophon__sep" aria-hidden>
                    ·
                  </span>
                )}
                <Link href={link.href} className="kicker tint-link">
                  {link.label}
                </Link>
              </Fragment>
            ))}
          </nav>
          <HorizontalLine className="blog-colophon__short" />
          <div className="blog-colophon__wire">
            <span className="kicker opacity-60">Subscribe by wire</span>
            <a className="tint-link blog-colophon__wire-link" href="/blog/feed.xml">
              Atom · feed.xml
            </a>
            <a
              className="tint-link blog-colophon__wire-link"
              href="https://buttondown.com/ljoss"
              target="_blank"
              rel="noopener noreferrer"
            >
              Letter · buttondown.com/ljoss
            </a>
          </div>
        </div>
      </div>

      <footer
        {...props}
        className={clsx(
          "footer shadow-box-md mt-auto w-full py-4 text-center",
          "header__background-transparent--blog text-theme-on-surface",
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
          <SocialLinks
            className="flex-center shrink-0 gap-1 text-2xl"
            entities={["Github"]}
          />
        </div>
      </footer>
    </>
  );
};

export default BlogFooter;
