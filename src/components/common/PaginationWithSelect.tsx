"use client";

import { useMemo, ComponentType } from "react";
import {
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * PaginationWithSelect Component
 *
 * A flexible pagination component with both button navigation and a select dropdown.
 *
 * @param currentPage - The current active page (1-indexed)
 * @param totalPage - Total number of pages
 * @param onPageChange - Optional callback when page changes (for client-side navigation)
 * @param getPageUrl - Optional function to generate URLs for each page (enables proper links)
 * @param LinkComponent - Optional custom link component (e.g., Next.js Link)
 * @param siblingCount - Number of page buttons to show on each side of current page
 *
 * @example
 * // Basic usage with callback
 * <PaginationWithSelect
 *   currentPage={1}
 *   totalPage={10}
 *   onPageChange={(page) => navigate(page)}
 * />
 *
 * @example
 * // With Next.js Link for proper SEO and prefetching
 * <PaginationWithSelect
 *   currentPage={1}
 *   totalPage={10}
 *   getPageUrl={(page) => `/blog/page/${page}`}
 *   LinkComponent={Link}
 *   onPageChange={(page) => router.push(`/blog/page/${page}`)}
 * />
 */
type Props = {
  currentPage: number;
  totalPage: number;
  onPageChange?: (page: number) => void;
  siblingCount?: number;
  getPageUrl?: (page: number) => string;
  LinkComponent?: ComponentType<any>;
};

const DOTS = "...";

const range = (start: number, end: number) => {
  const length = end - start + 1;
  return Array.from({ length }, (_, idx) => idx + start);
};

const PaginationWithSelect = ({
  currentPage,
  totalPage,
  onPageChange,
  siblingCount = 1,
  getPageUrl,
  LinkComponent,
}: Props) => {
  const paginationRange = useMemo(() => {
    const totalPageNumbers = siblingCount + 5;

    if (totalPageNumbers >= totalPage) {
      return range(1, totalPage);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPage);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPage - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPage;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = range(1, leftItemCount);

      return [...leftRange, DOTS, totalPage];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = range(totalPage - rightItemCount + 1, totalPage);
      return [firstPageIndex, DOTS, ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
    }
    return [];
  }, [currentPage, totalPage, siblingCount]);

  const handlePageChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    }
  };

  const createPageLink = (page: number) => {
    if (getPageUrl) {
      return getPageUrl(page);
    }
    return "#";
  };

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    page: number,
    isDisabled: boolean = false
  ) => {
    // Prevent click if disabled
    if (isDisabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // If using custom URLs (like Next.js Link), let the Link handle navigation
    if (getPageUrl && LinkComponent) {
      return;
    }
    // Otherwise prevent default and use callback
    e.preventDefault();
    handlePageChange(page);
  };

  const renderLink = (
    content: React.ReactNode,
    page: number,
    props: any = {}
  ) => {
    const isDisabled = props["aria-disabled"] === true;

    const linkProps = {
      ...props,
      onClick: (e: React.MouseEvent<HTMLAnchorElement>) =>
        handleLinkClick(e, page, isDisabled),
    };

    if (LinkComponent && getPageUrl && !isDisabled) {
      return (
        <LinkComponent href={createPageLink(page)}>
          <PaginationLink {...linkProps} as="span">
            {content}
          </PaginationLink>
        </LinkComponent>
      );
    }

    return (
      <PaginationLink
        href={isDisabled ? undefined : createPageLink(page)}
        {...linkProps}
      >
        {content}
      </PaginationLink>
    );
  };

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem className="2xs:block hidden">
          {renderLink(<ChevronFirstIcon className="h-4 w-4" />, 1, {
            "aria-label": "Go to first page",
            size: "icon",
            className: "rounded-full",
            "aria-disabled": currentPage === 1,
            tabIndex: currentPage === 1 ? -1 : undefined,
            style:
              currentPage === 1
                ? { pointerEvents: "none", opacity: 0.5 }
                : undefined,
          })}
        </PaginationItem>
        <PaginationItem className="2xs:block hidden">
          {renderLink(
            <ChevronLeftIcon className="h-4 w-4" />,
            Math.max(1, currentPage - 1),
            {
              "aria-label": "Go to previous page",
              size: "icon",
              className: "rounded-full",
              "aria-disabled": currentPage === 1,
              tabIndex: currentPage === 1 ? -1 : undefined,
              style:
                currentPage === 1
                  ? { pointerEvents: "none", opacity: 0.5 }
                  : undefined,
            }
          )}
        </PaginationItem>

        {paginationRange.map((pageNumber, index) => {
          if (pageNumber === DOTS) {
            return <PaginationEllipsis key={`${pageNumber}-${index}`} />;
          }

          return (
            <PaginationItem key={pageNumber} className="2xs:block hidden">
              {renderLink(pageNumber, pageNumber as number, {
                isActive: currentPage === pageNumber,
                "aria-current": currentPage === pageNumber ? "page" : undefined,
              })}
            </PaginationItem>
          );
        })}

        <PaginationItem className="2xs:block hidden">
          {renderLink(
            <ChevronRightIcon className="h-4 w-4" />,
            Math.min(totalPage, currentPage + 1),
            {
              "aria-label": "Go to next page",
              size: "icon",
              className: "rounded-full",
              "aria-disabled": currentPage === totalPage,
              tabIndex: currentPage === totalPage ? -1 : undefined,
              style:
                currentPage === totalPage
                  ? { pointerEvents: "none", opacity: 0.5 }
                  : undefined,
            }
          )}
        </PaginationItem>
        <PaginationItem className="2xs:block hidden">
          {renderLink(<ChevronLastIcon className="h-4 w-4" />, totalPage, {
            "aria-label": "Go to last page",
            size: "icon",
            className: "rounded-full",
            "aria-disabled": currentPage === totalPage,
            tabIndex: currentPage === totalPage ? -1 : undefined,
            style:
              currentPage === totalPage
                ? { pointerEvents: "none", opacity: 0.5 }
                : undefined,
          })}
        </PaginationItem>
        <PaginationItem>
          <Select
            value={String(currentPage)}
            onValueChange={(value) => handlePageChange(Number(value))}
          >
            <SelectTrigger className="w-[120px]" size="sm">
              <SelectValue placeholder="Select page">
                Page {currentPage}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {range(1, totalPage).map((page) => (
                <SelectItem key={page} value={String(page)}>
                  Page {page}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default PaginationWithSelect;
