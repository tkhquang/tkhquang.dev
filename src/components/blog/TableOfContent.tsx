"use client";

import Drawer, {
  DrawerTrigger,
  useDrawerContext,
} from "@/components/common/Drawer";
import { useThemeValue } from "@/store/theme";
import { cn } from "@/utils/css";
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
/* The spy picks the heading nearest the header line, so a short final
   section whose heading never climbs that high can never win it. At the
   document's very bottom the last heading takes the highlight instead. */
const isAtDocumentBottom = () =>
  window.innerHeight + window.scrollY >=
  document.documentElement.scrollHeight - 2;

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
  const lastHeadingId = flatHeadings[flatHeadings.length - 1]?.id;

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      /* Intersections are delivered after scroll events in the same frame,
         so without this the observer would overwrite the pin below on the
         last frame of a fling and strand the highlight mid-document. */
      if (lastHeadingId && isAtDocumentBottom()) {
        setActiveAnchor(lastHeadingId);
        return;
      }

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
    [headerHeight, lastHeadingId]
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

  /* The cheap fast path for the same pin: a scroll that ends at the
     bottom without moving any heading across the observer's threshold
     delivers no intersection at all. */
  useEffect(() => {
    if (!lastHeadingId) return;

    const onScroll = () => {
      if (isAtDocumentBottom()) {
        setActiveAnchor(lastHeadingId);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [lastHeadingId]);

  return activeAnchor;
};

// Custom hook for smooth scrolling to headings
const useScrollToHeading = ({ headerHeight }: UseScrollToHeadingOptions) => {
  const scrollToHeading = useCallback(
    (heading: TocEntry, e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();

      if (!heading.id) return;

      const element = document.getElementById(heading.id);
      if (!element) return;

      const targetY =
        element.getBoundingClientRect().top + window.pageYOffset - headerHeight;

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      window.scrollTo({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        top: targetY,
      });

      /* Keep the section in the address bar so a copied URL carries it.
         replaceState, never pushState: an added entry per click would put
         hash stops between the post and the feed, and the header logo's
         sacred back()-based return would land on a stale hash of the same
         article instead of the feed. replaceState adds nothing to walk
         through and never scrolls, so the offset above stays in charge. */
      history.replaceState(null, "", `#${heading.id}`);
    },
    [headerHeight]
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
        "font-semibold",
        // Smaller and lighter than the top-level entry it sits under.
        depth > 0 && "text-sm font-normal"
      )}
    >
      <a
        href={`#${heading.id}`}
        className={cn(
          "anchor -ml-px block border-l-2 py-1 leading-snug transition-colors duration-200",
          isActive
            ? "anchor--is-active border-theme-primary text-theme-primary"
            : /* 85, not 75: under the rail's idle 75 percent dim the product
                 of the two opacities has to stay past the 4.5 contrast floor */
              "text-theme-on-surface hover:text-theme-primary border-transparent opacity-85 hover:opacity-100"
        )}
        style={{ paddingLeft: `${0.75 + depth * 0.75}rem` }}
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
        // One shared hairline rail; nesting indents via the link padding
        isRoot && "border-theme-hairline-soft mt-4 border-l"
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

/* These classes ride the disclosure BUTTON itself, never a bare icon
   inside one: the visible control has to be the focusable one, or the real
   button ends up in a hidden container where only pointer events reach it
   and keyboard or assistive tech cannot open the drawer at all. The whole
   button floats through a Portal, per the house rule for fixed-position
   controls. */
const MOBILE_TRIGGER_CLASS =
  "fixed bottom-0 left-0 z-10 mb-20 ml-10 block cursor-pointer opacity-20 transition-opacity duration-300 hover:opacity-75 focus-visible:opacity-75 xl:hidden";

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
  const scrollToHeading = useScrollToHeading({ headerHeight });

  return (
    <section
      /* mx-4 pads the fixed mobile box only: at xl the row's gap owns the
         spacing, and a margin here would widen this flank's footprint past
         its flex-1 twin and nudge the article off center. min-w-0 matches
         the right flank so a long heading cannot do the same. */
      className="table-of-content group fixed bottom-0 left-0 mx-4 flex min-w-0 flex-1 flex-col items-end font-bold xl:relative xl:mx-0"
      aria-label="Table of contents navigation"
    >
      {/*
        Nested headings make this list long enough to outgrow the viewport, and a
        sticky element taller than the viewport puts its tail permanently out of
        reach. `xl:` gates on width, so a short laptop window still hits this.
        overflow-y-auto also makes this a scroll container that clips left
        overflow, so pl-3 keeps the progress star and its glow (which hang
        left of the rail hairline) inside the clip; items-end on the section
        pins the right edge, so the padding grows leftward and nothing moves.
        pb-2 gives the glow's 7px bottom overhang room when the star reaches
        the rail foot, or the container grows a scrollbar at full scroll.
      */}
      {headings?.length > 0 && (
        <>
          <div className="table-of-content__list top-header-height sticky hidden max-h-[calc(100vh-var(--header-height)-2rem)] overflow-y-auto pt-5 pb-2 pl-3 xl:block">
            {/*
              The idle dim sits on the header and list wrappers instead of the
              section so the progress star stays legible on the dimmed rail;
              hovering anywhere in the section still restores full ink.
              75 percent is the dim floor: the inactive links underneath carry
              their own 85 percent ink, and 0.75 x 0.85 is the last step that
              keeps them past the 4.5 contrast ratio the dark theme needs.
              The dim rides a wrapper rather than the kicker itself, because
              the kicker utility already sets an opacity: on the same element
              the two collide at equal specificity and the dim simply replaces
              the kicker's ink instead of multiplying with it, which would put
              this header a step brighter than the one PostAside mirrors.
            */}
            <div className="transition-opacity duration-500 xl:opacity-75 xl:group-hover:opacity-100">
              <h2 className="kicker mt-10 mb-1 block">On this page</h2>
            </div>

            {/* Desktop TOC List, with the scroll-driven progress star riding
                the rail hairline (styles and gating in RailSky.css) */}
            <div className="relative">
              <span className="toc-progress-star" aria-hidden />
              <div className="transition-opacity duration-500 xl:opacity-75 xl:group-hover:opacity-100">
                <TocList
                  headings={headings}
                  activeAnchor={activeAnchor}
                  onAnchorClick={scrollToHeading}
                />
              </div>
            </div>
          </div>

          {/* Mobile Drawer, its floating opener composed right here as the
              trigger: a real portaled button, hidden at xl */}
          <Drawer
            position="left"
            size={300}
            title="On this page"
            trigger={
              <DrawerTrigger
                portal
                aria-label="Open table of contents"
                className={MOBILE_TRIGGER_CLASS}
              >
                <BsFillMenuButtonWideFill className="size-8" aria-hidden />
              </DrawerTrigger>
            }
            className="[&_.drawer\_\_content]:max-w-[calc(100%-2rem)]!"
          >
            <TocList
              headings={headings}
              activeAnchor={activeAnchor}
              onAnchorClick={scrollToHeading}
              hideDrawer={true}
            />
          </Drawer>
        </>
      )}
    </section>
  );
}
