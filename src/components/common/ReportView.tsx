"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const ReportView = () => {
  const pathname = usePathname();

  useEffect(() => {
    try {
      fetch("/api/views", {
        body: JSON.stringify({ pathname }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
    } catch (error) {
      // TODO: Handle errors
    }
  }, [pathname]);

  return null;
};

export default ReportView;
