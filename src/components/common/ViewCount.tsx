"use client";

import { usePageViewsValue } from "@/store/page-views";
import { FormattedNumber } from "react-intl";

const ViewCount = ({ pathname }: { pathname: string }) => {
  const pageViews = usePageViewsValue();

  const viewCount = pageViews[pathname]?.unique || 0;

  return (
    <span>{viewCount ? <FormattedNumber value={viewCount} /> : "---"}</span>
  );
};

export default ViewCount;
