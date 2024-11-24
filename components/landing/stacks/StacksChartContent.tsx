"use client";

import React from "react";
import { useAtomValue } from "jotai";
import ReactFCOriginal from "react-fusioncharts";
import FusionCharts from "fusioncharts";
import FusionTheme from "fusioncharts/themes/fusioncharts.theme.fusion";
import Pie3D from "fusioncharts/fusioncharts.charts";
import { ChartData } from "@/components/landing/stacks/Stacks";
import { themeStore } from "@/src/store/theme";

// Pass FusionCharts modules to ReactFC
ReactFCOriginal.fcRoot(FusionCharts, Pie3D, FusionTheme);

/**
 * Dynamic wrapper for ReactFC to resolve TypeScript JSX issues.
 */
const FusionChartWrapper: React.FC<React.ComponentProps<any>> = (props) => {
  return React.createElement(ReactFCOriginal as any, props);
};

export default function StacksChartContent({
  chartData,
}: {
  chartData: ChartData[];
}) {
  const { cssVariables } = useAtomValue(themeStore);

  // FusionCharts configuration
  const chartConfigs = {
    type: "pie3d",
    width: "100%",
    height: "500",
    dataFormat: "json",
    dataSource: {
      chart: {
        baseFont: "Montserrat",
        baseFontSize: "14",
        use3DLighting: "1",
        caption: "Tech Stacks",
        captionFontColor: cssVariables["primary"],
        subCaption: "Based on Github commits",
        subCaptionFontColor: cssVariables["on-background"],
        showpercentintooltip: "1",
        captionFontSize: "20",
        subcaptionFontSize: "18",
        subcaptionFontBold: "0",
        useDataPlotColorForLabels: "0",
        labelFontColor: cssVariables["on-background"],
        labelFontBold: "1",
        // labelFontSize: "16",
        canvasBgAlpha: "0",
        bgAlpha: "0",
        theme: "ocean",
        startingAngle: "0",
        enableSmartLabels: "1",
        decimals: "1",
        showLegend: "1",
        legendBgColor: "#ffffff",
        legendBgAlpha: "0",
        legendBorderAlpha: "0",
        legendShadow: "0",
        // legendItemFontSize: "16",
        legendItemFontColor: cssVariables["on-background"],
        legendPosition: "bottom",
        alignLegendWithCanvas: "1",
        minimiseWrappingInLegend: "0",
        pieYScale: 40,
        pieSliceDepth: 22,
        showLabels: "0",
        showValues: "1",
        showPercentValues: "1",
        plotHighlightEffect: "0",
        captionPadding: "0",
        showValuesInLegend: "0",
      },
      data: chartData,
    },
  };

  return <FusionChartWrapper {...chartConfigs} />;
}
