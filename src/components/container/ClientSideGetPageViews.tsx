"use client";

import { useGetPageViews } from "@/store/page-views";
import { useEffect } from "react";

const ClientSideGetPageViews = ({ pathnames }: { pathnames: string[] }) => {
  const getPageViews = useGetPageViews();

  useEffect(() => {
    getPageViews(pathnames);
  }, [getPageViews, pathnames]);

  return null;
};

export default ClientSideGetPageViews;
