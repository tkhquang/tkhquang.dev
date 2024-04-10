"use client";

import debounce from "debounce";
import classNames from "classnames";
import { useCallback, useEffect, useState } from "react";
import ThemeToggle from "@/components/theme/ThemeToggle";

const Header = ({ className, ...props }: React.ComponentProps<"header">) => {
  const [isScrolled, setIsScrolled] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const checkIfIsScrolled = useCallback(
    debounce(() => {
      const top = window.scrollY || 0;

      setIsScrolled(top > 600 - 96);
    }, 50),
    [],
  );

  useEffect(() => {
    window.addEventListener("scroll", checkIfIsScrolled);
    window.addEventListener("load", checkIfIsScrolled);

    return () => {
      window.removeEventListener("scroll", checkIfIsScrolled);
      window.removeEventListener("load", checkIfIsScrolled);
    };
  }, [checkIfIsScrolled]);

  return (
    <header
      {...props}
      className={classNames(
        "h-header-height p-0 m-0 flex-center flex-wrap inset-0 w-full z-header fixed text-gray-200 bg-transparent transition-all duration-500 ease-in-out",
        {
          "!bg-theme-tone shadow-lg": isScrolled,
        },
        className,
      )}
    >
      <div className="container px-4 sm:px-6 lg:px-8 mx-auto flex justify-between items-center h-full">
        <div className="header__left flex items-center h-full">X</div>
        <div className="header__right flex items-center h-full">
          {/* <Navigation v-if="!isHomePage" />
          <ToggleTheme className="ml-4" /> */}

          <div className="ml-4">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
