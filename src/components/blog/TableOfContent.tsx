"use client";

import Drawer, { useDrawerContext } from "@/components/common/Drawer";
import { useThemeValue } from "@/store/theme";
import { Portal } from "@ariakit/react";
import { Toc, TocEntry } from "@stefanprobst/rehype-extract-toc";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BsFillMenuButtonWideFill } from "react-icons/bs";

// Constants
const INTERSECTION_THRESHOLD = 0.1;
const INITIAL_SCROLL_DELAY = 100;
const DEFAULT_HEADER_HEIGHT = 60;

// Types
interface TocItemProps {
  heading: TocEntry;
  activeAnchor: string;
  onAnchorClick: (
    heading: TocEntry,
    e: React.MouseEvent<HTMLAnchorElement>
  ) => void;
  hideDrawer?: boolean;
}

interface UseActiveAnchorOptions {
  headings: Toc;
  headerHeight: number;
}

interface UseScrollToHeadingOptions {
  headerHeight: number;
  onActiveChange?: (id: string) => void;
}

// Custom hook for managing active anchor with intersection observer
const useActiveAnchor = ({
  headings,
  headerHeight,
}: UseActiveAnchorOptions) => {
  const [activeAnchor, setActiveAnchor] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      let minDelta = Number.POSITIVE_INFINITY;
      let currentId = "";

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const rect = entry.target.getBoundingClientRect();
          const delta = Math.abs(rect.top - headerHeight);

          if (delta < minDelta) {
            minDelta = delta;
            currentId = entry.target.id;
          }
        }
      });

      if (currentId) {
        setActiveAnchor(currentId);
      }
    },
    [headerHeight]
  );

  const setInitialActiveAnchor = useCallback(() => {
    if (!headings?.length) return;

    const headingElements = headings
      .map((heading) => document.getElementById(heading.id!))
      .filter(Boolean) as HTMLElement[];

    let foundId = "";

    for (const element of headingElements) {
      const rect = element.getBoundingClientRect();
      if (rect.top - headerHeight <= 1) {
        foundId = element.id;
      }
    }

    if (foundId) {
      setActiveAnchor(foundId);
    } else if (headingElements.length > 0) {
      setActiveAnchor(headingElements[0].id);
    }
  }, [headings, headerHeight]);

  useEffect(() => {
    if (!headings?.length) return;

    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      rootMargin: `-${headerHeight}px 0px 0px 0px`,
      threshold: INTERSECTION_THRESHOLD,
    });

    // Observe all heading elements
    const headingElements = headings
      .map((heading) => document.getElementById(heading.id!))
      .filter(Boolean) as HTMLElement[];

    headingElements.forEach((element) => {
      observerRef.current?.observe(element);
    });

    // Set initial active anchor after a brief delay
    const timeoutId = setTimeout(setInitialActiveAnchor, INITIAL_SCROLL_DELAY);

    return () => {
      clearTimeout(timeoutId);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [headings, headerHeight, handleIntersection, setInitialActiveAnchor]);

  return activeAnchor;
};

// Custom hook for smooth scrolling to headings
const useScrollToHeading = ({
  headerHeight,
  onActiveChange,
}: UseScrollToHeadingOptions) => {
  const scrollToHeading = useCallback(
    (heading: TocEntry, e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();

      if (!heading.id) return;

      const element = document.getElementById(heading.id);
      if (!element) return;

      const targetY =
        element.getBoundingClientRect().top + window.pageYOffset - headerHeight;

      window.scrollTo({
        behavior: "smooth",
        top: targetY,
      });

      onActiveChange?.(heading.id);
    },
    [headerHeight, onActiveChange]
  );

  return scrollToHeading;
};

// Shared component for TOC items
const TocItem = ({
  heading,
  activeAnchor,
  onAnchorClick,
  hideDrawer = false,
}: TocItemProps) => {
  const drawerStore = useDrawerContext();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      onAnchorClick(heading, e);
      if (hideDrawer) {
        drawerStore?.hide();
      }
    },
    [heading, onAnchorClick, hideDrawer, drawerStore]
  );

  const isActive = activeAnchor === heading.id;

  return (
    <li className="my-2 font-semibold">
      <a
        href={`#${heading.id}`}
        className={`anchor transition-colors duration-200 hover:text-theme-primary ${
          isActive
            ? "anchor--is-active text-theme-primary"
            : "text-theme-secondary"
        }`}
        onClick={handleClick}
        aria-current={isActive ? "location" : undefined}
      >
        <span>#</span>&nbsp;
        <span>{heading.value}</span>
      </a>
    </li>
  );
};

// TOC List component
const TocList = ({
  headings,
  activeAnchor,
  onAnchorClick,
  hideDrawer = false,
}: {
  headings: Toc;
  activeAnchor: string;
  onAnchorClick: TocItemProps["onAnchorClick"];
  hideDrawer?: boolean;
}) => {
  if (!headings?.length) return null;

  return (
    <ul className="mt-5" role="navigation" aria-label="Table of contents">
      {headings.map((heading) => (
        <TocItem
          key={heading.id}
          heading={heading}
          activeAnchor={activeAnchor}
          onAnchorClick={onAnchorClick}
          hideDrawer={hideDrawer}
        />
      ))}
    </ul>
  );
};

// Mobile TOC trigger button
const MobileTocTrigger = () => (
  <Portal>
    <BsFillMenuButtonWideFill
      className="fixed bottom-0 left-0 z-10 mb-20 ml-10 block size-8 cursor-pointer opacity-20 transition-all duration-300 hover:opacity-75 focus:outline-none lg:hidden"
      aria-label="Open table of contents"
    />
  </Portal>
);

// Main component
export default function TableOfContent({ headings }: { headings: Toc }) {
  const { cssVariables } = useThemeValue();

  // Memoize header height calculation
  const headerHeight = useMemo(() => {
    const height = cssVariables?.["header-height"];
    return height ? parseFloat(String(height)) : DEFAULT_HEADER_HEIGHT;
  }, [cssVariables]);

  // Use custom hooks
  const activeAnchor = useActiveAnchor({ headings, headerHeight });
  const scrollToHeading = useScrollToHeading({
    headerHeight,
    onActiveChange: undefined, // Could pass setActiveAnchor if manual override needed
  });

  return (
    <section
      className="table-of-content fixed bottom-0 left-0 mx-4 flex flex-1 flex-col items-end font-bold transition-opacity duration-500 lg:relative lg:opacity-50 lg:hover:opacity-100"
      aria-label="Table of contents navigation"
    >
      {headings?.length > 0 && (
        <div className="table-of-content__list sticky top-header-height hidden pt-5 lg:block">
          <h2 className="heading mt-10 text-2xl">Table of Content</h2>

          {/* Mobile Drawer */}
          <Drawer
            position="left"
            size={300}
            title="Table of Content"
            trigger={<MobileTocTrigger />}
            className="[&_.drawer\_\_content]:!max-w-[calc(100%-2rem)]"
          >
            <TocList
              headings={headings}
              activeAnchor={activeAnchor}
              onAnchorClick={scrollToHeading}
              hideDrawer={true}
            />
          </Drawer>

          {/* Desktop TOC List */}
          <TocList
            headings={headings}
            activeAnchor={activeAnchor}
            onAnchorClick={scrollToHeading}
          />
        </div>
      )}
    </section>
  );
}
