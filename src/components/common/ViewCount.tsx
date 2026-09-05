"use client";

import { usePageViewsValue } from "@/store/page-views";
import { FormattedNumber } from "react-intl";

const ViewCount = ({ pathname }: { pathname: string }) => {
  const pageViews = usePageViewsValue();

  /* No entry yet means loading or a dead API; an entry with 0 is a real
     count and renders as one instead of hiding behind the placeholder */
  const entry = pageViews[pathname];

  return (
    <span>
      {entry ? (
        <FormattedNumber value={entry.unique} />
      ) : (
        <span aria-hidden>---</span>
      )}
      {/* The eye icon beside the count is decorative, so the unit and the
          pending state are spoken from here; a bare span cannot carry an
          aria-label of its own */}
      <span className="sr-only">{entry ? " views" : "View count pending"}</span>
    </span>
  );
};

export default ViewCount;
