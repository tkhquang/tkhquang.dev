"use client";

import { ChartData } from "@/components/landing/stacks/Stacks";
import { themeStore } from "@/store/theme";
import FusionCharts from "fusioncharts";
import Pie3D from "fusioncharts/fusioncharts.charts";
import FusionTheme from "fusioncharts/themes/fusioncharts.theme.fusion";
import { useAtomValue } from "jotai";
import React from "react";
import ReactFCOriginal from "react-fusioncharts";

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
    dataFormat: "json",
    dataSource: {
      chart: {
        alignLegendWithCanvas: "1",
        baseFont: "Montserrat",
        baseFontSize: "14",
        bgAlpha: "0",
        // labelFontSize: "16",
        canvasBgAlpha: "0",
        caption: "Tech Stacks",
        captionFontColor: cssVariables["primary"],
        captionFontSize: "20",
        captionPadding: "0",
        decimals: "1",
        enableSmartLabels: "1",
        labelFontBold: "1",
        labelFontColor: cssVariables["on-background"],
        legendBgAlpha: "0",
        legendBgColor: "#ffffff",
        legendBorderAlpha: "0",
        // legendItemFontSize: "16",
        legendItemFontColor: cssVariables["on-background"],
        legendPosition: "bottom",
        legendShadow: "0",
        minimiseWrappingInLegend: "0",
        pieSliceDepth: 22,
        pieYScale: 40,
        plotHighlightEffect: "0",
        showLabels: "0",
        showLegend: "1",
        showpercentintooltip: "1",
        showPercentValues: "1",
        showValues: "1",
        showValuesInLegend: "0",
        startingAngle: "0",
        subCaption: "Based on Github commits",
        subcaptionFontBold: "0",
        subCaptionFontColor: cssVariables["on-background"],
        subcaptionFontSize: "18",
        theme: "ocean",
        use3DLighting: "1",
        useDataPlotColorForLabels: "0",
      },
      data: chartData,
    },
    height: "500",
    type: "pie3d",
    width: "100%",
  };

  return <FusionChartWrapper {...chartConfigs} />;
}
