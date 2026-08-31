"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_MEASUREMENT_ID;

const ClientSideTracking = () => {
  return (
    <>
      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      <Analytics />
      <SpeedInsights />
    </>
  );
};

export default ClientSideTracking;
