"use client";

import { useEffect, useLayoutEffect, useState } from "react";

type Mode = "dark" | "light";

type WindowWithTheme = Window &
  typeof globalThis & {
    __onThemeChange: (theme: Mode) => void;
    __setPreferredTheme: (theme: Mode) => void;
    __theme: Mode;
  };

const ThemeToggle = () => {
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const switchTheme = () => {
    // This is using a script that is added in layout.tsx
    setIsDarkTheme(!isDarkTheme);
    (window as WindowWithTheme).__setPreferredTheme(
      !isDarkTheme ? "dark" : "light",
    );
  };

  useLayoutEffect(() => {
    if ((window as WindowWithTheme).__theme == "light") {
      setIsDarkTheme(false);
    }
  }, []);

  useEffect(() => {
    (function (window) {
      window.__onThemeChange = function () {};
      function setTheme(newTheme: Mode) {
        window.__theme = newTheme;
        preferredTheme = newTheme;
        document.body.setAttribute("data-theme", newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
        window.__onThemeChange(newTheme);
      }

      let preferredTheme!: Mode;
      try {
        preferredTheme = localStorage.getItem("theme") as Mode;
      } catch (err) {}

      window.__setPreferredTheme = function (newTheme) {
        setTheme(newTheme);
        try {
          localStorage.setItem("theme", newTheme);
        } catch (err) {}
      };

      let darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
      darkQuery.addListener(function (e) {
        window.__setPreferredTheme(e.matches ? "dark" : "light");
      });

      setTheme(preferredTheme || (darkQuery.matches ? "dark" : "light"));
    })(window as WindowWithTheme);
  }, []);

  return (
    <button
      role="button"
      aria-label="Toggle dark/light"
      className="toggle-theme bg-transparent border-none cursor-pointer hover:opacity-75 focus:outline-none"
      onClick={switchTheme}
    >
      {isDarkTheme ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="feather feather-sun"
        >
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="feather feather-moon"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      )}
    </button>
  );
};

export default ThemeToggle;
