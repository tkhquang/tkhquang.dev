"use client";

import BackButtonIcon from "@/components/layout/BackButtonIcon";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { useRouterHelper } from "@/hooks/useRouterHelper";
import { useAsPathValue } from "@/store/router";
import { useThemeValue } from "@/store/theme";
import { ScrollManager } from "@/utils/dom";
import classNames from "classnames";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FiArrowUpRight } from "react-icons/fi";

/* Same rest threshold as the landing Header */
const SCROLLED_AT = 16;

/* Stands in for --header-height until the theme store reports it */
const DEFAULT_HEADER_HEIGHT = 60;

/* The fraction of the sky still under the header when the band takes over */
const HANDOVER_AT = 0.5;

const NAV_LINKS = [
  { href: "/blog", label: "Posts" },
  { href: "/blog/categories", label: "Categories" },
  { href: "/blog/tags", label: "Tags" },
  { href: "/blog/posts", label: "Archive" },
];

const BlogHeader = ({
  className,
  ...props
}: React.ComponentProps<"header">) => {
  const params = useParams();
  const { matchSegments } = useRouterHelper();
  const { prevAsPath } = useAsPathValue();
  const { back, prefetch, push } = useRouter();

  const isHomeBlog = matchSegments(["blog", "page", null]);
  const isInPostPage = matchSegments([
    "blog",
    "posts",
    null, //slug
  ]);

  const shouldRestoreScrollOnBack = prevAsPath === "/blog";

  const { cssVariables } = useThemeValue();
  const headerHeight = useMemo(() => {
    const height = cssVariables?.["header-height"];
    return height ? parseFloat(String(height)) : DEFAULT_HEADER_HEIGHT;
  }, [cssVariables]);

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    /*
     * Over the masthead the switch is geometric rather than a pixel
     * count, because the sky is 317px tall on a phone and 385px from lg
     * up. Pulling the observer's top edge down by the header height puts
     * the measure on the header's own bottom line, and the ratio there
     * is the share of sky still below it: the band comes in at the
     * halfway mark rather than waiting for the last of it.
     */
    const masthead = isHomeBlog
      ? document.querySelector("[data-masthead]")
      : null;

    if (masthead) {
      const observer = new IntersectionObserver(
        (entries) => {
          const skyLeft = entries[0]?.intersectionRatio ?? 1;
          setScrolled(skyLeft < HANDOVER_AT);
        },
        {
          rootMargin: `-${headerHeight}px 0px 0px 0px`,
          threshold: HANDOVER_AT,
        }
      );
      observer.observe(masthead);

      return () => {
        observer.disconnect();
      };
    }

    /* The house scroll pub/sub, same as BackToTop and BackButtonIcon */
    const scrollManager = new ScrollManager();
    scrollManager.subscribe({
      id: "blog-header",
      callback: ({ scrollY }) => {
        setScrolled(scrollY > SCROLLED_AT);
      },
    });

    return () => {
      scrollManager.destroy();
    };
  }, [headerHeight, isHomeBlog]);

  /*
   * Transparent only over the list page masthead, whose band extends under
   * the header; other blog pages have arbitrary covers behind the top edge,
   * so they keep the readable blurred backdrop at rest too.
   */
  const transparent = isHomeBlog && !scrolled;

  const handleLogoClick = () => {
    if (isHomeBlog) {
      window.scrollTo({
        behavior: "smooth",
        top: 0,
      });
      return;
    }

    if (isInPostPage) {
      if (shouldRestoreScrollOnBack && params?.slug) {
        back();
        return;
      }
    }

    push("/blog");
  };

  useEffect(() => {
    prefetch("/blog");
  }, [prefetch]);

  return (
    <header
      {...props}
      className={classNames(
        "band--day h-header-height sticky inset-0 z-(--z-header) m-0 w-full flex-wrap p-0 transition-[background-color,color,box-shadow] duration-300",
        transparent
          ? "text-theme-on-band bg-transparent"
          : "header__background-transparent--blog text-theme-on-background shadow-box-md",
        className
      )}
    >
      <div className="flex-center size-full flex-wrap">
        <div className="container mx-auto flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Over the masthead the big Ljóss already stands right below,
              so the wordmark and byline hold back until the sky scrolls
              away; inert keeps the invisible pair out of the tab order */}
          <div
            className={classNames(
              "header__left flex h-full items-center gap-2 transition-opacity duration-300",
              transparent ? "pointer-events-none opacity-0" : "opacity-100"
            )}
            inert={transparent || undefined}
          >
            <button
              type="button"
              className="cursor-pointer focus:outline-hidden"
              onClick={handleLogoClick}
            >
              <div className="logo flip-animate flex-center whitespace-no-wrap no-underine gap-2 select-none focus:outline-hidden">
                {!isHomeBlog && <BackButtonIcon className="size-8" />}
                <span
                  className="logo__text relative inline-flex"
                  data-hover="Home"
                >
                  Ljóss
                </span>
              </div>
            </button>
            {/* A step smaller and dimmer than the nav so it reads as the
                wordmark's suffix, not another destination */}
            <Link
              href="/"
              className="mt-0.75 inline-flex items-center gap-1 font-mono text-[0.65rem] font-semibold tracking-[0.2em] uppercase opacity-80 transition-opacity hover:opacity-100"
            >
              · By Aleks
              <FiArrowUpRight aria-hidden className="size-3" />
            </Link>
          </div>
          <div className="header__right flex h-full items-center">
            <nav
              className="hidden items-center gap-5 md:flex"
              aria-label="Blog sections"
            >
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-mono text-xs font-bold tracking-widest uppercase opacity-80 transition-opacity hover:opacity-100"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="ml-4 flex flex-col">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default BlogHeader;
