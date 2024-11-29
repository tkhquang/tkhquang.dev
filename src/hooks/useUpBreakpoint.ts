import { useEffect, useState } from "react";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "/tailwind.config";

const fullConfig = resolveConfig(tailwindConfig);

const {
  theme: { screens },
} = fullConfig;

const useUpBreakpoint = (query: keyof typeof screens): boolean => {
  const [isMatch, setMatch] = useState<boolean>(false);

  useEffect(() => {
    const mediaQuery = `(min-width: ${screens[query]})`;
    const matchQueryList = window.matchMedia(mediaQuery);
    setMatch(matchQueryList.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setMatch(e.matches);
    };

    matchQueryList.addEventListener("change", handleChange);
    return () => {
      matchQueryList.removeEventListener("change", handleChange);
    };
  }, [query]);

  return isMatch;
};

export default useUpBreakpoint;
