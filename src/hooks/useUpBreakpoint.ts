import { useEffect, useState } from "react";

const useUpBreakpoint = (query: string): boolean => {
  const [isMatch, setMatch] = useState<boolean>(false);
  const [screens, setScreens] = useState<Record<string, string>>({});

  useEffect(() => {
    const runtimeScreens = Object.entries({
      ...window.getComputedStyle(document.body),
    })
      .filter(([_, value]) => (value as string).startsWith("--breakpoint-"))
      .map(([_, value]) => value as string)
      .reduce(
        (obj, cssVar) =>
          Object.assign(obj, {
            [cssVar.replace("--breakpoint-", "")]: window
              .getComputedStyle(document.body)
              .getPropertyValue(cssVar as string),
          }),
        {}
      );

    setScreens(runtimeScreens);
  }, []);

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
  }, [query, screens]);

  return isMatch;
};

export default useUpBreakpoint;
