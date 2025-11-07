"use client";

import BackButtonIcon from "@/components/layout/BackButtonIcon";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { useRouterHelper } from "@/hooks/useRouterHelper";
import { useAsPathValue } from "@/store/router";
import classNames from "classnames";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

const BlogHeader = ({
  className,
  ...props
}: React.ComponentProps<"header">) => {
  const params = useParams();
  const { matchSegments } = useRouterHelper();
  const { prevAsPath } = useAsPathValue();
  const { back, prefetch, push } = useRouter();

  const isHomeBlog = matchSegments(["blog"]);
  const isInPostPage = matchSegments([
    "blog",
    "posts",
    null, //slug
  ]);

  const shouldRestoreScrollOnBack = prevAsPath === "/blog";

  const handleBack = () => {
    if (isInPostPage) {
      if (shouldRestoreScrollOnBack && params?.slug) {
        back();
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
        "header__background-transparent--blog h-header-height text-theme-on-background shadow-box-md sticky inset-0 z-(--z-header) m-0 w-full flex-wrap p-0 transition-all duration-500 ease-in-out",
        className
      )}
    >
      <div className="flex-center size-full flex-wrap">
        <div className="container mx-auto flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="header__left flex h-full items-center">
            <div className="flex flex-col">
              <button
                type="button"
                className="cursor-pointer focus:outline-hidden"
                onClick={handleBack}
              >
                <div className="logo flip-animate flex-center whitespace-no-wrap no-underine font-extrabold uppercase select-none focus:outline-hidden">
                  {!isHomeBlog ? (
                    <>
                      <BackButtonIcon className="size-8" />
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
                      role="button"
                      tabIndex={0}
                      className="logo__text relative inline-flex"
                      data-hover="Ljóss"
                      onClick={() => {
                        window.scrollTo({
                          behavior: "smooth",
                          top: 0,
                        });
                      }}
                      onKeyDown={() => {}}
                    >
                      Home
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>
          <div className="header__right flex h-full items-center">
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
