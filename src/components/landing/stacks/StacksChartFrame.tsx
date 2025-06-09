"use client";

import LoaderLines from "@/components/common/loader/LoaderLines";
import { useAfterPaintEffect } from "@/hooks/useAfterPaintEffect";
import { themeStore } from "@/store/theme";
import clsx from "clsx";
import { useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";

export default function StacksChartFrame() {
  const [theme, setTheme] = useAtom(themeStore);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Ensure loader always hides if iframe is already loaded from cache
  useEffect(() => {
    const iframe = frameRef.current;
    if (!iframe) return;

    // Modern browsers will set readyState to 'complete' if loaded from cache
    const hasLoaded = () => {
      setIsLoaded(true);
    };

    if (iframe.contentDocument?.readyState === "complete") {
      // Already loaded (possibly from cache)
      setIsLoaded(true);
    } else {
      // Listen for load if not already loaded
      iframe.addEventListener("load", hasLoaded);
      // Cleanup
      return () => iframe.removeEventListener("load", hasLoaded);
    }
  }, []);

  useEffect(() => {
    if (frameRef.current) {
      frameRef.current.contentWindow?.postMessage({
        payload: theme.mode,
        type: "$SWITCH_THEME",
      });
    }
  }, [theme.mode]);

  // Fallback to hide loader after 10s (paranoia)
  useAfterPaintEffect(() => {
    if (!isLoaded) {
      const timeout = setTimeout(() => setIsLoaded(true), 10000);
      return () => clearTimeout(timeout);
    }
  }, [isLoaded]);

  return (
    <div className="relative">
      <div
        className={clsx(
          isLoaded && "opacity-0 transition-opacity duration-1000"
        )}
      >
        <LoaderLines />
      </div>
      <iframe
        title="stacks-frame"
        src="/charts/stacks"
        width="100%"
        height="535px"
        ref={frameRef}
        onLoad={() => setIsLoaded(true)}
      ></iframe>
    </div>
  );
}
