"use client";

import ThemeToggle from "@/components/theme/ThemeToggle";
import { GrowingUnderline } from "@/components/ui/growing-underline";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollManager } from "@/utils/dom";
import classNames from "classnames";
import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const ID = "Header";
const SCROLLED_THRESHOLD = 480;

const NAV_ITEMS = [
  { emoji: "🙋🏻‍♂️", href: "/#about", label: "About" },
  { emoji: "🧰", href: "/#stacks", label: "Stacks" },
  { emoji: "💻", href: "/#projects", label: "Projects" },
  { emoji: "✍️", href: "/#writing", label: "Writing" },
  { emoji: "📨", href: "/#contact", label: "Contact" },
];

const Header = ({
  className,
  useScroll = true,
  ...props
}: React.ComponentProps<"header"> & { useScroll?: boolean }) => {
  const [scrolled, setScrolled] = useState(!useScroll);

  useEffect(() => {
    if (!useScroll) {
      setScrolled(true);
      return;
    }

    setScrolled(window.scrollY > SCROLLED_THRESHOLD);
    const scrollManager = new ScrollManager();
    scrollManager.subscribe({
      id: ID,
      callback({ scrollY }) {
        setScrolled(scrollY > SCROLLED_THRESHOLD);
      },
    });

    return () => {
      scrollManager.destroy();
    };
  }, [useScroll]);

  return (
    <header
      className={classNames(
        "h-header-height z-(--z-header) fixed inset-x-0 top-0 m-0 flex w-full items-center transition-[background-color,color,box-shadow] duration-300",
        scrolled
          ? "text-theme-on-background bg-theme-background/80 shadow-[inset_0_-1px_0_var(--hairline-soft)] backdrop-blur-md"
          : "text-theme-on-band bg-transparent",
        className
      )}
      {...props}
    >
      <div className="container mx-auto flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex h-full items-center space-x-4">
          <div title="Back to Top">
            <svg
              height={24}
              viewBox=".5 -.2 1023 1024.1"
              width={24}
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              className="cursor-pointer"
              onClick={() => {
                window.scrollTo({
                  behavior: "smooth",
                  top: 0,
                });
              }}
            >
              <path d="m478.5.6c-2.2.2-9.2.9-15.5 1.4-145.3 13.1-281.4 91.5-367.6 212-48 67-78.7 143-90.3 223.5-4.1 28.1-4.6 36.4-4.6 74.5s.5 46.4 4.6 74.5c27.8 192.1 164.5 353.5 349.9 413.3 33.2 10.7 68.2 18 108 22.4 15.5 1.7 82.5 1.7 98 0 68.7-7.6 126.9-24.6 184.3-53.9 8.8-4.5 10.5-5.7 9.3-6.7-.8-.6-38.3-50.9-83.3-111.7l-81.8-110.5-102.5-151.7c-56.4-83.4-102.8-151.6-103.2-151.6-.4-.1-.8 67.3-1 149.6-.3 144.1-.4 149.9-2.2 153.3-2.6 4.9-4.6 6.9-8.8 9.1-3.2 1.6-6 1.9-21.1 1.9h-17.3l-4.6-2.9c-3-1.9-5.2-4.4-6.7-7.3l-2.1-4.5.2-200.5.3-200.6 3.1-3.9c1.6-2.1 5-4.8 7.4-6.1 4.1-2 5.7-2.2 23-2.2 20.4 0 23.8.8 29.1 6.6 1.5 1.6 57 85.2 123.4 185.9s157.2 238.2 201.8 305.7l81 122.7 4.1-2.7c36.3-23.6 74.7-57.2 105.1-92.2 64.7-74.3 106.4-164.9 120.4-261.5 4.1-28.1 4.6-36.4 4.6-74.5s-.5-46.4-4.6-74.5c-27.8-192.1-164.5-353.5-349.9-413.3-32.7-10.6-67.5-17.9-106.5-22.3-9.6-1-75.7-2.1-84-1.3zm209.4 309.4c4.8 2.4 8.7 7 10.1 11.8.8 2.6 1 58.2.8 183.5l-.3 179.8-31.7-48.6-31.8-48.6v-130.7c0-84.5.4-132 1-134.3 1.6-5.6 5.1-10 9.9-12.6 4.1-2.1 5.6-2.3 21.3-2.3 14.8 0 17.4.2 20.7 2z" />
              <path d="m784.3 945.1c-3.5 2.2-4.6 3.7-1.5 2 2.2-1.3 5.8-4 5.2-4.1-.3 0-2 1-3.7 2.1zm-6.9 4.5c-1.8 1.4-1.8 1.5.4.4 1.2-.6 2.2-1.3 2.2-1.5 0-.8-.5-.6-2.6 1.1zm-5 3c-1.8 1.4-1.8 1.5.4.4 1.2-.6 2.2-1.3 2.2-1.5 0-.8-.5-.6-2.6 1.1zm-5 3c-1.8 1.4-1.8 1.5.4.4 1.2-.6 2.2-1.3 2.2-1.5 0-.8-.5-.6-2.6 1.1zm-7.6 4c-3.8 2-3.6 2.8.2.9 1.7-.9 3-1.8 3-2 0-.7-.1-.6-3.2 1.1z" />
            </svg>
          </div>
        </div>

        <div className="flex h-full items-center gap-5">
          <nav
            aria-label="Sections"
            className="hidden h-full items-center gap-5 md:flex"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-xs font-semibold tracking-wider uppercase"
              >
                <GrowingUnderline>{item.label}</GrowingUnderline>
              </Link>
            ))}
            <Link
              href="/blog"
              className="text-xs font-extrabold tracking-wider uppercase"
            >
              <GrowingUnderline>Blog</GrowingUnderline>
            </Link>
          </nav>

          <ThemeToggle />

          <Sheet>
            <SheetTrigger
              aria-label="Open navigation"
              className="flex-center md:hidden"
            >
              <MenuIcon className="size-6" />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="bg-theme-background text-theme-on-background border-theme-hairline-soft"
            >
              <SheetTitle className="kicker px-6 pt-8">
                tkhquang.dev
              </SheetTitle>
              <nav aria-label="Sections" className="flex flex-col gap-1 px-6">
                {NAV_ITEMS.map((item) => (
                  <SheetClose asChild key={item.label}>
                    <Link
                      href={item.href}
                      className="text-subsection py-2 font-bold"
                    >
                      {item.label}{" "}
                      <span aria-hidden="true">{item.emoji}</span>
                    </Link>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                  <Link
                    href="/blog"
                    className="text-subsection text-theme-primary py-2 font-bold"
                  >
                    Blog <span aria-hidden="true">📓</span>
                  </Link>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
