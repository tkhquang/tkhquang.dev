"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { ChartData } from "@/components/landing/stacks/Stacks";
import { useAtom } from "jotai";
import { themeStore } from "@/src/store/theme";

const StacksChartContent = dynamic(
  () => import("@/components/landing/stacks/StacksChartContent"),
  {
    ssr: false,
  }
);

export default function StacksChart({ chartData }: { chartData: ChartData[] }) {
  const [theme, setTheme] = useAtom(themeStore);

  useEffect(() => {
    const handleParentWindowMessage = (event: MessageEvent) => {
      if (event.data.type === "$SWITCH_THEME") {
        setTheme(event.data.payload);
      }
    };

    window.addEventListener("message", handleParentWindowMessage);

    return () => {
      window.removeEventListener("message", handleParentWindowMessage);
    };
  }, []);

  return <StacksChartContent chartData={chartData} />;
}
