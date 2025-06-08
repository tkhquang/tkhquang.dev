"use client";

import { useEffect } from "react";
import { useGetPageViews } from "@/store/page-views";

const ClientSideGetPageViews = ({ pathnames }: { pathnames: string[] }) => {
  const getPageViews = useGetPageViews();

  useEffect(() => {
    getPageViews(pathnames);
  }, [getPageViews, pathnames]);

  return null;
};

export default ClientSideGetPageViews;
