"use client";

import { useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { themeStore } from "@/src/store/theme";

export default function StacksChartFrame() {
  const [theme, setTheme] = useAtom(themeStore);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (frameRef.current) {
      frameRef.current.contentWindow?.postMessage({
        type: "$SWITCH_THEME",
        payload: theme.mode,
      });
    }
  }, [theme.mode]);

  return (
    <iframe
      src="/charts/stacks"
      width="100%"
      height="535px"
      ref={frameRef}
    ></iframe>
  );
}
