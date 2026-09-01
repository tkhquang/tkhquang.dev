"use client";

import BackButtonIcon from "@/components/layout/BackButtonIcon";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { useRouterHelper } from "@/hooks/useRouterHelper";
import { useAsPathValue } from "@/store/router";
import classNames from "classnames";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/* Same rest threshold as the landing Header */
const SCROLLED_AT = 16;

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

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => {
      setScrolled(window.scrollY > SCROLLED_AT);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });

    return () => {
      window.removeEventListener("scroll", update);
    };
  }, []);

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
      /* Freeze the sticky chrome so page view transitions never crossfade it */
      style={{ viewTransitionName: "site-header" }}
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
          <div className="header__left flex h-full items-center">
            <button
              type="button"
              className="cursor-pointer focus:outline-hidden"
              onClick={handleLogoClick}
            >
              <div className="logo flip-animate flex-center whitespace-no-wrap no-underine gap-2 font-extrabold select-none focus:outline-hidden">
                {!isHomeBlog && <BackButtonIcon className="size-8" />}
                <span
                  className="logo__text relative inline-flex"
                  data-hover="Home"
                >
                  Ljóss
                </span>
              </div>
            </button>
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
