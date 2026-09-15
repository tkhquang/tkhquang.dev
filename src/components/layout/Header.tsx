"use client";

import "./Header.css";
import GlobalSearch from "@/components/layout/GlobalSearch";
import PersonalMark from "@/components/layout/PersonalMark";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { Site } from "@/constants/meta";
import { prefersReducedMotion, ScrollManager } from "@/utils/dom";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/*
 * Transparent only at rest: the hero's top padding guarantees nothing sits
 * under the header at scroll 0, but any scroll slides hero content (the
 * portrait, the greeting) beneath it, so the blurred backdrop comes in
 * immediately.
 *
 * Deliberately no section nav: the landing page is meant to be scrolled
 * and read in order, not skipped through.
 */
const SCROLLED_AT = 16;

interface HeaderProps extends React.ComponentProps<"header"> {
  useScroll?: boolean;
}

const Header = ({ className, useScroll = true, ...props }: HeaderProps) => {
  const pathname = usePathname();
  const [scrolledPastTop, setScrolledPastTop] = useState(false);

  /*
   * Without scroll tracking the header is solid from the very first paint,
   * so the flag is derived here rather than stored: no effect has to flip it.
   */
  const scrolled = !useScroll || scrolledPastTop;

  useEffect(() => {
    if (!useScroll) {
      return;
    }

    /* The house scroll pub/sub, same as BlogHeader and BackToTop */
    const scrollManager = new ScrollManager();
    scrollManager.subscribe({
      id: "landing-header",
      callback: ({ scrollY }) => {
        setScrolledPastTop(scrollY > SCROLLED_AT);
      },
    });

    return () => {
      scrollManager.destroy();
    };
  }, [useScroll]);

  return (
    <header
      className={clsx(
        "site-header site-header--fixed h-header-height fixed inset-x-0 top-0 z-(--z-header) m-0 flex w-full items-center transition-[background-color,color,box-shadow] duration-300",
        scrolled
          ? "site-header--settled text-theme-on-background"
          : "text-theme-on-band bg-transparent",
        className
      )}
      {...props}
    >
      <div className="site-header__inner container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="site-header__identity">
          <Link
            href="/"
            className="site-header__brand site-header__brand--mark"
            aria-label={`${Site.AUTHOR.alias} — home`}
            title="Home"
            onNavigate={(event) => {
              if (pathname === "/") {
                event.preventDefault();
                window.scrollTo({
                  behavior: prefersReducedMotion() ? "auto" : "smooth",
                  top: 0,
                });
              }
            }}
          >
            <PersonalMark />
          </Link>
        </div>

        <div className="site-header__actions">
          <nav aria-label="Main navigation">
            <Link href="/blog" className="site-header__nav-link">
              <span>Blog</span>
            </Link>
          </nav>

          <div className="site-header__tools">
            <GlobalSearch />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
