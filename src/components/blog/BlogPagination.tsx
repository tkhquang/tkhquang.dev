"use client";

import Link from "next/link";
import PaginationWithSelect from "@/components/common/PaginationWithSelect";
import { AppContext } from "@/providers/AppProvider";
import { useRouter } from "next/navigation";
import { useContext } from "react";

const BlogPagination = ({ totalPages }: { totalPages: number }) => {
  const { segments } = useContext(AppContext);
  const { push } = useRouter();

  const curentPage = segments ? +segments[2] : 1;

  return (
    <PaginationWithSelect
      currentPage={curentPage}
      totalPage={totalPages}
      getPageUrl={(page) => `/blog/page/${page}`}
      LinkComponent={Link}
      onPageChange={(page) => {
        push(`/blog/page/${page}`);
      }}
    />
  );
};

export default BlogPagination;
