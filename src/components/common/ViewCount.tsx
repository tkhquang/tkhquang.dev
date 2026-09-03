"use client";

import { usePageViewsValue } from "@/store/page-views";
import { FormattedNumber } from "react-intl";

const ViewCount = ({ pathname }: { pathname: string }) => {
  const pageViews = usePageViewsValue();

  /* No entry yet means loading or a dead API; an entry with 0 is a real
     count and renders as one instead of hiding behind the placeholder */
  const entry = pageViews[pathname];

  return (
    <span aria-label={entry ? `${entry.unique} views` : "View count pending"}>
      {entry ? <FormattedNumber value={entry.unique} /> : "---"}
    </span>
  );
};

export default ViewCount;
