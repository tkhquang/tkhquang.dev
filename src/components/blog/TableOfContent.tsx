"use client";

import { useThemeValue } from "@/store/theme";
import { useEffect, useMemo, useState } from "react";

export default function TableOfContent({ headings }: { headings: any }) {
  const [activeAnchor, setActiveAnchor] = useState<string>("");
  const { cssVariables } = useThemeValue();
  const headerHeight = useMemo(() => {
    return parseFloat(String(cssVariables["header-height"])) || 60;
  }, [cssVariables]);

  useEffect(() => {
    if (!headings?.length) return;

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      // Find the heading whose top is closest to the header (but not above it)
      let minDelta = Number.POSITIVE_INFINITY;
      let currentId = "";

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const rect = (entry.target as HTMLElement).getBoundingClientRect();
          // Distance from element top to header bottom
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
    };

    const observer = new window.IntersectionObserver(handleIntersection, {
      rootMargin: `-${headerHeight}px 0px 0px 0px`,
      threshold: 0.1, // Only care when a section is at least 10% visible
    });

    const headingElements = headings
      .map((heading: any) => document.getElementById(heading.id))
      .filter(Boolean);

    headingElements.forEach((element: Element) => {
      observer.observe(element);
    });

    // On mount, set active anchor according to scroll position (in case of anchor links)
    const setInitialActive = () => {
      let foundId = "";
      for (const element of headingElements) {
        const rect = element.getBoundingClientRect();
        if (rect.top - headerHeight <= 1) {
          foundId = element.id;
        }
      }
      if (foundId) setActiveAnchor(foundId);
      else if (headingElements.length > 0)
        setActiveAnchor(headingElements[0].id);
    };
    setTimeout(setInitialActive, 100);

    return () => {
      headingElements.forEach((element: Element) => {
        observer.unobserve(element);
      });
    };
  }, [headerHeight, headings]);

  return (
    <section className="table-of-content fixed bottom-0 left-0 mx-4 flex flex-1 flex-col items-end font-bold transition-opacity duration-500 lg:relative lg:opacity-50 lg:hover:opacity-100">
      {headings?.length! > 0 && (
        <div className="table-of-content__list sticky top-header-height hidden pt-5 lg:block">
          <h2 className="heading mt-10 text-2xl">Table of Content</h2>
          <ul className="mt-5">
            {headings!.map((heading: any) => (
              <li key={heading.id} className="my-2">
                <a
                  href={`#${heading.id}`}
                  className={`anchor transition-colors duration-200 hover:text-theme-primary ${
                    activeAnchor === heading.id
                      ? "anchor--is-active text-theme-primary"
                      : "text-theme-secondary"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.getElementById(heading.id);
                    if (element) {
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
