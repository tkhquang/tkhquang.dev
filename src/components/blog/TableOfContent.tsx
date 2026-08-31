"use client";

import Drawer, { useDrawerContext } from "@/components/common/Drawer";
import { useThemeValue } from "@/store/theme";
import { cn } from "@/utils/css";
import { Portal } from "@ariakit/react/portal";
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
  depth?: number;
}

interface UseActiveAnchorOptions {
  headings: Toc;
  headerHeight: number;
}

interface UseScrollToHeadingOptions {
  headerHeight: number;
  onActiveChange?: (id: string) => void;
}

/**
 * `TocEntry.children` nests, so the scroll spy has to walk the tree: iterating
 * the top level only leaves nested headings permanently un-highlightable.
 */
const flattenHeadings = (headings: Toc): TocEntry[] =>
  headings.flatMap((heading) => [
    heading,
    ...(heading.children ? flattenHeadings(heading.children) : []),
  ]);

// Custom hook for managing active anchor with intersection observer
const useActiveAnchor = ({
  headings,
  headerHeight,
}: UseActiveAnchorOptions) => {
  const [activeAnchor, setActiveAnchor] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);
  const flatHeadings = useMemo(
    () => flattenHeadings(headings ?? []),
    [headings]
  );

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
    if (!flatHeadings.length) return;

    const headingElements = flatHeadings
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
  }, [flatHeadings, headerHeight]);

  useEffect(() => {
    if (!flatHeadings.length) return;

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
    const headingElements = flatHeadings
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
  }, [flatHeadings, headerHeight, handleIntersection, setInitialActiveAnchor]);

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
  depth = 0,
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
    <li
      className={cn(
        "my-2 font-semibold",
        // Smaller and lighter than the top-level entry it sits under.
        depth > 0 && "my-1 text-sm font-normal"
      )}
    >
      <a
        href={`#${heading.id}`}
        className={cn(
          "anchor hover:text-theme-primary transition-colors duration-200",
          isActive
            ? "anchor--is-active text-theme-primary"
            : "text-theme-on-surface"
        )}
        onClick={handleClick}
        aria-current={isActive ? "location" : undefined}
      >
        <span>#</span>&nbsp;
        <span>{heading.value}</span>
      </a>

      {heading.children?.length ? (
        <TocList
          headings={heading.children}
          activeAnchor={activeAnchor}
          onAnchorClick={onAnchorClick}
          hideDrawer={hideDrawer}
          depth={depth + 1}
        />
      ) : null}
    </li>
  );
};

// TOC List component
const TocList = ({
  headings,
  activeAnchor,
  onAnchorClick,
  hideDrawer = false,
  depth = 0,
}: {
  headings: Toc;
  activeAnchor: string;
  onAnchorClick: TocItemProps["onAnchorClick"];
  hideDrawer?: boolean;
  depth?: number;
}) => {
  if (!headings?.length) return null;

  const isRoot = depth === 0;

  return (
    <ul
      className={cn(
        "mt-5",
        !isRoot && "border-theme-on-surface/20 mt-1 ml-2 border-l pl-3"
      )}
      // Only the outermost list is the landmark; nesting them would announce
      // one per level.
      role={isRoot ? "navigation" : undefined}
      aria-label={isRoot ? "Table of contents" : undefined}
    >
      {headings.map((heading) => (
        <TocItem
          key={heading.id}
          heading={heading}
          activeAnchor={activeAnchor}
          onAnchorClick={onAnchorClick}
          hideDrawer={hideDrawer}
          depth={depth}
        />
      ))}
    </ul>
  );
};

// Mobile TOC trigger button
const MobileTocTrigger = () => (
  <Portal>
    <BsFillMenuButtonWideFill
      className="fixed bottom-0 left-0 z-10 mb-20 ml-10 block size-8 cursor-pointer opacity-20 transition-all duration-300 hover:opacity-75 focus:outline-hidden lg:hidden"
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
      {/*
        Nested headings make this list long enough to outgrow the viewport, and a
        sticky element taller than the viewport puts its tail permanently out of
        reach. `lg:` gates on width, so a short laptop window still hits this.
      */}
      {headings?.length > 0 && (
        <div className="table-of-content__list top-header-height sticky hidden max-h-[calc(100vh-var(--header-height)-2rem)] overflow-y-auto pt-5 lg:block">
          <h2 className="heading mt-10 text-2xl">Table of Content</h2>

          {/* Mobile Drawer */}
          <Drawer
            position="left"
            size={300}
            title="Table of Content"
            trigger={<MobileTocTrigger />}
            className="[&_.drawer\_\_content]:max-w-[calc(100%-2rem)]!"
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
