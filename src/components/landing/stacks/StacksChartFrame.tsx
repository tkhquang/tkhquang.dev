"use client";

import { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { themeStore } from "@/store/theme";
import LoaderLines from "@/components/common/loader/LoaderLines";
import classNames from "classnames";
import { useAfterPaintEffect } from "@/hooks/useAfterPaintEffect";

export default function StacksChartFrame() {
  const [theme, setTheme] = useAtom(themeStore);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (frameRef.current) {
      frameRef.current.contentWindow?.postMessage({
        type: "$SWITCH_THEME",
        payload: theme.mode,
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
