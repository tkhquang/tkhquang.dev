"use client";

import { useEffect, useState } from "react";

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

        setViewCount(data.views);
      } catch (error) {
        // TODO: Handle errors
      }
    })();
  }, [pathname]);

  return <span>{viewCount || "--"}</span>;
};

export default ViewCount;
