"use client";

import { useEffect, useState } from "react";

export default function TableOfContent({ headings }: { headings: any }) {
  const [activeAnchor, setActiveAnchor] = useState<string>("");
  const headerHeight = 60;

  useEffect(() => {
    if (!headings?.length) return;

    // Check initial state (for anchor navigation)
    const checkInitialActiveSection = () => {
      const headingElements = headings
        .map((heading: any) => document.getElementById(heading.id))
        .filter(Boolean);

      let maxVisibleArea = 0;
      let activeId = "";

      headingElements.forEach((element: Element) => {
        const rect = element.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        // Calculate visible area considering header height
        const elementTop = Math.max(rect.top, headerHeight);
        const elementBottom = Math.min(rect.bottom, viewportHeight);
        const visibleHeight = Math.max(0, elementBottom - elementTop);

        if (visibleHeight > maxVisibleArea) {
          maxVisibleArea = visibleHeight;
          activeId = element.id;
        }
      });

      if (activeId) {
        setActiveAnchor(activeId);
      }
    };

    // Check initial state after a short delay to ensure DOM is ready
    setTimeout(checkInitialActiveSection, 100);

    const observer = new IntersectionObserver(
      (entries) => {
        // Get all currently intersecting entries with their ratios
        const intersectingEntries = entries.filter(
          (entry) => entry.isIntersecting
        );

        if (intersectingEntries.length === 0) return;

        // Find the entry with the largest intersection ratio
        let maxRatio = 0;
        let activeId = "";

        intersectingEntries.forEach((entry) => {
          if (entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            activeId = entry.target.id;
          }
        });

        if (activeId) {
          setActiveAnchor(activeId);
        }
      },
      {
        // Account for header height
        rootMargin: `-${headerHeight}px 0px 0px 0px`,
        threshold: Array.from({ length: 21 }, (_, i) => i * 0.05), // 0, 0.05, 0.1, ..., 1.0
      }
    );

    // Observe all headings
    const headingElements = headings
      .map((heading: any) => document.getElementById(heading.id))
      .filter(Boolean);

    headingElements.forEach((element: Element) => {
      observer.observe(element);
    });

    // Also listen for scroll events to handle edge cases
    const handleScroll = (() => {
      // Debounce to avoid too frequent updates
      clearTimeout(handleScroll.timeoutId);
      handleScroll.timeoutId = setTimeout(() => {
        checkInitialActiveSection();
      }, 50);
    }) as any;

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(handleScroll.timeoutId);
      headingElements.forEach((element: Element) => {
        observer.unobserve(element);
      });
    };
  }, [headings]);

  return (
    <section className="table-of-content fixed bottom-0 left-0 z-fg mx-4 flex flex-1 flex-col items-end font-bold transition-opacity duration-500 lg:relative lg:opacity-50 lg:hover:opacity-100">
      {headings?.length! > 0 && (
        <div className="table-of-content__list sticky top-[60px] hidden pt-5 lg:block">
          <h2 className="heading mt-10 text-2xl">Table of Content</h2>
          <ul className="mt-5">
            {headings!.map((heading: any) => (
              <li key={heading.id} className="my-2">
                <a
                  href={`#${heading.id}`}
                  className={`anchor transition-colors duration-200 hover:text-theme-primary ${
                    activeAnchor === heading.id
                      ? "anchor--is-active text-theme-primary"
                      : "text-gray-600"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.getElementById(heading.id);
                    if (element) {
                      // Smooth scroll with header offset
                      const y =
                        element.getBoundingClientRect().top +
                        window.pageYOffset -
                        headerHeight;
                      window.scrollTo({ behavior: "smooth", top: y });
                      setActiveAnchor(heading.id);
                    }
                  }}
                >
                  <span>#</span>&nbsp;
                  <span>{heading.value}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
