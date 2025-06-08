"use client";

import { FormattedNumber } from "react-intl";
import { usePageViewsValue } from "@/store/page-views";

const ViewCount = ({ pathname }: { pathname: string }) => {
  const pageViews = usePageViewsValue();

  const viewCount = pageViews[pathname]?.unique || 0;

  return (
    <span>{viewCount ? <FormattedNumber value={viewCount} /> : "---"}</span>
  );
};

export default ViewCount;
