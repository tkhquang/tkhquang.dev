"use client";

import { ChartData } from "@/components/landing/stacks/Stacks";
import dynamic from "next/dynamic";
import React, { useEffect } from "react";

const StacksChartContent = dynamic(
  () => import("@/components/landing/stacks/StacksChartContent"),
  {
    ssr: false,
  }
);

export default function StacksChart({ chartData }: { chartData: ChartData[] }) {
  useEffect(() => {
    const handleParentWindowMessage = (event: MessageEvent) => {
      if (event.data.type === "$SWITCH_THEME") {
        window.__setPreferredTheme(event.data.payload);
      }
    };

    window.addEventListener("message", handleParentWindowMessage);

    return () => {
      window.removeEventListener("message", handleParentWindowMessage);
    };
  }, []);

  return <StacksChartContent chartData={chartData} />;
}
