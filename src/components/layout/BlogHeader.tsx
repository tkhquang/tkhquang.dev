"use client";

import classNames from "classnames";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiArrowLeftCircle } from "react-icons/fi";
import ThemeToggle from "@/components/theme/ThemeToggle";
import ReadLineIndicator from "@/components/common/ReadLineIndicator";

const BlogHeader = ({
  className,
  ...props
}: React.ComponentProps<"header">) => {
  const pathName = usePathname();

  return (
    <header
      {...props}
      className={classNames(
        "header--blog__background-transparent sticky inset-0 z-header m-0 h-header-height w-full flex-wrap p-0 text-theme-on-background shadow-lg transition-all duration-500 ease-in-out",
        className
      )}
    >
      <div className="flex-center h-full w-full flex-wrap">
        <div className="container mx-auto flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="header__left flex h-full items-center">
            <Link href="/blog">
              <button type="button" className="focus:outline-none">
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
              </button>
            </Link>
          </div>
          <div className="header__right flex h-full items-center">
            <div className="ml-4">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
      <ReadLineIndicator />
    </header>
  );
};

export default BlogHeader;
