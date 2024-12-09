import { useEffect, useState } from "react";
import { getRootFontSize } from "@/utils/dom";

/**
 * A custom React hook to track the current root font size (`<html>` element) in pixels.
 *
 * This hook listens for changes such as resizing, media queries, and attribute updates
 * on the root element, ensuring it always provides the latest root font size.
 *
 * @returns {number} The current root font size in pixels.
 */
export const useRootFontSize = (): number => {
  const [rootFontSize, setRootFontSize] = useState<number>(0);

  useEffect(() => {
    const onRootFontSizeChange = () => {
      const newRootFontSize = getRootFontSize();

      setRootFontSize((prevRootFontSize) => {
        if (newRootFontSize !== prevRootFontSize) {
          return newRootFontSize;
        }
        return prevRootFontSize;
      });
    };

    const initialRAF = requestAnimationFrame(onRootFontSizeChange);

    const observer = new MutationObserver(onRootFontSizeChange);
    observer.observe(document.documentElement, {
      attributeFilter: ["style", "class"],
      attributes: true,
    });

    window.addEventListener("load", onRootFontSizeChange);
    window.addEventListener("resize", onRootFontSizeChange);
    window.addEventListener("beforeprint", onRootFontSizeChange);
    window.addEventListener("afterprint", onRootFontSizeChange);

    const mediaQueryList = window.matchMedia("print");

    const mediaQueryListener = () => {
      onRootFontSizeChange();
    };

    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener("change", mediaQueryListener);
    } else if (mediaQueryList.addListener) {
      mediaQueryList.addListener(mediaQueryListener);
    }

    return () => {
      cancelAnimationFrame(initialRAF);

      observer.disconnect();
      window.removeEventListener("load", onRootFontSizeChange);
      window.removeEventListener("resize", onRootFontSizeChange);
      window.removeEventListener("beforeprint", onRootFontSizeChange);
      window.removeEventListener("afterprint", onRootFontSizeChange);

      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener("change", mediaQueryListener);
      } else if (mediaQueryList.removeListener) {
        mediaQueryList.removeListener(mediaQueryListener);
      }
    };
  }, []);

  return rootFontSize;
};
