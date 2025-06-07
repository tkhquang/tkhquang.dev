"use client";

import { useEffect, useState } from "react";
import { FormattedNumber } from "react-intl";

const ViewCount = ({ pathname }: { pathname: string }) => {
  const [viewCount, setViewCount] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`/api/views?pathname=${pathname}`, {
          headers: {
            "Content-Type": "application/json",
          },
          method: "GET",
        });

        const data = await response.json();

        setViewCount(data.unique);
      } catch (error) {
        // TODO: Handle errors
      }
    })();
  }, [pathname]);

  return (
    <span>{viewCount ? <FormattedNumber value={viewCount} /> : "---"}</span>
  );
};

export default ViewCount;
