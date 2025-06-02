"use client";

import classNames from "classnames";
import { useAtomValue } from "jotai";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiArrowLeftCircle } from "react-icons/fi";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { scrolledStore } from "@/store/theme";

const BlogHeader = ({
  className,
  ...props
}: React.ComponentProps<"header">) => {
  const { isScrolled } = useAtomValue(scrolledStore);
  const pathName = usePathname();

  return (
    <header
      {...props}
      className={classNames(
        "flex-center background sticky inset-0 z-header m-0 h-header-height w-full flex-wrap p-0 shadow-lg transition-all duration-500 ease-in-out",
        className
      )}
    >
      <div className="container mx-auto flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="header__left flex h-full items-center">
          <button
            type="button"
            className="focus:outline-none"
            onFocus={(e) => {
              e.target.blur();
            }}
            tabIndex={-1}
          >
            <Link href="/blog" passHref tabIndex={-1}>
              <div className="logo flip-animate flex-center whitespace-no-wrap no-underine select-none font-extrabold uppercase focus:outline-none">
                {pathName !== "/blog" ? (
                  <>
                    <FiArrowLeftCircle className="size-8" />
                    <span className="hidden md:inline-flex">
                      &nbsp;Back to&nbsp;
                    </span>
                    <span
                      className="logo__text relative hidden md:inline-flex"
                      data-hover="Ljóss"
                    >
                      Home
                    </span>
                  </>
                ) : (
                  <span
                    className="logo__text relative inline-flex"
                    data-hover="Ljóss"
                  >
                    Home
                  </span>
                )}
              </div>
            </Link>
          </button>
        </div>
        <div className="header__right flex h-full items-center">
          <div className="ml-4">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};

export default BlogHeader;
