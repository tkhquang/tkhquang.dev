"use client";

import classNames from "classnames";
import { useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import LoaderLines from "@/components/common/loader/LoaderLines";
import { useAfterPaintEffect } from "@/hooks/useAfterPaintEffect";
import { themeStore } from "@/store/theme";

export default function StacksChartFrame() {
  const [theme, setTheme] = useAtom(themeStore);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (frameRef.current) {
      frameRef.current.contentWindow?.postMessage({
        payload: theme.mode,
        type: "$SWITCH_THEME",
      });
    }
  }, [theme.mode]);

  useAfterPaintEffect(() => {
    setTimeout(() => {
      setIsLoaded(true);
    }, 5_000);
  }, []);

  return (
    <div className="relative">
      <div
        className={classNames(
          isLoaded && "opacity-0 transition-opacity duration-1000"
        )}
      >
        <LoaderLines />
      </div>
      <iframe
        src="/charts/stacks"
        width="100%"
        height="535px"
        ref={frameRef}
        onLoad={() => setIsLoaded(true)}
      ></iframe>
    </div>
  );
}
