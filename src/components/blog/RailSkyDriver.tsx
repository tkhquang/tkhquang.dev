"use client";

import { useEffect } from "react";

/*
 * Reading Sky fallback for browsers without CSS scroll-driven animations
 * (Firefox stable still keeps animation-timeline behind a flag): a
 * passive, rAF-coalesced scroll listener drives the same ignition
 * windows and TOC star travel that RailSky.css declares. Where the CSS
 * feature exists this effect returns before touching anything, so
 * supporting browsers stay on the zero-JS compositor path.
 */

/* The exact windows RailSky.css declares, as contain-progress percents */
const WINDOWS: [string, number, number][] = [
  ["rail-star--s1", 2, 9],
  ["rail-star--s2", 8, 16],
  ["rail-star--s3", 15, 23],
  ["rail-star--s4", 23, 31],
  ["rail-star--s5", 31, 39],
  ["rail-star--s6", 40, 48],
  ["rail-star--s7", 50, 58],
  ["rail-star--s8", 60, 68],
  ["rail-star--s9", 70, 78],
  ["rail-figure--l1", 16, 22],
  ["rail-figure--l2", 23, 29],
  ["rail-figure--l3", 31, 37],
  ["rail-figure--l4", 39, 45],
  ["rail-figure--l5", 48, 54],
  ["rail-figure--l6", 58, 64],
  ["rail-figure--l7", 68, 74],
  ["rail-figure--l8", 78, 86],
];

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

const RailSkyDriver = () => {
  useEffect(() => {
    if (
      typeof CSS !== "undefined" &&
      CSS.supports("animation-timeline: scroll()")
    ) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      /* The static finished figure IS the reduced-motion design */
      return;
    }

    const article = document.querySelector<HTMLElement>(".post-row__article");
    if (!article) {
      return;
    }
    const targets = WINDOWS.map(([className, start, end]) => ({
      el: document.querySelector<SVGElement>(`.rail-sky .${className}`),
      end,
      start,
    })).filter((target) => target.el);
    /* The star travels with the PROSE, not the whole article section:
       tags, the author card, and comments trail inside .post-row__article,
       so against that longer box the star seats well past the reader's
       actual place. No fallback: without the prose box the star simply
       rests, rather than silently going back to the wrong measure. */
    const prose = document.querySelector<HTMLElement>(".article__content");
    const tocStar = document.querySelector<HTMLElement>(".toc-progress-star");
    const wide = window.matchMedia("(min-width: 80rem)");
    let rafId = 0;

    const clear = () => {
      for (const target of targets) {
        target.el!.style.opacity = "";
      }
      if (tocStar && prose) {
        tocStar.style.transform = "";
      }
    };

    const apply = () => {
      rafId = 0;
      if (!wide.matches) {
        /* Below xl the rails are hidden; rest on the finished figure */
        clear();
        return;
      }
      /* Contain progress of the article against the viewport: 0 when its
         top reaches the viewport top, 1 when its bottom meets the
         viewport bottom, matching the CSS timeline's contain range */
      const rect = article.getBoundingClientRect();
      const denominator = Math.max(rect.height - window.innerHeight, 1);
      const progress = clamp01(-rect.top / denominator) * 100;

      for (const target of targets) {
        target.el!.style.opacity = String(
          clamp01((progress - target.start) / (target.end - target.start))
        );
      }
      if (tocStar && prose) {
        /* Same contain formula against the prose box (--article-prose in
           the CSS path), so the star seats as the last section is read */
        const proseRect = prose.getBoundingClientRect();
        const proseDenominator = Math.max(
          proseRect.height - window.innerHeight,
          1
        );
        const proseProgress = clamp01(-proseRect.top / proseDenominator);

        const travel = Math.max(tocStar.clientHeight - 7, 0);
        const offset = (-travel * (1 - proseProgress)).toFixed(1);
        tocStar.style.transform = `translateY(${offset}px)`;
      }
    };

    const schedule = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(apply);
      }
    };

    apply();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      clear();
    };
  }, []);

  return null;
};

export default RailSkyDriver;
