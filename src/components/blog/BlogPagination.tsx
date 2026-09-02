"use client";

import PaginationWithSelect from "@/components/common/PaginationWithSelect";
import { AppContext } from "@/providers/AppProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContext } from "react";

const BlogPagination = ({ totalPages }: { totalPages: number }) => {
  const { segments } = useContext(AppContext);
  const { push } = useRouter();

  const curentPage = segments ? +segments[2] : 1;

  return (
    <PaginationWithSelect
      className="blog-pagination"
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
