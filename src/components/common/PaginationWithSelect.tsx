"use client";

import { useMemo, ComponentType } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import {
  Pagination,
  PaginationContent,
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
  className?: string;
};

const DOTS = "...";

const range = (start: number, end: number) => {
  const length = end - start + 1;
  return Array.from({ length }, (_, idx) => idx + start);
};

const PaginationWithSelect = ({
  className,
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

    /* An anchor without an href is uncrawlable and fails Lighthouse; the
       disabled edge renders as a same-styled span instead. aria-label is
       prohibited on a plain span (aria-prohibited-attr), and the visible
       text already names the edge, so the label stays off here */
    if (isDisabled) {
      const { "aria-label": _ariaLabel, ...spanProps } = props;

      return (
        <PaginationLink as="span" {...spanProps}>
          {content}
        </PaginationLink>
      );
    }

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
    <Pagination className={className}>
      <PaginationContent>
        {/* Colophon status: always visible, anchors the bar to the rail */}
        <li className="pagination-status kicker mr-auto whitespace-nowrap tabular-nums">
          Page {currentPage} of {totalPage}
        </li>

        <PaginationItem className="2xs:block hidden">
          {renderLink(
            <>
              <ChevronLeftIcon className="size-3.5" aria-hidden />
              <span className="xs:inline hidden">Newer</span>
            </>,
            Math.max(1, currentPage - 1),
            {
              "aria-label": "Go to previous page",
              size: "default",
              className:
                "pagination-nav" +
                (currentPage === 1 ? " pagination-nav-disabled" : ""),
              "aria-disabled": currentPage === 1,
              tabIndex: currentPage === 1 ? -1 : undefined,
            }
          )}
        </PaginationItem>

        {paginationRange.map((pageNumber, index) => {
          if (pageNumber === DOTS) {
            return (
              <PaginationItem
                key={`${pageNumber}-${index}`}
                className="2xs:block hidden"
              >
                <span aria-hidden className="px-1 font-mono text-xs opacity-60">
                  ...
                </span>
                <span className="sr-only">More pages</span>
              </PaginationItem>
            );
          }

          return (
            <PaginationItem key={pageNumber} className="2xs:block hidden">
              {renderLink(pageNumber, pageNumber as number, {
                className: "pagination-number",
                isActive: currentPage === pageNumber,
                "aria-current": currentPage === pageNumber ? "page" : undefined,
              })}
            </PaginationItem>
          );
        })}

        <PaginationItem className="2xs:block hidden">
          {renderLink(
            <>
              <span className="xs:inline hidden">Older</span>
              <ChevronRightIcon className="size-3.5" aria-hidden />
            </>,
            Math.min(totalPage, currentPage + 1),
            {
              "aria-label": "Go to next page",
              size: "default",
              className:
                "pagination-nav" +
                (currentPage === totalPage ? " pagination-nav-disabled" : ""),
              "aria-disabled": currentPage === totalPage,
              tabIndex: currentPage === totalPage ? -1 : undefined,
            }
          )}
        </PaginationItem>

        <PaginationItem className="ml-4">
          <Select
            value={String(currentPage)}
            onValueChange={(value) => handlePageChange(Number(value))}
          >
            <SelectTrigger
              className="w-auto"
              size="sm"
              aria-label="Jump to page"
            >
              <SelectValue placeholder="Jump to">Jump to</SelectValue>
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
