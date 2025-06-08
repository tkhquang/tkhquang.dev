"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const ClientSideTracking = () => {
  return (
    <>
      <GoogleAnalytics
        gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_MEASUREMENT_ID}
      />
      <Analytics />
      <SpeedInsights />
    </>
  );
};

export default ClientSideTracking;
